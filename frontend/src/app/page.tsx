'use client';

/**
 * page.tsx — Home page
 *
 * Renders the wallet connect/disconnect button and the subscription form.
 * Requirements: 9.1, 9.5, 9.6, 10.1
 * UX: #451 semantic colors, #452 micro-animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import SubscriptionForm from '@/components/SubscriptionForm';
import { EmptySubscriptions } from '@/components/EmptyState';
import { useWallet } from '@/hooks/useWallet';

export default function Home() {
  const {
    publicKey,
    isConnecting,
    connectError,
    freighterInstalled,
    connect,
    disconnect,
  } = useWallet();

  const shortKey = publicKey
    ? `${publicKey.slice(0, 6)}…${publicKey.slice(-4)}`
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Header */}
      <motion.div
        className="w-full max-w-lg mb-8 text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-text-primary">SorobanPay</h1>
        <p className="text-text-secondary text-sm">
          Decentralized recurring payments on Stellar
        </p>
      </motion.div>

      {/* Wallet section */}
      <div className="w-full max-w-lg mb-6">
        <AnimatePresence mode="wait">
          {!publicKey ? (
            <motion.div
              key="disconnected"
              className="bg-surface-card rounded-2xl p-6 shadow-lg"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Req 9.1 — Freighter install prompt — icon + color (WCAG 1.4.1) */}
              {!freighterInstalled && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg bg-status-warning-bg border border-status-warning-border p-3 text-sm text-status-warning flex items-start gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <span>
                    Freighter wallet is not installed.{' '}
                    <a
                      href="https://www.freighter.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-text-primary transition-colors"
                    >
                      Install Freighter
                    </a>{' '}
                    to continue.
                  </span>
                </div>
              )}

              {/* Req 9.4 — access denied error — icon + color (WCAG 1.4.1) */}
              {connectError && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg bg-status-error-bg border border-status-error-border p-3 text-sm text-status-error flex items-start gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <span>{connectError}</span>
                </div>
              )}

              <motion.button
                onClick={connect}
                disabled={isConnecting}
                whileHover={!isConnecting ? { scale: 1.02 } : {}}
                whileTap={!isConnecting ? { scale: 0.98 } : {}}
                transition={{ duration: 0.15 }}
                className="w-full rounded-lg bg-interactive hover:bg-interactive-hover disabled:opacity-50
                           disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white
                           transition-colors focus:outline-none focus:ring-2 focus:ring-interactive-focus"
              >
                {isConnecting ? 'Connecting…' : 'Connect Freighter Wallet'}
              </motion.button>
            </motion.div>
          ) : (
            /* Req 9.5 — show address and enable form actions */
            <motion.div
              key="connected"
              className="bg-surface-card rounded-2xl p-4 shadow-lg flex items-center justify-between"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <span className="text-sm text-text-secondary flex items-center gap-2">
                {/* Icon — not color alone (WCAG 1.4.1) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-status-connected" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                Connected:{' '}
                <span className="font-mono text-text-primary">{shortKey}</span>
              </span>
              {/* Req 9.6 — disconnect clears key */}
              <button
                onClick={disconnect}
                className="text-xs text-text-disabled hover:text-status-error transition-colors
                           focus:outline-none focus:ring-1 focus:ring-status-error rounded px-2 py-1"
              >
                Disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subscription form or empty/connect prompt */}
      <AnimatePresence mode="wait">
        {publicKey ? (
          <motion.div
            key="form"
            className="w-full max-w-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <SubscriptionForm />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="w-full max-w-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <EmptySubscriptions onAction={connect} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
