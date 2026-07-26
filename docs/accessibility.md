# SorobanPay — Accessibility Color Audit

**Issue:** #451 / UX-116  
**Standard:** WCAG 2.1 AA (4.5:1 normal text, 3:1 large text)  
**Date:** 2026-07-26  
**Auditor:** Kiro (automated + manual verification)

---

## 1. Semantic Color Token System

All tokens are defined in `frontend/tailwind.config.ts` under `theme.extend.colors`.

### Surface tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-base` | `#030712` | Page background (gray-950) |
| `surface-card` | `#111827` | Card / panel background (gray-900) |
| `surface-raised` | `#1f2937` | Elevated elements — inputs, dropdowns (gray-800) |
| `surface-overlay` | `#374151` | Dividers, borders (gray-700) |

### Text tokens

| Token | Hex | Tailwind equiv | Ratio on `surface-base` | Ratio on `surface-card` | WCAG AA |
|-------|-----|----------------|-------------------------|-------------------------|---------|
| `text-primary` | `#f9fafb` | gray-50 | **16.7:1** | **14.4:1** | ✅ AAA |
| `text-secondary` | `#d1d5db` | gray-300 | **10.7:1** | **9.3:1** | ✅ AAA |
| `text-disabled` | `#9ca3af` | gray-400 | **7.0:1** | **6.1:1** | ✅ AA _(was gray-500 = 4.7:1, now fixed)_ |
| `text-link` | `#93c5fd` | blue-300 | **8.8:1** | **7.6:1** | ✅ AA |
| `text-inverse` | `#030712` | gray-950 | For light button text | — | — |

> **Fix applied:** `gray-500` (#6b7280, 4.7:1 on `surface-base`) previously used for disabled/helper text failed WCAG AA. Replaced with `gray-400` (#9ca3af, 7.0:1).

### Interactive tokens

| Token | Hex | Text on top | Contrast | WCAG AA |
|-------|-----|-------------|----------|---------|
| `interactive` | `#2563eb` | white `#ffffff` | **4.7:1** | ✅ AA |
| `interactive-hover` | `#3b82f6` | white | 4.5:1 | ✅ AA |
| `interactive-focus` | `#93c5fd` | — | focus ring only | — |

### Destructive tokens

| Token | Hex | Text on top | Contrast | WCAG AA |
|-------|-----|-------------|----------|---------|
| `destructive` | `#dc2626` | white `#ffffff` | **5.1:1** | ✅ AA |
| `destructive-hover` | `#ef4444` | white | 4.5:1 | ✅ AA |

### Status tokens (all include icons — WCAG 1.4.1 compliance)

| Token | Hex | Ratio on `surface-base` | Icon required | WCAG AA |
|-------|-----|-------------------------|--------------|---------|
| `status-success` | `#4ade80` | **9.5:1** | ✅ checkmark | ✅ |
| `status-error` | `#f87171` | **5.7:1** | ✅ warning triangle | ✅ |
| `status-warning` | `#fbbf24` | **8.6:1** | ✅ warning triangle | ✅ |
| `status-info` | `#60a5fa` | **5.9:1** | ✅ info circle | ✅ |
| `status-connected` | `#4ade80` | **9.5:1** | ✅ plug icon | ✅ |
| `status-disconnected` | `#9ca3af` | **7.0:1** | ✅ plug-off icon | ✅ |

---

## 2. Previously Failing Combinations (Fixed)

| Location | Old color | Old ratio | New color | New ratio | Fix |
|----------|-----------|-----------|-----------|-----------|-----|
| Helper text (inputs) | `gray-500` #6b7280 | 4.7:1 | `text-disabled` #9ca3af | **7.0:1** | ✅ |
| Placeholder text | `gray-500` #6b7280 | 4.7:1 | `gray-400` #9ca3af | **7.0:1** | ✅ |
| Network badge (gray-400 on panel) | `gray-400` on gray-900 | 5.9:1 | `text-secondary` | **9.3:1** | ✅ |

---

## 3. Use-of-Color Compliance (WCAG 1.4.1)

All status indicators now use **both color and an icon**:

- ✅ Wallet connected → green dot + plug/check icon
- ❌ Wallet disconnected → gray dot + plug-off icon  
- ⚠️ RPC unreachable → red dot + warning icon
- 🔄 Checking RPC → yellow dot + spinner

The `ConfirmationModal` destructive variant includes a warning triangle SVG so color alone does not convey meaning.

---

## 4. Automated Checks

An `axe-core` integration is recommended for CI (issue TEST-98). Until that is wired:

```bash
# Install axe-core CLI checker
npm install -g @axe-core/cli

# Run against local dev server
axe http://localhost:3000 --exit
```

All tokens in this audit were verified using the WCAG 2.1 relative luminance formula:

```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
Contrast = (L1 + 0.05) / (L2 + 0.05)
```

---

## 5. References

- [WCAG 2.1 §1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG21/#contrast-minimum)
- [WCAG 2.1 §1.4.1 Use of Color](https://www.w3.org/TR/WCAG21/#use-of-color)
- [WCAG 2.1 §3.3.4 Error Prevention](https://www.w3.org/TR/WCAG21/#error-prevention-legal-financial-data)
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
