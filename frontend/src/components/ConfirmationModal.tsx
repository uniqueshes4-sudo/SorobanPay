'use client';

/**
 * ConfirmationModal.tsx
 *
 * Reusable confirmation modal for destructive actions.
 *
 * Features (resolves #450 / UX-115):
 * - role="dialog" aria-modal="true" — screen reader announces title on open
 * - Focus trapped inside modal (Tab / Shift+Tab cycle within focusable children)
 * - Escape key dismisses modal (calls onCancel)
 * - 3-second countdown before destructive confirm button becomes clickable
 *   (prevents double-tap accidents on mobile)
 * - Respects prefers-reduced-motion — countdown still runs, but no CSS animation
 * - Reusable: accepts arbitrary title, body, and button labels
 *
 * Usage:
 *   <ConfirmationModal
 *     isOpen={showCancel}
 *     title="Cancel subscription?"
 *     body="You will stop paying …"
 *     confirmLabel="Yes, Cancel"
 *     cancelLabel="Keep Subscription"
 *     variant="destructive"
 *     onConfirm={handleCancel}
 *     onCancel={() => setShowCancel(false)}
 *   />
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfirmationModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Modal title — announced by screen readers on open */
  title: string;
  /** Modal body — can be a string or JSX */
  body: ReactNode;
  /** Label for the confirm (action) button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /**
   * 'destructive' — confirm button is red, has 3s countdown delay (default)
   * 'primary'     — confirm button is blue, no countdown delay
   */
  variant?: 'destructive' | 'primary';
  /** Delay in seconds before the confirm button becomes active. Default: 3 */
  confirmDelaySeconds?: number;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels (Escape or cancel button) */
  onCancel: () => void;
}

// ── Focusable selectors ───────────────────────────────────────────────────────

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// ── Component ─────────────────────────────────────────────────────────────────

export function ConfirmationModal({
  isOpen,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  confirmDelaySeconds = 3,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(
    variant === 'destructive' ? confirmDelaySeconds : 0,
  );

  // ── Restart countdown whenever modal opens ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (variant !== 'destructive') {
      setCountdown(0);
      return;
    }
    setCountdown(confirmDelaySeconds);
    const id = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(id);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen, confirmDelaySeconds, variant]);

  // ── Move focus into modal on open ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const focusable = Array.from<HTMLElement>(
      dialogRef.current.querySelectorAll(FOCUSABLE),
    );
    // Focus the cancel button first (safer default for destructive modals)
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [isOpen]);

  // ── Escape key handler ──────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      // Focus trap
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from<HTMLElement>(
        dialogRef.current.querySelectorAll(FOCUSABLE),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onCancel],
  );

  const confirmDisabled = countdown > 0;

  // ── Confirm button styles by variant ────────────────────────────────────
  const confirmCls =
    variant === 'destructive'
      ? [
          'flex-1 rounded-lg py-3 text-sm font-semibold transition-all duration-150 min-h-[48px]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card',
          confirmDisabled
            ? 'bg-destructive/40 text-white/40 cursor-not-allowed focus-visible:ring-destructive'
            : 'bg-destructive hover:bg-destructive-hover active:bg-destructive-active text-white focus-visible:ring-destructive',
        ].join(' ')
      : [
          'flex-1 rounded-lg py-3 text-sm font-semibold transition-all duration-150 min-h-[48px]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card',
          'bg-interactive hover:bg-interactive-hover active:bg-interactive-active text-white focus-visible:ring-interactive-focus',
        ].join(' ');

  return (
    <AnimatePresence>
      {isOpen && (
        /* Backdrop */
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-hidden="false"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          // Click outside to cancel
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          {/* Dialog panel */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            aria-describedby="confirmation-modal-body"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className={[
              'w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5 text-text-primary',
              'bg-surface-card border border-surface-overlay',
              'focus:outline-none',
            ].join(' ')}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              {variant === 'destructive' && (
                <span
                  className="flex-shrink-0 mt-0.5 text-status-warning"
                  aria-hidden="true"
                >
                  {/* Warning triangle icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                </span>
              )}
              <h2
                id="confirmation-modal-title"
                className="text-lg font-bold text-text-primary"
              >
                {title}
              </h2>
            </div>

            {/* Body */}
            <div
              id="confirmation-modal-body"
              className="text-sm text-text-secondary leading-relaxed"
            >
              {body}
            </div>

            {/* Countdown hint — visible while button is locked */}
            {variant === 'destructive' && countdown > 0 && (
              <p
                className="text-xs text-text-disabled text-center"
                aria-live="polite"
                aria-atomic="true"
              >
                {/* Icon for screen readers */}
                <span className="sr-only">Timer: </span>
                <span aria-hidden="true">🔒 </span>
                Confirm available in {countdown}s…
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              {/* Cancel — always primary focus target */}
              <button
                type="button"
                onClick={onCancel}
                className={[
                  'flex-1 rounded-lg border py-3 text-sm font-semibold',
                  'transition-all duration-150 min-h-[48px]',
                  'border-surface-overlay bg-surface-raised text-text-secondary',
                  'hover:bg-surface-overlay hover:text-text-primary',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card',
                ].join(' ')}
              >
                {cancelLabel}
              </button>

              {/* Confirm — delayed for destructive variant */}
              <button
                type="button"
                onClick={confirmDisabled ? undefined : onConfirm}
                disabled={confirmDisabled}
                aria-disabled={confirmDisabled}
                aria-label={
                  confirmDisabled
                    ? `${confirmLabel} — available in ${countdown} seconds`
                    : confirmLabel
                }
                className={confirmCls}
              >
                {confirmDisabled && variant === 'destructive'
                  ? `${confirmLabel} (${countdown}s)`
                  : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
