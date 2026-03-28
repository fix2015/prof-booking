# ProBook Frontend Design System Rules

**Figma source:** file `1b7MQQDvlyjtMpAUVPo20M` → Design System page
**Token file:** `frontend/src/design-system.ts`
**CSS variables + typography classes:** `frontend/src/index.css`
**Tailwind utilities:** `frontend/tailwind.config.js` → `theme.extend`

---

## The Golden Rule

> **Never write a raw hex color, px font size, hardcoded font-weight, or arbitrary spacing value in any React component.**
> Every visual value must come from a DS token, Tailwind `ds-*` class, or `design-system.ts` import.

---

## Color

### Tailwind classes (always prefer)

| Token | Tailwind class | Use for |
|---|---|---|
| `bg/primary` | `bg-ds-bg-primary` | Cards, inputs, white backgrounds |
| `bg/secondary` | `bg-ds-bg-secondary` | Page background, icon circles |
| `bg/tertiary` | `bg-ds-bg-tertiary` | Hover, interactive subtle bg |
| `bg/inverse` | `bg-ds-bg-inverse` | Dark backgrounds |
| `text/primary` | `text-ds-text-primary` | All primary text |
| `text/secondary` | `text-ds-text-secondary` | Supporting / secondary text |
| `text/muted` | `text-ds-text-muted` | Placeholders, muted labels |
| `text/disabled` | `text-ds-text-disabled` | Disabled states |
| `text/inverse` | `text-ds-text-inverse` | Text on dark backgrounds |
| `border/default` | `border-ds-border` | Input borders, dividers, card strokes |
| `border/strong` | `border-ds-border-strong` | Stronger borders, drag handles |
| `interactive/default` | `bg-ds-interactive` / `text-ds-interactive` | Primary buttons, active chips |
| `interactive/hover` | `hover:bg-ds-interactive-hover` | Hover states |
| `interactive/subtle` | `bg-ds-interactive-subtle` | Subtle interactive backgrounds |
| `feedback/saved` | `text-ds-feedback-saved` | Heart / saved icon |
| `feedback/saved-bg` | `bg-ds-feedback-saved-bg` | Saved icon background |
| `feedback/rating` | `text-ds-feedback-rating` | Star rating |
| `avatar/navy` | `bg-ds-avatar-navy` | Navy avatar |
| `avatar/teal` | `bg-ds-avatar-teal` | Teal avatar |
| `avatar/purple` | `bg-ds-avatar-purple` | Purple avatar |

### Dynamic styles (style prop, recharts, canvas)

```tsx
import { color, hex } from '@/design-system';

// CSS variable (preferred — respects future theming)
<div style={{ backgroundColor: color.bg.secondary }} />

// Raw hex (only for libraries that don't accept CSS vars)
<Circle fill={hex.feedbackRating} />
```

### ❌ Never do this

```tsx
<div style={{ color: '#111827' }} />        // raw hex
<div className="text-[#6B7280]" />          // arbitrary Tailwind
<div style={{ backgroundColor: 'white' }} /> // named color
```

---

## Typography

### CSS classes (always prefer)

Apply a `.ds-*` class + a color token class — never set `fontSize`/`fontWeight`/`lineHeight` manually.

```tsx
<h1 className="ds-h1 text-ds-text-primary">Page Title</h1>
<p  className="ds-body text-ds-text-secondary">Supporting copy</p>
<span className="ds-label text-ds-text-primary">Section header</span>
<small className="ds-caption text-ds-text-muted">Helper text</small>
```

| Class | Size | Weight | Line Height | Use for |
|---|---|---|---|---|
| `ds-display` | 28px | Bold | 36px | Hero headings |
| `ds-h1` | 22px | Bold | 28px | Page titles |
| `ds-h2` | 20px | Bold | 26px | Section titles |
| `ds-h3` | 18px | Bold | 24px | Sheet titles |
| `ds-h4` | 16px | SemiBold | 22px | Sub-section headings |
| `ds-body-medium` | 16px | Regular | 22px | Chevrons, icon text |
| `ds-body-large` | 15px | Regular | 22px | Button labels |
| `ds-body` | 14px | Regular | 20px | Input text, body copy |
| `ds-body-strong` | 14px | SemiBold | 20px | Emphasized body |
| `ds-body-small` | 13px | Regular | 18px | Secondary labels |
| `ds-label` | 13px | SemiBold | 18px | Section headers |
| `ds-label-small` | 12px | SemiBold | 16px | Small labels |
| `ds-caption` | 12px | Regular | 16px | Helper text |
| `ds-caption-medium` | 12px | Medium | 16px | Medium captions |
| `ds-badge` | 11px | Medium | 14px | Badges, calendar day names |
| `ds-tab-label` | 10px | Regular | 13px | Tab bar inactive |
| `ds-tab-label-active` | 10px | SemiBold | 13px | Tab bar active |

