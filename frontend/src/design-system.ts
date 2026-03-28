/**
 * ProBook Design System tokens — TypeScript constants
 * Source of truth: Figma file 1b7MQQDvlyjtMpAUVPo20M, Design System page
 *
 * Use these when you need token values in dynamic styles (style prop, canvas, charting, etc.)
 * For static Tailwind classes use the ds-* utilities defined in tailwind.config.js.
 *
 * RULE: Never hardcode a hex color, px size, or font spec.
 *       Always reference a token from this file or the Tailwind ds-* classes.
 */

// ─── Color tokens ──────────────────────────────────────────
export const color = {
  bg: {
    primary:   "var(--ds-bg-primary)",
    secondary: "var(--ds-bg-secondary)",
    tertiary:  "var(--ds-bg-tertiary)",
    inverse:   "var(--ds-bg-inverse)",
  },
  text: {
    primary:   "var(--ds-text-primary)",
    secondary: "var(--ds-text-secondary)",
    muted:     "var(--ds-text-muted)",
    disabled:  "var(--ds-text-disabled)",
    inverse:   "var(--ds-text-inverse)",
  },
  border: {
    default: "var(--ds-border-default)",
    strong:  "var(--ds-border-strong)",
    inverse: "var(--ds-border-inverse)",
  },
  interactive: {
    default: "var(--ds-interactive-default)",
    hover:   "var(--ds-interactive-hover)",
    subtle:  "var(--ds-interactive-subtle)",
  },
  feedback: {
    saved:   "var(--ds-feedback-saved)",
    savedBg: "var(--ds-feedback-saved-bg)",
    rating:  "var(--ds-feedback-rating)",
  },
  avatar: {
    navy:   "var(--ds-avatar-navy)",
    teal:   "var(--ds-avatar-teal)",
    purple: "var(--ds-avatar-purple)",
  },
} as const;

// ─── Raw hex values (for charting libs, canvas, non-CSS contexts) ───
export const hex = {
  bgPrimary:          "#FFFFFF",
  bgSecondary:        "#F9FAFC",
  bgTertiary:         "#F3F5F8",
  bgInverse:          "#111827",
  textPrimary:        "#111827",
  textSecondary:      "#6B7280",
  textMuted:          "#4B5563",
  textDisabled:       "#D0D5DB",
  textInverse:        "#FFFFFF",
  borderDefault:      "#E5E9EE",
  borderStrong:       "#D0D5DB",
  interactiveDefault: "#111827",
  interactiveHover:   "#1F2939",
  interactiveSubtle:  "#F3F5F8",
  feedbackSaved:      "#EF4444",
  feedbackSavedBg:    "#FEEDED",
  feedbackRating:     "#FBBF24",
  avatarNavy:         "#1E2A54",
  avatarTeal:         "#10684F",
  avatarPurple:       "#5F218D",
} as const;

// ─── Spacing tokens ─────────────────────────────────────────
export const space = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  14: 56,
} as const;

// ─── Radius tokens ──────────────────────────────────────────
export const radius = {
  none: 0,
  xs:   4,
  sm:   6,
  md:   8,
  lg:   10,
  xl:   12,
  "2xl": 16,
  full: 9999,
} as const;

// ─── Typography presets ─────────────────────────────────────
// Each preset maps to a .ds-* CSS class in index.css
// Use the className directly: <h1 className="ds-h1 text-ds-text-primary">
export const textStyle = {
  display:      { fontSize: 28, lineHeight: 36, fontWeight: 700, className: "ds-display" },
  h1:           { fontSize: 22, lineHeight: 28, fontWeight: 700, className: "ds-h1" },
  h2:           { fontSize: 20, lineHeight: 26, fontWeight: 700, className: "ds-h2" },
  h3:           { fontSize: 18, lineHeight: 24, fontWeight: 700, className: "ds-h3" },
  h4:           { fontSize: 16, lineHeight: 22, fontWeight: 600, className: "ds-h4" },
  bodyMedium:   { fontSize: 16, lineHeight: 22, fontWeight: 400, className: "ds-body-medium" },
  bodyLarge:    { fontSize: 15, lineHeight: 22, fontWeight: 400, className: "ds-body-large" },
  body:         { fontSize: 14, lineHeight: 20, fontWeight: 400, className: "ds-body" },
  bodyStrong:   { fontSize: 14, lineHeight: 20, fontWeight: 600, className: "ds-body-strong" },
  bodySmall:    { fontSize: 13, lineHeight: 18, fontWeight: 400, className: "ds-body-small" },
  label:        { fontSize: 13, lineHeight: 18, fontWeight: 600, className: "ds-label" },
  labelSmall:   { fontSize: 12, lineHeight: 16, fontWeight: 600, className: "ds-label-small" },
  caption:      { fontSize: 12, lineHeight: 16, fontWeight: 400, className: "ds-caption" },
  captionMedium:{ fontSize: 12, lineHeight: 16, fontWeight: 500, className: "ds-caption-medium" },
  badge:        { fontSize: 11, lineHeight: 14, fontWeight: 500, className: "ds-badge" },
  tabLabel:     { fontSize: 10, lineHeight: 13, fontWeight: 400, className: "ds-tab-label" },
  tabLabelActive:{ fontSize: 10, lineHeight: 13, fontWeight: 600, className: "ds-tab-label-active" },
} as const;
