# iOS "Add to Home Screen" install guide — design

**Date:** 2026-06-10
**Status:** Approved (ready for implementation plan)
**Branch / worktree:** `ios-home-screen-install-guide` (`.claude/worktrees/ios-home-screen-guide`), rebased on `origin/main` (includes logo #8 + skin-picker #9)

## Purpose

Help iPhone/iPad users install NightCalc to their Home Screen so it launches full-screen (its own window, no Safari chrome) for fast bedside use. iOS Safari does not expose a programmatic install prompt, so the only path is the manual Share → Add to Home Screen flow. This feature guides the user through that flow with steps that match the **current iOS 26 Safari UI**, where the Share action moved into the **•••** menu next to the address bar.

This is chrome only — it never touches clinical inputs, results, or warnings.

## Scope

In scope:
- Detect eligible context (iOS Safari, not already installed).
- A proactive, dismissible install **banner**.
- A persistent **⋯-menu entry** that opens the guide.
- A modal **bottom-sheet guide** with the iOS 26 steps, shared by both triggers.

Out of scope (not requested; possible future work):
- Android / desktop `beforeinstallprompt` handling.
- Guidance for non-Safari iOS browsers (they can't add web apps).
- Automated tests (project is static and has no test harness).

## Eligibility / detection

The feature renders **only** when `a2hsEligible()` is true:

```
isIosSafari():
  isIosDevice = /iP(hone|od|ad)/.test(ua)
             || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)   // iPadOS reports as Mac
  isSafari    = /Safari/.test(ua)
             && !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|Twitter)/.test(ua)  // exclude other browsers / in-app webviews
  return isIosDevice && isSafari

isStandalone():
  return navigator.standalone === true
      || matchMedia('(display-mode: standalone)').matches   // already installed

a2hsEligible() = isIosSafari() && !isStandalone()
```

Detection is best-effort (iOS gives no reliable API); this is documented in the code. Non-eligible contexts (desktop, Android, other iOS browsers, already-installed) render nothing.

## Components

Three small pieces. Markup lives **static and hidden** in `index.html` (matching the existing app-shell pattern) and is revealed/managed by `app.js`.

### 1. Install banner
- Slim bar pinned to the bottom, above the iPhone safe-area inset. Content: a share glyph, "Add NightCalc to your Home Screen", and a ✕ dismiss button.
- Tapping the bar (not the ✕) opens the sheet. Tapping ✕ dismisses permanently.
- Auto-shown on load when `a2hsEligible() && !a2hsDismissed()`.

### 2. ⋯-menu entry
- An "Add to Home Screen" button appended to the existing disclosure panel (`<details class="disclosure-menu">`).
- Visible whenever `a2hsEligible()` — **independent of banner dismissal**, so the guide is never lost.
- Tapping it closes the menu and opens the sheet.

### 3. Bottom-sheet guide (shared)
- Modal: dimmed scrim + sheet that slides up from the bottom. One component opened by both triggers above.
- Dialog semantics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title.

## Guide content (current iOS 26 steps)

Title: **Add NightCalc to your Home Screen**
Subtitle: *One tap from your iPhone — full-screen, no Safari bars.*

1. Tap **•••** (top-right of the address bar), then **Share**. *(share glyph shown)*
2. Scroll down and tap **Add to Home Screen**.
3. Keep **Open as Web App** on, then tap **Add**.

Footer: *That's it — NightCalc launches like a native app, with its own icon.* (The icon is the `apple-touch-icon` added in PR #8.)

## Behavior & persistence

- New localStorage key **`nightcalc.a2hs.v1`** (follows the `nightcalc.<thing>.v1` convention; add to `migrateLegacyKeys` only if a legacy `medcalc.*` equivalent is ever needed — none exists, so no migration).
- `nightcalc.a2hs.v1 = "dismissed"` is written **only** when the banner ✕ is tapped. After that the banner never auto-shows again.
- **Opening or closing the sheet does not dismiss** — a curious tap won't hide the banner forever. Only ✕ dismisses.
- The ⋯ entry ignores the dismissed flag (always available when eligible).

## Theming & accessibility

- Banner and sheet use existing theme tokens (`--panel`, `--ink`, `--muted`, `--line`, `--accent`, `--shadow`) so they adapt to light/dark and the blue/maroon accent with no extra work. Dense and clinical; no decorative styling (AGENTS.md).
- Sheet a11y: focus moves into the sheet on open and is trapped; **Esc**, scrim tap, and ✕ all close; focus returns to the triggering element on close.
- Respects `prefers-reduced-motion` (skip slide/fade transitions).
- Respects `env(safe-area-inset-bottom)` for the banner and sheet on notched iPhones.

### Pixel-skin compatibility (the `data-skin="pixel"` axis added by PR #9)

The banner, scrim, sheet, and ⋯ menu item must compose with the Pixel skin like every other surface:
- Add `:root[data-skin="pixel"]` rules for the new components: `border-radius: 0`, `border-width: 3px` on the banner/sheet, and `box-shadow: var(--shadow)` (the hard pixel shadow) on the raised sheet. They already inherit Silkscreen (set on `body`) and the theme/accent tokens, so type and color need no extra work.
- The dark-only CRT scanline overlay (`body::after`, `z-index: 9999`, `pointer-events: none`) may render over the sheet — that is on-theme and harmless (it cannot intercept taps). Keep the scrim opaque enough that sheet text stays legible; no special z-index handling required.

## Files & versioning

| File | Change |
|---|---|
| `index.html` | Add hidden banner + sheet markup; add hidden ⋯-menu "Add to Home Screen" row |
| `styles.css` | Banner, scrim, sheet, step, and menu-item styles (token-based) |
| `app.js` | Detection helpers, eligibility wiring, open/close sheet, dismissal persistence, focus/keyboard handling |
| `service-worker.js` + `index.html` `?v=` | Bump cache version (both locations, per the versioning rule) |

No new image assets — glyphs are inline SVG.

**Versioning:** the branch is rebased onto `origin/main`, now at `v59` / `nightcalc-v59` (after logo #8 and skin-picker #9 merged). This feature bumps both locations — the `?v=` query strings in `index.html` and `CACHE_NAME` in `service-worker.js` — to **`v60` / `nightcalc-v60`**.

Docs to update during implementation: `MEMORY.md` (session log, version) and `AGENTS.md` (note the install-guide component and the `nightcalc.a2hs.v1` key).

## Testing (manual, per AGENTS.md)

1. Serve; open DevTools device emulation as iPhone with an iOS Safari user agent.
2. Eligible: banner appears → tap → sheet opens → steps correct → ✕ persists across reload while the ⋯ entry remains.
3. Not eligible: standalone (`display-mode: standalone`), desktop, and Android show nothing.
4. Light + dark themes, blue + maroon accents, **default + pixel skins**; widths ~390px and ~1280px; console clean.
5. Keyboard: Esc closes the sheet; focus is trapped while open and restored on close.
6. Verify both version-bump locations updated.
7. Recommend a final real-device check (emulation can't fully reproduce `navigator.standalone`).

## Approaches considered

- **Trigger:** auto-banner only / menu-only / **both ✓** (chosen via mockup — proactive once, then quietly available).
- **Container:** **bottom sheet ✓** / inline panel (chosen via mockup — one component, identical from both triggers, matches the iOS sheet pattern).
