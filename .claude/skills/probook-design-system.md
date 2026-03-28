# ProBook Design System Rules

**Figma file:** `1b7MQQDvlyjtMpAUVPo20M`
**DS page:** `Design System` | **Screens page:** `Mobile App Screens` (id: `52:164`)

---

## The Golden Rule

> **Never add a raw color, font size, or hardcoded frame to any screen.**
> Every element must be an instance of a DS component or use a DS variable/text style.
> If something doesn't exist in the DS yet → **add it to the DS first, then use it.**

Before touching any screen node, ask:
1. Does a component exist for this? → use it as an INSTANCE
2. Does a color token exist? → bind via `setBoundVariableForPaint`
3. Does a text style exist? → set `node.textStyleId`
4. Nothing matches? → **create the component/token in DS, then apply**

---

## Color Variables

### Semantic (always prefer these over primitives)

| Token | Hex | Usage |
|---|---|---|
| `bg/primary` | `#FFFFFF` | White backgrounds, cards, inputs |
| `bg/secondary` | `#F9FAFC` | Page background, icon circles |
| `bg/tertiary` | `#F3F5F8` | Subtle hover, interactive/subtle |
| `bg/inverse` | `#111827` | Dark/inverted backgrounds |
| `text/primary` | `#111827` | All primary text |
| `text/secondary` | `#6B7280` | Secondary/supporting text |
| `text/muted` | `#4B5563` | Placeholder, muted labels |
| `text/disabled` | `#D0D5DB` | Disabled states |
| `text/inverse` | `#FFFFFF` | Text on dark backgrounds |
| `border/default` | `#E5E9EE` | Input borders, dividers, card strokes |
| `border/strong` | `#D0D5DB` | Drag handle, stronger borders |
| `border/inverse` | `#111827` | Dark borders |
| `interactive/default` | `#111827` | Primary buttons, active chips, today dot |
| `interactive/hover` | `#1F2939` | Hover state on interactive elements |
| `interactive/subtle` | `#F3F5F8` | Subtle interactive background |
| `feedback/saved` | `#EF4444` | Heart/saved icon |
| `feedback/saved-bg` | `#FEEDED` | Saved icon background |
| `feedback/rating` | `#FBBF24` | Star rating color |
| `avatar/navy` | `#1E2A54` | Navy avatar background |
| `avatar/teal` | `#10684F` | Teal avatar background |
| `avatar/purple` | `#5F218D` | Purple avatar background |

### Primitives (use only inside DS to define semantic tokens)

`gray/50…900`, `white`, `black`, `amber/400`, `red/50`, `red/400`, `red/500`, `brand/navy`, `brand/teal`, `brand/purple`

---

## Spacing Tokens

| Token | Value |
|---|---|
| `spacing/1` | 4px |
| `spacing/2` | 8px |
| `spacing/3` | 12px |
| `spacing/4` | 16px |
| `spacing/5` | 20px |
| `spacing/6` | 24px |
| `spacing/8` | 32px |
| `spacing/10` | 40px |
| `spacing/12` | 48px |
| `spacing/14` | 56px |

---

## Radius Tokens

| Token | Value |
|---|---|
| `radius/none` | 0px |
| `radius/xs` | 4px |
| `radius/sm` | 6px |
| `radius/md` | 8px |
| `radius/lg` | 10px |
| `radius/xl` | 12px |
| `radius/2xl` | 16px |
| `radius/full` | 9999px |

---

## Text Styles

| Name | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `Display` | 28px | Bold | 36 | Hero headings |
| `H1` | 22px | Bold | 28 | Page titles |
| `H2` | 20px | Bold | 26 | Section titles |
| `H3` | 18px | Bold | 24 | Sheet titles ("Filters") |
| `H4` | 16px | Semi Bold | 22 | Sub-section headings |
| `Body/Medium` | 16px | Regular | 22 | Chevrons, icon text |
| `Body/Large` | 15px | Regular | 22 | Button labels |
| `Body` | 14px | Regular | 20 | Input text, labels, body copy |
| `Body/Strong` | 14px | Semi Bold | 20 | Emphasized body |
| `Body/Small` | 13px | Regular | 18 | Sort pills, secondary labels |
| `Label` | 13px | Semi Bold | 18 | Section headers, active pills |
| `Label/Small` | 12px | Semi Bold | 16 | Small labels |
| `Caption` | 12px | Regular | 16 | Helper text, "Tap to close" |
| `Caption/Medium` | 12px | Medium | 16 | Medium-weight captions |
| `Badge` | 11px | Medium | 14 | Badge text, calendar day names |
| `Tab/Label` | 10px | Regular | 13 | Tab bar inactive labels |
| `Tab/Label/Active` | 10px | Semi Bold | 13 | Tab bar active labels |

---

## Component Inventory

All components live on the **Design System** page in Figma. Use `createInstance()` from the correct variant — never duplicate or recreate frames.

