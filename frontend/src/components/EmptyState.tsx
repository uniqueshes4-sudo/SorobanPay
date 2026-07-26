'use client';

/**
 * EmptyState.tsx
 *
 * Empty state components for all list / history views (resolves #453 / UX-118).
 *
 * Each variant:
 * - SVG illustration (inline, works in light & dark mode via currentColor)
 * - Descriptive text — action-oriented copy
 * - Primary CTA button
 * - Visually distinct from loading/skeleton states
 * - WCAG AA compliant color tokens from tailwind.config.ts
 *
 * Available exports:
 *   <EmptySubscriptions onAction={…} />
 *   <EmptyPaymentHistory onAction={…} />
 *   <EmptyMerchantPortal onAction={…} />
 *   <EmptyWebhooks onAction={…} />
 *   <EmptyState … />  — generic (used by the four above)
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// ── Shared animation (respects prefers-reduced-motion via Framer Motion) ──────

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ── Generic empty state base component ───────────────────────────────────────

export interface EmptyStateProps {
  /** Inline SVG illustration node */
  illustration: ReactNode;
  /** Main heading */
  title: string;
  /** Supporting description */
  description: string;
  /** CTA button label */
  actionLabel: string;
  /** CTA click handler */
  onAction: () => void;
  /** Optional secondary link label */
  secondaryLabel?: string;
  /** Optional secondary link href */
  secondaryHref?: string;
  /** Optional extra class names for the wrapper */
  className?: string;
}

export function EmptyState({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  secondaryHref,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={[
        'flex flex-col items-center justify-center text-center',
        'rounded-2xl border border-surface-overlay bg-surface-card',
        'px-6 py-12 sm:py-16 space-y-5 w-full',
        className,
      ].join(' ')}
      aria-label={title}
    >
      {/* Illustration */}
      <div
        className="w-32 h-32 text-text-disabled opacity-80 mx-auto"
        aria-hidden="true"
      >
        {illustration}
      </div>

      {/* Copy */}
      <div className="space-y-2 max-w-xs">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={onAction}
        className={[
          'inline-flex items-center gap-2 rounded-lg',
          'bg-interactive hover:bg-interactive-hover active:bg-interactive-active',
          'text-white font-semibold text-sm px-5 py-2.5 min-h-[44px]',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card',
        ].join(' ')}
      >
        {actionLabel}
      </button>

      {/* Optional secondary link */}
      {secondaryLabel && secondaryHref && (
        <a
          href={secondaryHref}
          target="_blank"
          rel="noopener noreferrer"
          className={[
            'text-xs text-text-link underline underline-offset-2',
            'hover:text-text-primary transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus rounded',
          ].join(' ')}
        >
          {secondaryLabel}
        </a>
      )}
    </motion.div>
  );
}

// ── Illustrations ─────────────────────────────────────────────────────────────

/**
 * No subscriptions — credit card with a plus.
 * Uses currentColor so it adapts to both light and dark mode.
 */
function SubscriptionsIllustration() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Card body */}
      <rect x="16" y="48" width="128" height="80" rx="10" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Magnetic stripe */}
      <rect x="16" y="68" width="128" height="18" fill="currentColor" fillOpacity="0.18" />
      {/* Chip */}
      <rect x="30" y="84" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="3.5" />
      {/* Plus icon — top-right */}
      <circle cx="118" cy="48" r="18" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="3.5" />
      <line x1="118" y1="40" x2="118" y2="56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="110" y1="48" x2="126" y2="48" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * No payment history — receipt / document.
 */
function PaymentHistoryIllustration() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Receipt body */}
      <path
        d="M36 24h88a8 8 0 0 1 8 8v96l-12-10-12 10-12-10-12 10-12-10-12 10-12-10V32a8 8 0 0 1 8-8Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Lines */}
      <line x1="52" y1="56" x2="108" y2="56" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="52" y1="74" x2="92" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="52" y1="92" x2="100" y2="92" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* Clock — indicates history */}
      <circle cx="116" cy="112" r="16" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="3.5" />
      <line x1="116" y1="105" x2="116" y2="112" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="116" y1="112" x2="121" y2="117" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * No subscribers (merchant portal) — people / group.
 */
