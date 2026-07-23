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

All existing `--dc-*` variable **names** stay the same, so no component code that reads `var(--dc-...)` needs to change. Only the *values* move into theme-scoped blocks:

- `.dark { --dc-bg-body: #050507; ... }` — today's palette, values unchanged, just moved out of `:root`.
- `.light { --dc-bg-body: #ffffff; ... }` — new palette. Keeps the existing brand accent hues (`--dc-primary` violet, `--dc-secondary` cyan, `--dc-accent` pink, and status colors) but flips structural tokens:
  - Backgrounds: near-black → white/near-white (e.g. `--dc-bg-body: #ffffff`, `--dc-bg-primary: #f8fafc`, `--dc-bg-card: #ffffff`, `--dc-bg-elevated: #f1f5f9`).
  - Borders: `rgba(255,255,255,0.08)` → a light equivalent (e.g. `rgba(15,23,42,0.08)`).
  - Text: `#f8fafc`/`#94a3b8`/`#64748b` (light-on-dark) → dark slate equivalents with equivalent contrast ratios.
  - Shadows: dark-tuned `rgba(0,0,0,0.3–0.5)` shadow stack gets a lighter-weight equivalent so cards don't look muddy on a white background.
  - Gradients (`--dc-gradient-card`, `--dc-gradient-subtle`, `--dc-gradient-glass`): re-tuned so glass/gradient overlays read correctly against light surfaces instead of washing out.

### Bug fix bundled into this work: missing `--dc-bg-secondary` token

`--dc-bg-secondary` is referenced via `var(--dc-bg-secondary)` in **27 files** (form inputs, hover states, chips, list rows) but is never defined in `globals.css`. It currently resolves to nothing. This token will be properly defined in both the `.dark` and `.light` blocks as part of the token restructuring (not a separate follow-up).

### Hardcoded raw `rgba(...)` values

`.glass` and `.glass-card` in `globals.css` currently hardcode dark-tuned `rgba(15,16,22,0.7)` / `rgba(24,24,35,0.6)` directly rather than referencing tokens. These will be converted to reference (or be replaced by) theme-aware custom properties so glassmorphism looks correct in both themes.

### PWA theme-color meta tag

`app/layout.tsx`'s `viewport.themeColor` is currently a static `#0a0a0f`, which colors the mobile browser chrome / installed-PWA status bar. A small client component will use `useTheme()` to keep `<meta name="theme-color">` in sync with the resolved theme at runtime, so an installed light-mode PWA doesn't show a dark status bar.

## UI: Appearance settings

New `components/settings/AppearanceSettings.tsx`, matching the existing style of `NotificationSettings.tsx` / `CategorySettings.tsx`, added as its own card in `app/(dashboard)/settings/page.tsx`.

- Three options: **System** (default) / **Light** / **Dark**.
- Uses `useTheme()` from `next-themes` directly — `theme`/`setTheme('system' | 'light' | 'dark')`. No new API route, no DB write (matches the localStorage-only persistence decision).

## Visual fix scope (full pass)

Three categories of pre-existing color usage need updating so light mode looks correct everywhere:

1. **~24 files using literal Tailwind color classes** (e.g. `bg-black`, `text-white`) instead of `--dc-*` tokens — swap each to the appropriate token so they flip automatically with theme.
   - **Exception:** translucent black modal/overlay scrims (e.g. `bg-black/60` behind dialogs) are theme-agnostic by design and are left as-is.
2. **~7 files with hardcoded hex colors** — chart lines/fills (`components/dashboard/MonthOverMonthChart.tsx`, `components/dashboard/SpendingChart.tsx`) and category/goal icon colors (`components/modals/SavingsGoalModal.tsx`, `components/dashboard/SavingsGoals.tsx`, `components/dashboard/QuickAccess.tsx`, `app/(dashboard)/goals/page.tsx`). These are largely vibrant accent colors chosen to pop against a near-black background; each gets a visual check against the white background, with saturation/lightness adjusted where it washes out rather than reusing the dark-tuned value verbatim.
3. **Chart fills/gradients** specifically need closer attention — effects tuned for a dark canvas (e.g. low-opacity white glows) typically need a different treatment on light, not just a straight token swap.

## Testing / verification

No automated visual test suite exists for this app. Verification is manual: after implementation, walk through all main screens (dashboard, expenses, obligations, goals, insights, settings) in both Light and Dark, and fix anything that reads wrong — "it compiles" is not sufficient to call this done.

## Summary of file-level changes

- `package.json` — add `next-themes` dependency.
- `components/providers.tsx` — wrap app in `ThemeProvider`.
- `app/layout.tsx` — remove hardcoded `className="dark"`; add dynamic theme-color meta sync.
- `app/globals.css` — split `:root` values into `.dark` / `.light` blocks; add missing `--dc-bg-secondary`; theme-ify hardcoded `rgba(...)` in `.glass`/`.glass-card`/shadows/gradients.
- `components/settings/AppearanceSettings.tsx` — new component.
- `app/(dashboard)/settings/page.tsx` — add Appearance card.
- ~24 files — replace literal Tailwind color classes with tokens.
- ~7 files — adjust hardcoded hex colors for light-mode legibility (charts, goal/category icons).
