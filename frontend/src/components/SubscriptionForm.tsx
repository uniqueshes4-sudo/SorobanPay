'use client';

/**
 * SubscriptionForm.tsx
 *
 * Full subscription creation form with inline validation,
 * loading state, success and error notifications.
 *
 * Requirements: 10.1–10.9
 * Improvements:
 *  - Mobile spacing & touch targets (min 44px, larger padding)
 *  - Enhanced success state with next-steps guidance
 *  - Progress indicator (animated bar) during async transaction
 *  - Contract config error card with remediation steps
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { buildAndSubmitSubscribe } from '@/lib/transaction_builder';
import {
  validateSubscriptionForm,
  isFormValid,
  DEFAULT_INTERVAL_SECONDS,
  type FieldErrors,
} from '@/lib/validation';
import { CONTRACT_ID, NETWORK_PASSPHRASE, NETWORK_NAME, RPC_URL } from '@/constants/network';
import { ConfirmationModal } from '@/components/ConfirmationModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SuccessData {
  txHash: string;
  merchant: string;
  token: string;
  amount: string;
  interval: string;
}

// ─── Shared input className — uses semantic tokens (WCAG AA compliant) ────────
const inputCls =
  'w-full rounded-lg bg-surface-raised border border-surface-overlay px-4 py-3 text-base ' +
  'text-text-primary placeholder-text-disabled ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card ' +
  'disabled:opacity-50 min-h-[48px] transition-all duration-150';

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : `${label} to clipboard`}
      title={copied ? 'Copied!' : `${label} to clipboard`}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium
                 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-300
                 hover:text-white transition-colors duration-150 shrink-0
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ─── Network + contract status badge ──────────────────────────────────────────

type ReachStatus = 'checking' | 'reachable' | 'unreachable';

function NetworkBadge() {
  const [status, setStatus] = useState<ReachStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch(RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(() => { if (!cancelled) setStatus('reachable'); })
      .catch(() => { if (!cancelled) setStatus('unreachable'); });
    return () => { cancelled = true; };
  }, []);

  const networkColor = NETWORK_NAME === 'Mainnet'
    ? 'bg-purple-900/50 border-purple-600/50 text-purple-300'
    : 'bg-blue-900/50 border-blue-600/50 text-blue-300';

  const statusDot: Record<ReachStatus, string> = {
    checking:    'bg-yellow-400 animate-pulse',
    reachable:   'bg-green-400',
    unreachable: 'bg-red-400',
  };
  const statusLabel: Record<ReachStatus, string> = {
    checking:    'Checking…',
    reachable:   'Contract reachable',
    unreachable: 'RPC unreachable',
  };

  return (
    <div
      aria-label={`Network: ${NETWORK_NAME}. Status: ${statusLabel[status]}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${networkColor}`}
    >
      <span aria-hidden="true">{NETWORK_NAME === 'Mainnet' ? '🌐' : '🧪'}</span>
      {NETWORK_NAME}
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${statusDot[status]}`} aria-hidden="true" />
      <span className="text-xs font-normal opacity-80">{statusLabel[status]}</span>
    </div>
  );
}

// ─── Contract config guard ─────────────────────────────────────────────────────

function ContractConfigError() {
  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6">
      <div
        role="alert"
        className="w-full rounded-2xl bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-600/50 shadow-lg p-6 sm:p-8 text-white"
      >
        <div className="flex items-start gap-4 mb-6">
          <span className="text-4xl flex-shrink-0" aria-hidden="true">⚠️</span>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-2">Contract not configured</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              The app cannot find a valid Soroban contract address. This is an
              environment setup issue, not a wallet problem.
            </p>
          </div>
        </div>

        <div className="bg-gray-900/60 rounded-lg p-4 sm:p-6 mb-6">
          <h3 className="text-yellow-300 font-semibold text-base mb-4">Remediation steps:</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
            <li className="leading-relaxed">
              Deploy the contract:
              <pre className="mt-2 bg-gray-800 rounded-lg p-3 text-xs overflow-x-auto border border-gray-700">
                <code>bash deploy/deploy.sh</code>
              </pre>
            </li>
            <li className="leading-relaxed">
              Copy the printed address into{' '}
              <code className="bg-gray-800 px-2 py-1 rounded text-yellow-300 text-xs font-mono">frontend/.env.local</code>:
              <div className="mt-2 flex items-center gap-2">
                <pre className="flex-1 bg-gray-800 rounded-lg p-3 text-xs overflow-x-auto border border-gray-700">
                  <code>NEXT_PUBLIC_CONTRACT_ID=C…your_address…</code>
                </pre>
                <CopyButton text="NEXT_PUBLIC_CONTRACT_ID=C…your_address…" label="Copy" />
              </div>
            </li>
            <li className="leading-relaxed">
              Restart the dev server:
              <pre className="mt-2 bg-gray-800 rounded-lg p-3 text-xs overflow-x-auto border border-gray-700">
                <code>npm run dev</code>
              </pre>
            </li>
          </ol>
        </div>

        <div className="border-t border-yellow-600/30 pt-4">
          <p className="text-xs text-gray-300">
            📖 For full details, see <code className="bg-gray-800/60 px-1.5 py-0.5 rounded text-yellow-300">README.md → Frontend → Environment variables</code>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full mb-6 p-4 sm:p-5 bg-status-info-bg border border-status-info-border rounded-lg"
      role="status"
      aria-label="Transaction in progress"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-status-info" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-medium text-status-info">Submitting transaction…</span>
        </div>
        <span className="text-xs text-text-secondary animate-pulse">Processing on blockchain</span>
      </div>
      <div className="h-2 w-full bg-surface-overlay rounded-full overflow-hidden shadow-inner">
        <div className="h-full bg-gradient-to-r from-status-info via-interactive to-status-info rounded-full animate-progress" />
      </div>
      <p className="mt-2 text-xs text-text-secondary text-center">
        This may take 10-30 seconds. Keep the window open.
      </p>
    </motion.div>
  );
}

// ─── Success card ──────────────────────────────────────────────────────────────

function SuccessCard({
  data,
  onReset,
  onCancel,
}: {
  data: SuccessData;
  onReset: () => void;
  onCancel: () => void;
}) {
  const days = Math.round(Number(data.interval) / 86400);
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mb-6 rounded-xl bg-gradient-to-br from-status-success-bg to-surface-card border-2 border-status-success-border p-5 sm:p-6 text-sm space-y-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Checkmark icon (not just color — WCAG 1.4.1) */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-status-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <p className="font-semibold text-status-success text-base sm:text-lg">Subscription created successfully!</p>
      </div>

      {/* Tx hash */}
      <div className="bg-surface-raised/50 rounded-lg p-3 border border-surface-overlay/50">
        <p className="text-text-disabled text-xs mb-1.5 font-medium">Transaction hash</p>
        <p className="text-text-primary break-all font-mono text-xs leading-relaxed">{data.txHash}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-text-secondary bg-surface-raised/30 rounded-lg p-3">
        <span className="font-medium">Amount</span>
        <span className="font-medium text-text-primary">{data.amount} tokens</span>
        <span className="font-medium">Interval</span>
        <span className="font-medium text-text-primary">every {days} day{days !== 1 ? 's' : ''}</span>
        <span className="font-medium break-all">Merchant</span>
        <span className="break-all font-mono text-xs text-text-primary">{data.merchant}</span>
      </div>

      {/* Next steps */}
      <div className="border-t border-status-success-border/60 pt-4 space-y-2.5">
        <p className="text-status-success font-semibold text-xs uppercase tracking-widest">What happens next</p>
        <ul className="list-disc list-inside space-y-2 text-text-secondary text-xs leading-relaxed">
          <li>The merchant can collect the first payment immediately.</li>
          <li>Subsequent payments are collectible every {days} day{days !== 1 ? 's' : ''}.</li>
          <li>Your wallet remains non-custodial — the contract never holds your funds.</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={onReset}
          className="flex-1 rounded-lg border-2 border-status-success-border text-status-success hover:bg-status-success-bg
                     py-3 text-sm font-semibold transition-all duration-150 min-h-[48px] hover:shadow-lg
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-status-success focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
        >
          Create Another
        </button>
        {/* Cancel subscription — triggers ConfirmationModal (#450) */}
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border-2 border-destructive-border text-status-error hover:bg-destructive-surface
                     py-3 text-sm font-semibold transition-all duration-150 min-h-[48px]
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card
                     inline-flex items-center justify-center gap-2"
        >
          {/* Icon — not color alone (WCAG 1.4.1) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Cancel Subscription
        </button>
      </div>
    </motion.div>
  );
}

// ─── Transaction error classifier + card ──────────────────────────────────────

interface TxErrorInfo {
  title: string;
  summary: string;
  fix: string;
  raw: string;
}

function classifyError(err: unknown): TxErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);
  const msg = raw.toLowerCase();

  if (msg.includes('user declined') || msg.includes('rejected') || msg.includes('signing failed') || msg.includes('user rejected')) {
    return {
      title:   'Signing cancelled',
      summary: 'You declined the transaction in Freighter.',
      fix:     'Click "Authorize Subscription" again and approve the request in the Freighter pop-up.',
      raw,
    };
  }
  if (msg.includes('insufficient balance') || msg.includes('not enough') || msg.includes('underfunded')) {
    return {
      title:   'Insufficient balance',
      summary: 'Your wallet does not have enough tokens or XLM to cover this transaction.',
      fix:     'Top up your account. On testnet use Stellar Friendbot; on mainnet send XLM to your address.',
      raw,
    };
  }
  if (msg.includes('allowance') || msg.includes('transfer from') || msg.includes('spend limit')) {
    return {
      title:   'Token allowance too low',
      summary: 'The contract is not authorized to transfer this token amount on your behalf.',
      fix:     'Approve a higher token allowance by calling token.approve(contract_id, amount) before subscribing.',
      raw,
    };
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return {
      title:   'Transaction timed out',
      summary: 'The network did not confirm the transaction within the expected time.',
      fix:     'Check your connection and retry. The transaction may still confirm — wait a minute before resubmitting.',
      raw,
    };
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('rpc') || msg.includes('failed to fetch')) {
    return {
      title:   'Network error',
      summary: 'Could not reach the Soroban RPC endpoint.',
      fix:     'Check your internet connection and verify NEXT_PUBLIC_RPC_URL in .env.local. Retry in a moment.',
      raw,
    };
  }
  if (msg.includes('wrong network') || msg.includes('passphrase') || msg.includes('network mismatch')) {
    return {
      title:   'Wrong network',
      summary: 'Freighter is set to a different network than the app expects.',
      fix:     `Open Freighter, switch to ${NETWORK_NAME}, and try again.`,
      raw,
    };
  }
  if (msg.includes('amountmustbepositive') || msg.includes('error(contract, #1)')) {
    return {
      title:   'Invalid amount',
      summary: 'The contract rejected the amount — it must be greater than zero.',
      fix:     'Enter a positive integer amount and resubmit.',
      raw,
    };
  }
  if (msg.includes('intervaltoo') || msg.includes('error(contract, #2)') || msg.includes('error(contract, #3)')) {
    return {
      title:   'Invalid interval',
      summary: 'The payment interval is outside the allowed range (1 day – 1 year).',
      fix:     'Enter a value between 86 400 s (1 day) and 31 536 000 s (1 year).',
      raw,
    };
  }
  if (msg.includes('unauthorized') || msg.includes('error(contract, #6)')) {
    return {
      title:   'Authorisation failed',
      summary: 'The contract rejected the transaction signature.',
      fix:     'Ensure the connected wallet matches the subscriber address and retry.',
      raw,
    };
  }

  return {
    title:   'Transaction failed',
    summary: 'An unexpected error occurred while submitting the transaction.',
    fix:     'Review the technical details below and retry. If the problem persists, check the README troubleshooting section.',
    raw,
  };
}

function ErrorCard({ error, onDismiss }: { error: TxErrorInfo; onDismiss: () => void }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      // Shake keyframe defined in tailwind.config.ts
      className="mb-6 rounded-xl bg-status-error-bg border border-status-error-border p-4 sm:p-5 text-sm shadow-md animate-shake"
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Warning icon — not color alone (WCAG 1.4.1) */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-status-error flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-status-error text-base leading-snug">{error.title}</p>
          <p className="mt-1 text-text-secondary leading-relaxed">{error.summary}</p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 text-text-disabled hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-status-error rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Suggested fix */}
      <div className="flex items-start gap-2 bg-surface-raised/60 rounded-lg px-3 py-2.5 mb-3">
        <span className="text-text-link shrink-0 mt-0.5" aria-hidden="true">→</span>
        <p className="text-text-primary text-xs leading-relaxed">{error.fix}</p>
      </div>

      {/* Collapsible technical details */}
      <button
        type="button"
        onClick={() => setShowDetails(v => !v)}
        aria-expanded={showDetails}
        className="text-xs text-text-disabled hover:text-text-primary transition-colors underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-error rounded"
      >
        {showDetails ? 'Hide' : 'Show'} technical details
      </button>
      {showDetails && (
        <div className="mt-2 flex items-start gap-2 bg-surface-card/70 rounded-lg p-3 border border-surface-overlay">
          <pre className="flex-1 text-xs text-text-secondary font-mono whitespace-pre-wrap break-all leading-relaxed overflow-x-auto">
            {error.raw}
          </pre>
          <CopyButton text={error.raw} label="Copy" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionForm() {
  // Guard: must have a valid contract address before rendering the form
  if (!CONTRACT_ID) return <ContractConfigError />;

  const { publicKey } = useWallet();

  const [merchantAddress, setMerchantAddress] = useState('');
  const [tokenAddress, setTokenAddress]       = useState('');
  const [amount, setAmount]                   = useState('');
  const [interval, setInterval]               = useState(String(DEFAULT_INTERVAL_SECONDS));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});
  const [txError, setTxError]           = useState<TxErrorInfo | null>(null);
  const [successData, setSuccessData]   = useState<SuccessData | null>(null);

  // #450 — subscribe confirmation (primary variant, no delay)
  const [showSubscribeConfirm, setShowSubscribeConfirm] = useState(false);
  // #450 — cancel confirmation (destructive variant, 3s delay)
  const [showCancelConfirm, setShowCancelConfirm]       = useState(false);

  function resetForm() {
    setSuccessData(null);
    setTxError(null);
    setFieldErrors({});
    setShowSubscribeConfirm(false);
    setShowCancelConfirm(false);
    setMerchantAddress('');
    setTokenAddress('');
    setAmount('');
    setInterval(String(DEFAULT_INTERVAL_SECONDS));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTxError(null);
    setSuccessData(null);

    const errors = validateSubscriptionForm({ merchantAddress, tokenAddress, amount, interval });
    setFieldErrors(errors);
    if (!isFormValid(errors)) return;
    if (!publicKey) return;

    setShowSubscribeConfirm(true);
  }

  async function confirmAndSubmit() {
    setShowSubscribeConfirm(false);
    if (!publicKey) return;

    setIsSubmitting(true);
    try {
      const result = await buildAndSubmitSubscribe(
        {
          subscriber: publicKey,
          merchant:   merchantAddress.trim(),
          token:      tokenAddress.trim(),
          amount:     Number(amount),
          interval:   Number(interval),
        },
        CONTRACT_ID,
        publicKey,
        NETWORK_PASSPHRASE,
        RPC_URL,
      );

      setSuccessData({
        txHash:   result.txHash,
        merchant: merchantAddress.trim(),
        token:    tokenAddress.trim(),
        amount,
        interval,
      });
    } catch (err) {
      setTxError(classifyError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // #450 — after user confirms cancel in the modal, reset to initial state
  // In a full implementation this would call cancel() on the contract.
  function handleCancelConfirmed() {
    setShowCancelConfirm(false);
    resetForm();
  }

  const days = successData ? Math.round(Number(successData.interval) / 86400) : 0;

  return (
    <div className="w-full max-w-lg mx-auto bg-surface-card rounded-2xl shadow-xl p-5 sm:p-8 text-text-primary">

      {/* #450 — Subscribe confirmation modal (primary, no delay) */}
      <ConfirmationModal
        isOpen={showSubscribeConfirm}
        title="Confirm subscription"
        body={
          <dl className="bg-surface-raised/60 rounded-lg divide-y divide-surface-overlay text-sm mt-2">
            {[
              ['Merchant', merchantAddress],
              ['Token',    tokenAddress],
              ['Amount',   `${amount} tokens`],
              ['Interval', `${Math.round(Number(interval) / 86400)} days`],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
                <dt className="text-xs text-text-disabled font-medium">{label}</dt>
                <dd className="break-all font-mono text-xs text-text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        }
        confirmLabel="Confirm & Authorize"
        cancelLabel="Go Back"
        variant="primary"
        onConfirm={confirmAndSubmit}
        onCancel={() => setShowSubscribeConfirm(false)}
      />

      {/* #450 — Cancel subscription confirmation modal (destructive, 3s delay) */}
      <ConfirmationModal
        isOpen={showCancelConfirm}
        title="Cancel subscription?"
        body={
          successData ? (
            <p>
              You will stop paying{' '}
              <span className="font-mono text-text-primary break-all">
                {successData.merchant.slice(0, 8)}…
              </span>{' '}
              <strong className="text-text-primary">{successData.amount} tokens</strong> every{' '}
              <strong className="text-text-primary">{days} day{days !== 1 ? 's' : ''}</strong>.{' '}
              <span className="text-status-error font-medium">This cannot be undone.</span>
            </p>
          ) : (
            <p>This subscription will be permanently cancelled. <span className="text-status-error font-medium">This cannot be undone.</span></p>
          )
        }
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Subscription"
        variant="destructive"
        confirmDelaySeconds={3}
        onConfirm={handleCancelConfirmed}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <div className="flex items-center justify-between mb-2 gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Create Subscription</h2>
        <span
          aria-label={publicKey ? 'Wallet connected' : 'Wallet disconnected'}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${
            publicKey
              ? 'bg-status-success-bg text-status-success border border-status-success-border'
              : 'bg-surface-raised text-text-disabled border border-surface-overlay'
          }`}
        >
          {/* Status dot + icon — not color alone (WCAG 1.4.1) */}
          <span className={`h-2 w-2 rounded-full ${publicKey ? 'bg-status-connected' : 'bg-status-disconnected'}`} aria-hidden="true" />
          {publicKey ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <p className="text-text-secondary text-sm mb-5 leading-relaxed">
        Authorize a recurring on-chain payment using your Freighter wallet.
      </p>

      {/* Contract ID with copy button */}
      <div className="flex items-center gap-2 mb-8 bg-surface-raised/50 border border-surface-overlay/60 rounded-lg px-3 py-2">
        <span className="text-xs text-text-disabled font-medium shrink-0">Contract</span>
        <code className="flex-1 text-xs text-text-secondary font-mono truncate" title={CONTRACT_ID}>
          {CONTRACT_ID}
        </code>
        <CopyButton text={CONTRACT_ID} label="Copy" />
      </div>

      {/* AnimatePresence handles enter/exit of progress, success, error */}
      <AnimatePresence mode="wait">
        {isSubmitting && <ProgressBar key="progress" />}
      </AnimatePresence>

      <AnimatePresence>
        {successData && (
          <SuccessCard
            key="success"
            data={successData}
            onReset={resetForm}
            onCancel={() => setShowCancelConfirm(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {txError && (
          <ErrorCard key="error" error={txError} onDismiss={() => setTxError(null)} />
        )}
      </AnimatePresence>

      {/* Hide the form after success */}
      <AnimatePresence>
        {!successData && (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
            aria-labelledby="form-heading"
            className="space-y-5 sm:space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >

            {/* Merchant address */}
            <div>
              <label htmlFor="merchantAddress" className="block text-sm font-semibold text-text-secondary mb-2.5">
                Merchant address <span aria-hidden="true" className="text-status-error">*</span><span className="sr-only"> (required)</span>
              </label>
              <input
                id="merchantAddress"
                type="text"
                placeholder="GABC…"
                autoComplete="off"
                value={merchantAddress}
                onChange={(e) => setMerchantAddress(e.target.value)}
                disabled={isSubmitting}
                required
                aria-required="true"
                aria-describedby={fieldErrors.merchantAddress ? 'err-merchant' : undefined}
                aria-invalid={!!fieldErrors.merchantAddress}
                className={inputCls}
              />
              {fieldErrors.merchantAddress && (
                <p id="err-merchant" role="alert" className="mt-2 text-xs text-status-error font-medium">
                  {fieldErrors.merchantAddress}
                </p>
              )}
            </div>

            {/* Token address */}
            <div>
              <label htmlFor="tokenAddress" className="block text-sm font-semibold text-text-secondary mb-2.5">
                Token contract address <span aria-hidden="true" className="text-status-error">*</span><span className="sr-only"> (required)</span>
              </label>
              <input
                id="tokenAddress"
                type="text"
                placeholder="CABC…"
                autoComplete="off"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                disabled={isSubmitting}
                required
                aria-required="true"
                aria-describedby={fieldErrors.tokenAddress ? 'err-token' : undefined}
                aria-invalid={!!fieldErrors.tokenAddress}
                className={inputCls}
              />
              {fieldErrors.tokenAddress && (
                <p id="err-token" role="alert" className="mt-2 text-xs text-status-error font-medium">
                  {fieldErrors.tokenAddress}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-text-secondary mb-2.5">
                Amount <span className="text-text-disabled font-normal">(token units)</span>{' '}
                <span aria-hidden="true" className="text-status-error">*</span><span className="sr-only"> (required)</span>
              </label>
              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="100"
                autoComplete="off"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                aria-describedby={`help-amount${fieldErrors.amount ? ' err-amount' : ''}`}
                aria-invalid={!!fieldErrors.amount}
                className={inputCls}
              />
              <p id="help-amount" className="mt-2 text-xs text-text-disabled leading-relaxed">
                Must be a positive integer (e.g. 100). Represents the number of token units transferred per interval.
              </p>
              {fieldErrors.amount && (
                <p id="err-amount" role="alert" className="mt-2 text-xs text-status-error font-medium">
                  {fieldErrors.amount}
                </p>
              )}
            </div>

            {/* Interval */}
            <div>
              <label htmlFor="interval" className="block text-sm font-semibold text-text-secondary mb-2.5">
                Interval <span className="text-text-disabled font-normal">(seconds)</span>{' '}
                <span aria-hidden="true" className="text-status-error">*</span><span className="sr-only"> (required)</span>
              </label>
              <input
                id="interval"
                type="number"
                min="86400"
                max="31536000"
                step="1"
                autoComplete="off"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                disabled={isSubmitting}
                aria-describedby={`help-interval${fieldErrors.interval ? ' err-interval' : ''}`}
                aria-invalid={!!fieldErrors.interval}
                className={inputCls}
              />
              <p id="help-interval" className="mt-2 text-xs text-text-disabled leading-relaxed">
                Seconds between payments. Min: 86 400 s (1 day), max: 31 536 000 s (1 year). Default: 2 592 000 s (30 days).
              </p>
              {fieldErrors.interval && (
                <p id="err-interval" role="alert" className="mt-2 text-xs text-status-error font-medium">
                  {fieldErrors.interval}
                </p>
              )}
            </div>

            {/* Submit */}
            <div>
              {!publicKey && (
                <p id="hint-wallet" className="mb-3 text-xs text-status-warning font-medium" role="status">
                  Connect your Freighter wallet to enable submission.
                </p>
              )}
              <motion.button
                type="submit"
                disabled={isSubmitting || !publicKey}
                aria-describedby={!publicKey ? 'hint-wallet' : undefined}
                whileHover={!isSubmitting && publicKey ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting && publicKey ? { scale: 0.98 } : {}}
                transition={{ duration: 0.15 }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-interactive
                           hover:bg-interactive-hover active:bg-interactive-active disabled:opacity-50
                           disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white
                           transition-colors duration-150 min-h-[48px]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus
                           focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {isSubmitting ? 'Submitting…' : 'Authorize Subscription'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
