# Redesign Plan — DS Compliance & Figma Parity

**Goal:** Every screen element must use DS tokens — no raw hex colors, no Tailwind gray/white/purple, no `text-sm/xs/lg`. After each page is fixed in code, draw it in Figma (file `1b7MQQDvlyjtMpAUVPo20M`, target frame `392:742`), then deploy.

**Workflow per page:**
1. Audit & fix code (DS tokens only)
2. Run `yarn typecheck` + `yarn lint`
3. Draw page in Figma via `figma-generate-design` skill
4. Commit + push → deploys automatically

---

## Violation Categories

| Category | What to replace | Replace with |
|---|---|---|
| Hex colors | `#e8f5e9`, `#c62828`, etc. | DS feedback/status vars or DS semantic colors |
| Tailwind grays | `bg-gray-*`, `text-gray-*`, `bg-white` | `bg-ds-bg-*`, `text-ds-text-*`, `border-ds-border` |
| Tailwind brand | `bg-purple-*`, `bg-pink-*`, `text-pink-*` | `bg-ds-interactive`, `text-ds-interactive` |
| Font classes | `text-sm`, `text-xs`, `text-lg`, `text-xl`, `text-2xl` | `ds-body`, `ds-caption`, `ds-h1`–`ds-h4`, etc. |
| Hardcoded px spacing | `gap-[6px]`, `py-[4px]`, `px-[8px]` | DS spacing: `gap-ds-1`=4px, `gap-ds-2`=8px, etc. |

---

## DS Spacing Reference

| Token | px |
|---|---|
| `ds-1` | 4px |
| `ds-2` | 8px |
| `ds-3` | 12px |
| `ds-4` | 16px |
| `ds-5` | 20px |
| `ds-6` | 24px |
| `ds-8` | 32px |
| `ds-10` | 40px |

Sub-token spacing (2px, 3px, 6px, 10px) — use exact `[2px]`/`[3px]`/`[6px]`/`[10px]` only where no DS token fits; otherwise round to nearest DS token.

---

## DS Status Colors (for BookingCard badges)

Since the DS has `--ds-feedback-saved` (red/saved) and `--ds-feedback-rating` (amber), create explicit CSS vars for booking statuses in the DS:

| Status | Background | Text |
|---|---|---|
| confirmed | `--ds-status-confirmed-bg` | `--ds-status-confirmed-text` |
| pending | `--ds-status-pending-bg` | `--ds-status-pending-text` |
| cancelled | `--ds-status-cancelled-bg` | `--ds-status-cancelled-text` |
| in_progress | `--ds-status-progress-bg` | `--ds-status-progress-text` |
| completed | `bg-ds-bg-secondary` | `text-ds-text-secondary` |
| no_show | `bg-ds-bg-secondary` | `text-ds-text-muted` |

---

## Page Queue (ordered, consumer-first)

### Phase 1 — Shared Components (block everything else)

| # | File | Critical violations | Status |
|---|---|---|---|
| 1 | `components/mobile/BookingCard.tsx` | Hex status colors (`#e8f5e9`, `#c62828`, etc.) | ⬜ |
| 2 | `components/mobile/ProviderCard.tsx` | Arbitrary px spacing | ⬜ |
| 3 | `components/mobile/FilterSheet.tsx` | Arbitrary px spacing | ⬜ |
| 4 | `components/mobile/TimeSlotButton.tsx` | `h-[56px]`, `gap-[2px]` | ⬜ |
| 5 | `components/mobile/DateSelect.tsx` | Arbitrary px spacing | ⬜ |
| 6 | `components/mobile/StarRating.tsx` | `gap-[2px]` | ⬜ |

### Phase 2 — Consumer Pages (MobileLayout + no-layout)