### Layout / Shell
| Component | Variants | Usage |
|---|---|---|
| `LangDropdown` | `State=default`, `State=open` | Language selector pill + dropdown (EN/PT/ES/FR); embed in Header/brand |
| `Header` | `State=brand`, `State=title-action`, `State=back-title`, `State=back-title-action` | Top navigation bar — brand: logo+LangDropdown+SignIn; title-action: title+icon; back-title: ←+title; back-title-action: ←+title+HeartButton |
| `BottomSheetHandle` | (single) | Drag indicator at top of sheets |
| `SheetHeader` | `HasClear=false`, `HasClear=true` | Title + optional "Clear all" |
| `Divider` | (single) | Horizontal 1px separator |
| `BottomTabBar` | `Active=Search/Map/Saved/Profile` | Bottom navigation |

### Forms & Inputs
| Component | Variants | Usage |
|---|---|---|
| `SearchBar` | `State=empty`, `typing`, `open` | Main location/service search with autocomplete dropdown |
| `Input` | `State=default`, `focused`, `error`, `disabled` | Text inputs (price range etc.) |
| `FieldRow` | `State=default`, `filled` | Generic row with icon + label + chevron |
| `DateSelect` | `State=default`, `open` | Date picker with full calendar grid (March 2026, today=28) |
| `NationalitySelect` | `State=default`, `typing`, `open` | Nationality/language picker with flag + name dropdown |

### Filter Bar
| Component | Variants | Usage |
|---|---|---|
| `FilterBar` | (3 standalone components) | Full filter pill row |
| ↳ `FilterBar/none` | — | No active filters |
| ↳ `FilterBar/one` | — | One filter active (badge=1) |
| ↳ `FilterBar/many` | — | Many filters active |
| `FiltersButton` | `Badge=none`, `Badge=1`, `Badge=5` | The "Filters" button with optional badge |
| `FilterPill` | `State=default`, `active`, `badge` | Individual filter pill |

### Selection & Actions
| Component | Variants | Usage |
|---|---|---|
| `Chip` | `State=default`, `active`, `more` | Category chips, sort pills, experience pills |
| `Button` | `Style=primary/secondary/ghost`, `Size=md/sm` | CTAs and actions |
| `HeartButton` | `State=default`, `saved` | Favourite toggle |

### Data Display
| Component | Variants | Usage |
|---|---|---|
| `ProviderCard` | `State=default`, `saved`, `compact` | Provider listing card (compact = 80px peek sheet variant) |
| `SegmentTab` | `State=active`, `default` | 90×44px underline-style tab for segmented controls |
| `MenuItem` | `State=default`, `filled` | 390px profile menu row: icon + title + optional subtitle + chevron |
| `TimeSlot` | `State=default`, `selected` | 108×56px time slot button: time + professional name, dark when selected |
| `Avatar` | `Color=navy/teal/purple`, `Size=sm/md/lg/xl` | User/provider avatars |
| `Badge` | `Style=default`, `dark`, `teal` | Category/status badges |
| `PricePill` | `Size=default`, `compact` | Price display pill |

---

## Workflow Rules for Screen Design

### Adding a new element
```
1. Check component inventory above — does it exist?
   YES → createInstance() from the correct variant
   NO  → create component in DS first with all states, then instance it

2. For every color used:
   - Find the semantic token from the Color table above
   - Bind via setBoundVariableForPaint(fill, "color", variable)
   - NEVER use a raw hex value on a screen node

3. For every text node:
   - Match to a text style from the table above
   - Set node.textStyleId = textStyle.id
   - If no style matches → add a new text style to DS first

4. For every spacing/padding/gap:
   - Use spacing tokens where possible

5. Final check — run this scan on the screen node:
   Walk all children; flag any SOLID fill/stroke without boundVariables.color
   or any TEXT without textStyleId
```

### Adding a new color
```
1. Ask: does an existing semantic token cover this use case?
   YES → use that token
   NO  → add a new primitive to Primitives collection,
          add a new semantic alias to Color collection,
          document it in this file,
          then use the semantic token
```

### Adding a new component
```
1. Create COMPONENT nodes for each state (name: "Property=value")
2. Bind all fills/strokes/text to DS variables and text styles
3. Combine with figma.combineAsVariants() into a COMPONENT_SET
4. Place in Design System page
5. Add to this inventory table
```

---

## Verified Screens

| Screen | Node | Status |
|---|---|---|
| Main Discovery (list view) | `52:2` | ✅ All components connected |
| Filter Sheet | `52:105` / `52:108` | ✅ All components connected, zero hardcoded values |
| Map Screen | `53:2` | ✅ All text styles applied, all fills bound, DS components used (SearchBar, Button, BottomSheetHandle, ProviderCard/compact, BottomTabBar) |
| Saved Screen | `55:2` | ✅ All text styles applied, SegmentTab/SegmentBar added to DS, ProviderCard instances |
| Profile Screen | `55:57` | ✅ All text styles applied, Avatar/MenuItem DS components used, zero hardcoded values |
| Provider Detail | `251:242` | ✅ Redrawn from probooking.app/providers/5 — Hero/Stats/Services/Professionals, all DS tokens |
| Book Appointment (empty) | `257:250` | ✅ Redrawn from probooking.app/book/5 — empty state, all DS components |
| Book Appointment (with slots) | `264:297` | ✅ Filled state: service+pro+date selected, TimeSlot grid (5×3), all DS tokens |
| Professional Detail | `268:310` | ✅ Redrawn from probooking.app/professionals/13 — Avatar/Header/Bio/Badge/CTAs/Stats/Reviews, all DS tokens |

All screens use `Header` component instances (swapped from raw frames).
