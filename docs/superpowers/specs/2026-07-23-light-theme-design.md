# Light Theme Support — Design Spec

## Problem

Dominion Core currently ships dark-only: `app/layout.tsx` hardcodes `className="dark"` on `<html>`, and `app/globals.css` defines a single `:root` block of `--dc-*` CSS custom properties with dark-tuned values (near-black backgrounds, light text). There is no theme-switching infrastructure of any kind — no `next-themes`, no `dark:` Tailwind variants, no persisted preference, no theme toggle UI.

Users need a light theme option.

## Goals

- Add a fully functional light theme alongside the existing dark theme.
- Default to the user's OS/browser color-scheme preference (`system`) on first visit.
- Let the user manually override to Light or Dark from Settings; override persists in `localStorage` only (no DB sync, no cross-device propagation).
- No flash-of-wrong-theme on page load.
- Full visual pass: every screen and every hardcoded/literal color gets a theme-aware treatment, not just the core layout.

## Non-goals

- Server-side / cross-device persistence of the theme preference (explicitly deferred — localStorage only).
- A quick-toggle control outside Settings (e.g. header/nav icon) — Settings page only for now.
- Custom accent-color theming (only light/dark, not user-chosen brand colors).

## Architecture

### Library: `next-themes`

Add `next-themes` as a dependency. It is purpose-built for this exact requirement set (system-preference default, localStorage persistence, no-flash blocking script) and avoids hand-rolling a `matchMedia` + blocking-script solution.

- Wrap the app in `components/providers.tsx`:
  ```tsx
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="dc-theme">
  ```
- Remove the hardcoded `className="dark"` from `<html>` in `app/layout.tsx`. `next-themes` manages the class itself (`class="dark"` or `class="light"` on `<html>`) and injects its blocking script into `<head>` to set the correct class before first paint.

### Token restructuring (`app/globals.css`)

All existing `--dc-*` variable **names** stay the same, so no component code that reads `var(--dc-...)` needs to change.

- `:root` keeps today's dark palette values, unchanged — this is both the explicit dark theme and the safe default shown for the brief pre-hydration window before `next-themes`' blocking script runs (matches current behavior exactly, so no regression risk there).
- A new `.light { ... }` block (matching on the `class="light"` `next-themes` sets on `<html>`) overrides just the tokens that need to flip. `:root` and `.light` have equal CSS specificity (both single-class-level selectors); `.light` wins when present because it's declared later in the file — no `.dark` block is needed.
- The light palette keeps the existing brand accent hues (`--dc-secondary` cyan, `--dc-accent` pink, and status colors) unchanged — they're used decoratively (gradients, glows, a notification-dot badge), never as plain text, so they read fine on either background. `--dc-primary` is deepened slightly (`#8b5cf6` → `#7c3aed`) because it's used directly as link/button text color in several places and needed better contrast against white. Structural tokens flip:
  - Backgrounds: near-black → white/near-white (e.g. `--dc-bg-body: #ffffff`, `--dc-bg-primary: #f8fafc`, `--dc-bg-card: #ffffff`, `--dc-bg-elevated: #f1f5f9`).
  - Borders: `rgba(255,255,255,0.08)` → a light equivalent (e.g. `rgba(15,23,42,0.08)`).
  - Text: `#f8fafc`/`#94a3b8`/`#64748b` (light-on-dark) → dark slate equivalents with equivalent contrast ratios.
  - Shadows: dark-tuned `rgba(0,0,0,0.3–0.5)` shadow stack gets a lighter-weight equivalent so cards don't look muddy on a white background.
  - Gradients (`--dc-gradient-card`, `--dc-gradient-subtle`, `--dc-gradient-glass`): re-tuned so glass/gradient overlays read correctly against light surfaces instead of washing out.

### Bug fix bundled into this work: missing tokens

Two `--dc-*` custom properties are referenced throughout the app but never defined anywhere in `globals.css`, so they currently resolve to nothing:

- `--dc-bg-secondary` — referenced in **27 files** (form inputs, hover states, chips, list rows).
- `--dc-primary-dark` — referenced in **6 files** as a hover-state color for primary buttons/links (`app/(dashboard)/insights/page.tsx:247`, `app/(dashboard)/goals/page.tsx:346`, `components/settings/NotificationSettings.tsx:176`, `components/dashboard/DebtProgress.tsx:125`, `components/dashboard/SavingsGoals.tsx:119,232`).

Both will be properly defined in both the `.dark` and `.light` blocks as part of the token restructuring — not a separate follow-up, since the whole `:root` block is being rebuilt into theme-scoped blocks anyway.