| # | Route | File | Critical violations | Status |
|---|---|---|---|---|
| 7 | `/` | `SalonSelectorPage.tsx` | minor px spacing | ⬜ |
| 8 | `/map` | `MapPage.tsx` | arbitrary px spacing | ⬜ |
| 9 | `/saved` | `SavedPage.tsx` | `py-[14px]`, `gap-[10px]` | ⬜ |
| 10 | `/me` | `UserProfilePage.tsx` | arbitrary px spacing | ⬜ |
| 11 | `/providers/:id` | `ProviderProfilePage.tsx` | minor px spacing | ⬜ |
| 12 | `/professionals/:id` | `MasterProfilePage.tsx` | `py-[4px]`, `gap-[4px]` | ⬜ |
| 13 | `/book/:id` | `PublicBookingPage.tsx` | arbitrary px spacing | ⬜ |
| 14 | `/my-bookings` | `ClientBookingsPage.tsx` | uses BookingCard (fixed in Ph1) | ⬜ |
| 15 | `/me/edit` | `ClientProfileEditPage.tsx` | `size-[72px]`, `rounded-[10px]` | ⬜ |
| 16 | `/my-reviews` | `ClientReviewsPage.tsx` | `gap-[2px]`, `gap-[6px]` | ⬜ |
| 17 | `/login` | `LoginPage.tsx` | arbitrary px spacing | ⬜ |
| 18 | `/help` | `HelpPage.tsx` | audit needed | ⬜ |

### Phase 3 — Discovery Pages (FindProviders / FindProfessionals / MasterDiscovery)

These 3 pages have the most severe violations: `bg-gray-*`, `text-gray-*`, `text-sm/xs/lg`, `bg-white`, `bg-purple-*`.

| # | Route | File | Status |
|---|---|---|---|
| 19 | — | `MasterDiscoveryPage.tsx` | ⬜ |
| 20 | — | `FindProfessionalsPage.tsx` | ⬜ |
| 21 | — | `FindProvidersPage.tsx` | ⬜ |

### Phase 4 — B2B Dashboard Pages (AppLayout)

These are authenticated, desktop-first. Lower priority for DS migration but should at least remove raw colors.

| # | Route | File | Status |
|---|---|---|---|
| 22 | `/dashboard` | `OwnerDashboardPage.tsx` / `MasterDashboardPage.tsx` | ⬜ |
| 23 | `/notifications` | `NotificationsPage.tsx` (B2B part) | ⬜ |
| 24 | `/sessions` | `SessionsPage.tsx` | ⬜ |
| 25 | `/calendar` | `CalendarPage.tsx` | ⬜ |
| 26 | `/services` | `ServicesPage.tsx` | ⬜ |
| 27 | `/professionals` | `MastersPage.tsx` | ⬜ |
| 28 | `/reports` | `ReportsPage.tsx` | ⬜ |
| 29 | `/reviews` | `ReviewsPage.tsx` | ⬜ |
| 30 | `/clients` | `ClientsPage.tsx` / `ClientDetailPage.tsx` | ⬜ |
| 31 | `/invoices` | `InvoicesPage.tsx` | ⬜ |
| 32 | `/analytics` | `OwnerAnalyticsPage.tsx` / `MasterAnalyticsPage.tsx` | ⬜ |
| 33 | `/profile/*` | `SalonProfileEditPage.tsx` / `MasterProfileEditPage.tsx` | ⬜ |
| 34 | `/admin` | `AdminPanelPage.tsx` | ⬜ |

---

## Missing DS Components to Create

These are needed before pages can be fully DS-compliant:

| Component | Used by | Notes |
|---|---|---|
| `StatusBadge` | BookingCard, SessionsPage | Status-colored pill; needs DS status CSS vars |
| `EmptyState` | SalonSelectorPage, SavedPage, ClientBookingsPage | Icon + title + body + optional CTA |
| `SectionHeader` | Multiple pages | Title + optional count + optional action button |
| `InfoRow` | BookingCard, MasterProfilePage | Icon + label row (address, phone, date) |
| `PhoneLink` | BookingCard, ProviderProfilePage | `tel:` anchor with phone icon |

---

## How to Execute Each Page

```
# 1. Fix code
# 2. Verify
cd frontend && yarn typecheck && yarn lint

# 3. Draw in Figma (use figma-generate-design skill)
# Target: file 1b7MQQDvlyjtMpAUVPo20M, frame 392:742

# 4. Commit & push (auto-deploys)
git add <changed files>
git commit -m "feat: redesign <PageName> — DS compliance"
git push origin main
```
