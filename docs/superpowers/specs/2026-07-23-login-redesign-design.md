# Login Screen Redesign

**Date:** 2026-07-23
**Scope:** `app/(auth)/login/page.tsx` and a new `app/(auth)/forgot-password/page.tsx`. No changes to the design token system (`app/globals.css`), auth backend, or any other screen.

## Goal

The current login screen (icon-prefixed inputs, gradient wordmark, two-tone purple gradient CTA) reads as a template. Redesign it toward a "warm & trustworthy" fintech aesthetic — Apple HIG / Stripe register — restrained, confident, premium without visual noise. Primary usage is mobile PWA (installed to home screen), so the layout must be mobile-first.

Functionality (NextAuth `signIn('credentials', ...)` flow, error mapping, redirect on success) is unchanged. This is a visual/UX pass plus two small additive pieces: a password visibility toggle and a "Forgot password?" link to a new coming-soon page.

## Layout & structure

- Root container uses `min-h-dvh` (not `min-h-screen`) so mobile browser chrome doesn't clip content, plus safe-area padding (`env(safe-area-inset-*)`) for notched devices.
- Content column is vertically centered but weighted slightly above true center (e.g. `justify-center` with extra bottom flex-basis, or top padding bias) so it doesn't feel crowded once the keyboard opens on a phone.
- Background: flat `--dc-bg-primary` plus a soft radial wash behind the header using existing `--dc-shadow-glow` / `--dc-gradient-subtle` tokens. Subtle depth, not a glow effect — no new color tokens introduced.

## Brand header

- Replace the gradient-text "Dominion Core" wordmark with: a small rounded-square icon mark (soft `--dc-primary` fill, single glyph) above a plain-ink wordmark (`--dc-text-primary`, no gradient).
- Subtext "Personal Finance Dashboard" stays, restyled smaller/lighter so it reads as a caption under the wordmark, not a competing headline.
- "Welcome back" heading stays inside the card, unchanged in meaning.

## Form fields

- Remove the decorative left-side icons (Mail/Lock) from inputs. Top labels only — cleaner, matches the Stripe Checkout field pattern for this calmer direction.
- Inputs: 52px height (comfortable mobile tap target), `rounded-2xl` corners, hairline border (`--dc-border`) that strengthens to a subtle focus ring (`--dc-primary`) on focus — no color-jump transition. Font size stays ≥16px to prevent iOS auto-zoom on focus.
- Fix accessibility gap in current code: `<label>` elements are not programmatically associated with their inputs (no `htmlFor`/`id` pairing). Add matching `id`/`htmlFor` for both fields as part of this pass.
- Password field gets a show/hide toggle (eye icon button) inside the field, right-aligned.
- Add a "Forgot password?" link, right-aligned next to the "Password" label, pointing to `/forgot-password`.

## Forgot password page

- New route: `app/(auth)/forgot-password/page.tsx`.
- Reuses the same shell as login (icon mark, background wash, card container) so it doesn't feel like a different app.
- Content: heading (e.g. "Reset your password"), a short "coming soon" message, and a link back to `/login`. No form, no email input, no backend call — this is a placeholder screen only.

## Button & error states

- Replace the two-tone purple gradient CTA with a single solid `--dc-primary` fill button, no arrow icon — just "Sign in" text, swapping to a spinner (existing `Loader2` pattern) while `isLoading`.
- Hover/press states use a subtle opacity or elevation shift, not a gradient shimmer.
- Error message block keeps its current position (below fields, above button) and existing copy/mapping logic, but restyled quieter: soft red-tinted background, no heavy glow border, small icon + message text.

## Motion & accessibility

- Keep the existing framer-motion entrance animation (header + card fade/slide-in) but tone it down: ~250ms duration (down from 500ms), smaller initial y-offset, drop the scale-pop on the heading.
- Respect `prefers-reduced-motion`: use framer-motion's `useReducedMotion` hook to skip/shorten the entrance animation for users who've opted out of motion. Currently not handled at all.

## Footer

- "Don't have an account? Create one" link stays as-is, restyled to match the new type scale (no functional change).

## Out of scope

- No changes to `app/globals.css` tokens, the register page, or any other screen.
- No new auth methods (social login, passkeys, magic link) — backend only supports credentials.
- No backend/route for actual password reset — the forgot-password page is a static placeholder only.
- No "Remember me" or legal/privacy footer text — not requested, avoids scope creep.