function MerchantPortalIllustration() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Person 1 (left) */}
      <circle cx="54" cy="56" r="18" stroke="currentColor" strokeWidth="5" />
      <path d="M20 128c0-18.8 15.2-34 34-34h0c18.8 0 34 15.2 34 34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Person 2 (right) — slight offset */}
      <circle cx="106" cy="56" r="18" stroke="currentColor" strokeWidth="5" strokeDasharray="4 3" />
      <path d="M72 128c0-18.8 15.2-34 34-34h0c18.8 0 34 15.2 34 34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="5 4" />
      {/* Plus icon */}
      <circle cx="128" cy="36" r="14" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="3.5" />
      <line x1="128" y1="29" x2="128" y2="43" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="121" y1="36" x2="135" y2="36" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * No webhooks — plug / connector.
 */
function WebhooksIllustration() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Plug body */}
      <rect x="60" y="72" width="40" height="50" rx="8" stroke="currentColor" strokeWidth="5" />
      {/* Prongs */}
      <line x1="72" y1="52" x2="72" y2="72" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="88" y1="52" x2="88" y2="72" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Cord */}
      <path d="M80 122 Q80 142 56 142" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Socket (disconnected) */}
      <circle cx="40" cy="94" r="18" stroke="currentColor" strokeWidth="5" />
      <line x1="34" y1="94" x2="46" y2="94" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="3 3" />
      {/* Plus icon */}
      <circle cx="126" cy="44" r="14" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="3.5" />
      <line x1="126" y1="37" x2="126" y2="51" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="119" y1="44" x2="133" y2="44" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Specific empty state variants ─────────────────────────────────────────────

/**
 * Shown on the dashboard when the user has no active subscriptions.
 */
export function EmptySubscriptions({
  onAction,
}: {
  onAction: () => void;
}) {
  return (
    <EmptyState
      illustration={<SubscriptionsIllustration />}
      title="No active subscriptions yet"
      description="Subscribe to a service to get started. Your active subscriptions will appear here."
      actionLabel="Create Subscription"
      onAction={onAction}
      secondaryLabel="Learn how subscriptions work →"
      secondaryHref="https://github.com/Chrisland58/SorobanPay#readme"
    />
  );
}

/**
 * Shown in the payment history view when there are no completed payments.
 */
export function EmptyPaymentHistory({
  onAction,
}: {
  onAction: () => void;
}) {
  return (
    <EmptyState
      illustration={<PaymentHistoryIllustration />}
      title="No payment history yet"
      description="Your payment history will appear here after your first payment is collected by a merchant."
      actionLabel="Create Your First Subscription"
      onAction={onAction}
    />
  );
}

/**
 * Shown on the merchant portal when there are no subscribers.
 */
export function EmptyMerchantPortal({
  onAction,
}: {
  onAction: () => void;
}) {
  return (
    <EmptyState
      illustration={<MerchantPortalIllustration />}
      title="No subscribers yet"
      description="Share your payment link or QR code to start accepting recurring payments from subscribers."
      actionLabel="Share Payment Link"
      onAction={onAction}
      secondaryLabel="View QR code sharing guide →"
      secondaryHref="https://github.com/Chrisland58/SorobanPay#readme"
    />
  );
}

/**
 * Shown on the webhook list when no webhooks are configured.
 */
export function EmptyWebhooks({
  onAction,
}: {
  onAction: () => void;
}) {
  return (
    <EmptyState
      illustration={<WebhooksIllustration />}
      title="No webhooks configured"
      description="Set up a webhook endpoint to receive real-time payment notifications whenever a subscription payment is collected."
      actionLabel="Add Webhook"
      onAction={onAction}
      secondaryLabel="Read the webhook documentation →"
      secondaryHref="https://github.com/Chrisland58/SorobanPay/blob/main/docs/architecture.md"
    />
  );
}