### Hardcoded raw `rgba(...)` values

`.glass` and `.glass-card` in `globals.css` currently hardcode dark-tuned `rgba(15,16,22,0.7)` / `rgba(24,24,35,0.6)` directly rather than referencing tokens. These will be converted to reference (or be replaced by) theme-aware custom properties so glassmorphism looks correct in both themes.

### PWA theme-color meta tag

`app/layout.tsx`'s `viewport.themeColor` is currently a static `#0a0a0f`, which colors the mobile browser chrome / installed-PWA status bar. A small client component will use `useTheme()` to keep `<meta name="theme-color">` in sync with the resolved theme at runtime, so an installed light-mode PWA doesn't show a dark status bar.

## UI: Appearance settings

New `components/settings/AppearanceSettings.tsx`, matching the existing style of `NotificationSettings.tsx` / `CategorySettings.tsx`, added as its own card in `app/(dashboard)/settings/page.tsx`.

- Three options: **System** (default) / **Light** / **Dark**.
- Uses `useTheme()` from `next-themes` directly — `theme`/`setTheme('system' | 'light' | 'dark')`. No new API route, no DB write (matches the localStorage-only persistence decision).

## Visual fix scope (corrected after full audit)

The initial exploration pass flagged "~24 files with literal Tailwind classes" and "~7 files with hardcoded hex" as at-risk. A concrete grep + manual read of every occurrence (not just a rough count) found the real picture is much smaller:

- **Literal Tailwind classes** (`bg-black`, `text-white`, `bg-gray-*`, etc.): almost all occurrences are intentionally theme-agnostic — white text on solid-color buttons/badges/gradients (e.g. `bg-red-500 text-white`), translucent black modal overlay scrims (`bg-black/60`), and an iOS-style toggle switch thumb (`bg-white` on a colored track). None of these need to change; a colored button's white label text doesn't stop being readable when the *page* background changes theme.
  - **One real gap:** `app/(dashboard)/import/page.tsx:666` — the "low confidence" match badge uses `bg-gray-500/20 text-gray-400`, tuned for a dark canvas. This needs to become token-based so it keeps sufficient contrast on a light background.
- **Hardcoded hex colors** in `components/modals/SavingsGoalModal.tsx` (goal color swatches), `app/(dashboard)/goals/page.tsx` (progress bar gradient), `components/dashboard/QuickAccess.tsx` (quick-link icon accents), `components/dashboard/SavingsGoals.tsx` (100%-complete override color), `components/dashboard/MonthOverMonthChart.tsx` (bar gradient stops), and `components/dashboard/SpendingChart.tsx` (fallback slice color): all of these are deliberate vivid/mid-saturation accent or data-visualization colors, not structural background/text colors. They're legible against both a near-black and a white canvas by design (that's why they were chosen), so **no code change is needed** — confirmed by visual check during manual QA rather than left as an assumption.
- **Chart axis/grid/tooltip styling** in `MonthOverMonthChart.tsx` and `SpendingChart.tsx` already reads `var(--dc-text-muted)` / `var(--dc-border)` / `var(--dc-bg-card)` directly (Recharts accepts CSS custom properties as style values) — already theme-safe, confirmed by reading the source, not assumed.

Net real work in this category: **one file** (`import/page.tsx`), plus the `--dc-bg-secondary` token fix already covered under token restructuring. Everything else in this section is a verify-only step during the manual QA pass, not a code change.

## Testing / verification

No automated visual test suite exists for this app. Verification is manual: after implementation, walk through all main screens (dashboard, expenses, obligations, goals, insights, settings) in both Light and Dark, and fix anything that reads wrong — "it compiles" is not sufficient to call this done.

## Summary of file-level changes

- `package.json` — add `next-themes` dependency.
- `components/providers.tsx` — wrap app in `ThemeProvider`.
- `app/layout.tsx` — remove hardcoded `className="dark"`; add dynamic theme-color meta sync.
- `app/globals.css` — split `:root` values into `.dark` / `.light` blocks; add missing `--dc-bg-secondary`; theme-ify hardcoded `rgba(...)` in `.glass`/`.glass-card`/shadows/gradients.
- `components/settings/AppearanceSettings.tsx` — new component.
- `app/(dashboard)/settings/page.tsx` — add Appearance card.
- `app/(dashboard)/import/page.tsx` — fix one dark-only badge (`bg-gray-500/20 text-gray-400`) to use theme tokens.
- All other flagged files (goal/chart/icon accent colors) — verified theme-agnostic by design; no change, confirmed visually during manual QA.