### Dynamic styles (rare)

```tsx
import { textStyle } from '@/design-system';

// Use the className from the preset
<p className={`${textStyle.bodySmall.className} text-ds-text-secondary`} />

// Or use numeric values for libs (recharts tick labels etc.)
<text fontSize={textStyle.caption.fontSize} fontWeight={textStyle.caption.fontWeight} />
```

### ❌ Never do this

```tsx
<p style={{ fontSize: '14px', fontWeight: 600 }} />  // hardcoded
<p className="text-sm font-semibold" />               // Tailwind scale, not DS
<p className="text-[13px]" />                         // arbitrary Tailwind
```

---

## Spacing & Padding

DS spacing maps 1:1 to Tailwind default scale (1 = 4px, 2 = 8px…), so use standard Tailwind `p-*` / `m-*` / `gap-*` with DS step values:

| DS token | Tailwind | Value |
|---|---|---|
| `spacing/1` | `p-1` / `gap-1` | 4px |
| `spacing/2` | `p-2` / `gap-2` | 8px |
| `spacing/3` | `p-3` / `gap-3` | 12px |
| `spacing/4` | `p-4` / `gap-4` | 16px |
| `spacing/5` | `p-5` / `gap-5` | 20px |
| `spacing/6` | `p-6` / `gap-6` | 24px |
| `spacing/8` | `p-8` / `gap-8` | 32px |
| `spacing/10` | `p-10` / `gap-10` | 40px |
| `spacing/12` | `p-12` / `gap-12` | 48px |
| `spacing/14` | `p-14` / `gap-14` | 56px |

Or use the explicit DS aliases: `p-ds-4`, `gap-ds-6`, etc.

### ❌ Never do this

```tsx
<div style={{ padding: '16px' }} />     // hardcoded
<div className="p-[20px]" />            // arbitrary Tailwind
<div className="mt-7" />               // non-DS step (7 = 28px, not in DS)
```

---

## Border Radius

| DS token | Tailwind class | Value |
|---|---|---|
| `radius/none` | `rounded-ds-none` | 0px |
| `radius/xs` | `rounded-ds-xs` | 4px |
| `radius/sm` | `rounded-ds-sm` | 6px |
| `radius/md` | `rounded-ds-md` | 8px |
| `radius/lg` | `rounded-ds-lg` | 10px |
| `radius/xl` | `rounded-ds-xl` | 12px |
| `radius/2xl` | `rounded-ds-2xl` | 16px |
| `radius/full` | `rounded-ds-full` | 9999px |

### ❌ Never do this

```tsx
<div className="rounded-lg" />          // ShadCN alias, not DS
<div style={{ borderRadius: '8px' }} /> // hardcoded
<div className="rounded-[10px]" />      // arbitrary
```

---

## Translations (i18n) — MANDATORY for every string

**File:** `frontend/src/i18n.ts` — custom solution, 5 locales: `en`, `pl`, `ro`, `uk`, `es`

```tsx
import { t, TranslationKey } from "@/i18n";

// Simple string
<h1 className="ds-h1">{t("providers.find_nearby")}</h1>

// With interpolation
<span>{t("providers.count", { count: filtered.length })}</span>

// In an attribute
<input placeholder={t("providers.search_placeholder")} />

// Array of items with label keys — type as TranslationKey to avoid TS error
const TABS: { value: string; labelKey: TranslationKey }[] = [
  { value: "all", labelKey: "saved.tab.all" },
];
```

### When implementing a Figma design — REQUIRED steps

1. **Never write a raw string literal** for any user-visible text. Every label, heading, placeholder, button text, error message, empty state, toast, and aria-label must go through `t()`.
2. **Check existing keys first** — grep `i18n.ts` for the string before creating a new key.
3. **Add new keys to ALL 5 locales** (en, pl, ro, uk, es) in `i18n.ts`. Never add to just one locale.
4. **Follow the key namespace** for the screen being implemented:
   - `login.*`, `register.*`, `register.pro.*` — auth pages
   - `providers.*` — provider discovery / detail
   - `professionals.*` — professional discovery / detail
   - `booking.*` — booking flow
   - `map.*`, `saved.*`, `profile.*`, `reviews.*` — respective pages
   - `common.*` — reusable across pages (loading, cancel, save, search, error…)
5. **Interpolated values** use `{placeholder}` syntax in the value string: `"found {count} results"` → `t("key", { count: n })`.

### ❌ Never do this

```tsx
<h1>Find any service nearby</h1>           // raw string
<Button>Sign In</Button>                   // raw string
<input placeholder="Search..." />         // raw string
toast({ title: "Booking failed" })        // raw string
```

### ✅ Always do this

```tsx
<h1>{t("providers.find_nearby")}</h1>
<Button>{t("providers.sign_in")}</Button>
<input placeholder={t("providers.search_placeholder")} />
toast({ title: t("booking.failed") })
```

---

## Pre-flight Checklist (before submitting any component)

Before writing or reviewing any React component, check:

- [ ] No raw hex colors (`#...`) in `style` props or `className` → use `text-ds-*` / `bg-ds-*`
- [ ] No `fontSize`, `fontWeight`, or `lineHeight` in inline styles → use `.ds-*` classes
- [ ] No `text-sm`, `text-xs`, `font-semibold`, etc. (Tailwind type scale) → use `.ds-*` classes
- [ ] No `rounded-lg`, `rounded-md`, `rounded-sm` → use `rounded-ds-*`
- [ ] No `p-7`, `mt-9`, or other non-DS spacing steps → use DS steps only (1,2,3,4,5,6,8,10,12,14)
- [ ] No `style={{ padding: '...px' }}` → use Tailwind spacing utilities
- [ ] Dynamic color values come from `color.*` or `hex.*` in `design-system.ts`
- [ ] **No hardcoded user-visible strings** → every string goes through `t()` from `@/i18n`
- [ ] **New i18n keys added to all 5 locales** (en, pl, ro, uk, es)

---

---

## Figma ↔ Code Mapping

| Figma File | Node | Route | React File |
|---|---|---|---|
| `1b7MQQDvlyjtMpAUVPo20M` | `52:2` | `/` | `src/pages/public/SalonSelectorPage.tsx` |
| `1b7MQQDvlyjtMpAUVPo20M` | `52:105` | `/` (filter sheet) | `src/pages/public/SalonSelectorPage.tsx` |
| `1b7MQQDvlyjtMpAUVPo20M` | `53:2` | `/map` | `src/pages/mobile/MapPage.tsx` |
| `1b7MQQDvlyjtMpAUVPo20M` | `55:2` | `/saved` | `src/pages/mobile/SavedPage.tsx` |
| `1b7MQQDvlyjtMpAUVPo20M` | `55:57` | `/me` | `src/pages/mobile/MobileUserProfilePage.tsx` |
| `1b7MQQDvlyjtMpAUVPo20M` | `251:242` | `/providers/:id` | `src/pages/mobile/MobileProviderDetail.tsx` |
| `1b7MQQDvlyjtMpAUVPo20M` | `268:310` | `/professionals/:id` | `src/pages/mobile/MobileProfessionalDetail.tsx` |
| `1b7MQQDvlyjtMpAUVPo20M` | `257:250` + `264:297` | `/book/:providerId` | `src/pages/mobile/MobileBookingPage.tsx` |

### Shared Mobile Components

| Component | Figma Usage | File |
|---|---|---|
| `AppHeader` | All screens — 4 variants: brand / title-action / back-title / back-title-action | `src/components/mobile/AppHeader.tsx` |
| `BottomTabBar` | MobileLayout tab navigation | `src/components/mobile/BottomTabBar.tsx` |
| `ProviderCard` | Discovery list (`variant="list"`), Map peek (`variant="compact"`), Homepage (`variant="default"`) | `src/components/mobile/ProviderCard.tsx` |
| `MobileAvatar` | All screens — `shape="circle"` (default) or `shape="rounded"` (list cards, `rounded-ds-xl`) | `src/components/mobile/MobileAvatar.tsx` |
| `CategoryChip` | Discovery chips row, filter chips | `src/components/mobile/CategoryChip.tsx` |
| `TimeSlotButton` | Booking step 4 — time grid | `src/components/mobile/TimeSlotButton.tsx` |
| `StarRating` | Provider/Professional cards and detail pages | `src/components/mobile/StarRating.tsx` |

---

## Adding a new token

If a design requires a value not in the DS:
1. Add it to Figma DS first (variable or text style)
2. Add the CSS variable to `frontend/src/index.css` under `:root`
3. Add the Tailwind mapping to `frontend/tailwind.config.js`
4. Add the TS constant to `frontend/src/design-system.ts`
5. Update `probook-design-system.md` (Figma skill)
6. **Then** use it in the component
