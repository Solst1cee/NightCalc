# iOS "Add to Home Screen" install guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guide iOS Safari users to install NightCalc to their Home Screen via a dismissible banner + a ⋯-menu entry that open a shared modal bottom-sheet with the current iOS 26 steps.

**Architecture:** Static markup (hidden) in `index.html`, token-based styles in `styles.css`, and detection/show-hide/persistence logic in `app.js` — mirroring the existing accent/skin picker patterns. Gated entirely behind an iOS-Safari + not-installed check, so other platforms render nothing. Composes with the existing `data-theme`, `data-accent`, and `data-skin` axes.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no dependencies. localStorage for persistence. Service-worker precache for offline.

**Spec:** [`docs/superpowers/specs/2026-06-10-ios-home-screen-install-guide-design.md`](../specs/2026-06-10-ios-home-screen-install-guide-design.md)

**Verification approach (no test harness):** Per AGENTS.md the project is static and dependency-free with manual testing. Each task is verified by serving locally (`python -m http.server 4173 --bind 127.0.0.1`) and checking in headless Chrome and/or DevTools device emulation. To exercise the iOS path on desktop, override the user agent and `navigator.standalone` (shown per task). Commit after each task passes.

**Baseline:** branch `ios-home-screen-install-guide`, rebased on `origin/main` at `v59` / `nightcalc-v59` (incl. logo #8, skin-picker #9). This feature ships `v60` / `nightcalc-v60`.

---

## File structure

| File | Responsibility |
|---|---|
| `app.js` | Detection helpers (`isIosSafari`/`isStandalone`/`a2hsEligible`), the `nightcalc.a2hs.v1` dismissal state, init wiring, sheet open/close + focus trap |
| `index.html` | Hidden banner, hidden overlay+sheet, the ⋯-menu "Add to Home Screen" row; `?v=60` bump |
| `styles.css` | Banner / scrim / sheet / steps / menu-item styles (token-based) + `data-skin="pixel"` overrides + reduced-motion + safe-area |
| `service-worker.js` | `CACHE_NAME` → `nightcalc-v60` |
| `MEMORY.md`, `AGENTS.md` | Session log + component/key documentation |

All new glyphs are inline SVG — no new image assets, so the service-worker `ASSETS` list does not change.

---

## Task 1: Detection + dismissal-state helpers (`app.js`)

**Files:**
- Modify: `app.js` — add `A2HS_KEY` beside the other storage-key constants (top of file, near `SKIN_KEY`); add the helper functions beside the other top-level helpers (near `applySkin`/`setSkin`).

- [ ] **Step 1: Add the storage key constant**

In `app.js`, immediately after the line `const SKIN_KEY = "nightcalc.skin.v1";`, add:

```js
const A2HS_KEY = "nightcalc.a2hs.v1";
```

- [ ] **Step 2: Add the detection + state helpers**

In `app.js`, directly after the `setSkin` function, add:

```js
// ---- iOS "Add to Home Screen" install guide ----
// iOS Safari exposes no install API, so eligibility is best-effort UA detection.
function isIosSafari() {
  const ua = navigator.userAgent;
  const isIosDevice =
    /iP(hone|od|ad)/.test(ua) ||
    // iPadOS 13+ reports as desktop Safari; fall back to the touch-point tell.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIosDevice) return false;
  // Exclude other iOS browsers and in-app webviews — they cannot add web apps.
  return (
    /Safari/.test(ua) &&
    !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|Twitter)/.test(ua)
  );
}

function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function a2hsEligible() {
  return isIosSafari() && !isStandalone();
}

function a2hsDismissed() {
  return localStorage.getItem(A2HS_KEY) === "dismissed";
}
```

- [ ] **Step 3: Verify the helpers exist and behave (headless Chrome console eval)**

Serve, then evaluate the predicate under a desktop UA (expect `false`) — confirms no errors and correct gating:

Run:
```bash
python -m http.server 4173 --bind 127.0.0.1 &
node -e "console.log('serve up')"   # or just open the page
```
In DevTools console on `http://127.0.0.1:4173/`:
```js
isIosSafari()   // false on desktop Chrome
a2hsEligible()  // false
```
Then in DevTools → More tools → Network conditions, set UA to an iPhone Safari string (e.g. `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1`), reload, and re-check:
```js
isIosSafari()   // true
a2hsEligible()  // true (browser tab is not standalone)
```
Expected: no console errors; values as commented.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "Add iOS Safari detection + A2HS dismissal-state helpers"
```

---

## Task 2: Static markup — banner, sheet, menu row + version bump (`index.html`)

**Files:**
- Modify: `index.html` — add the ⋯-menu row inside `.disclosure-panel`; add the banner and overlay+sheet as the last children of `.app-shell`; bump `styles.css?v=` and `app.js?v=` to `60`.

- [ ] **Step 1: Add the menu row inside the disclosure panel**

In `index.html`, inside `<div class="disclosure-panel">`, immediately after the `<h2>Contact</h2>` block's contact rows (before the `<h2>Skin</h2>` section), add:

```html
<div class="a2hs-menu-row" id="a2hsMenuRow" hidden>
  <h2>Install</h2>
  <button type="button" class="a2hs-menu-item" id="a2hsMenuItem">Add to Home Screen</button>
</div>
```

- [ ] **Step 2: Add the banner + overlay/sheet at the end of `.app-shell`**

In `index.html`, immediately before the closing `</div>` of `<div class="app-shell">` (after `</main>`), add:

```html
<div class="install-banner" id="installBanner" hidden role="region" aria-label="Install NightCalc">
  <button type="button" class="install-banner-main">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 15V4M8 8l4-4 4 4"></path>
      <path d="M6 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1"></path>
    </svg>
    <span>Add NightCalc to your Home Screen</span>
  </button>
  <button type="button" class="install-banner-dismiss" aria-label="Dismiss">&times;</button>
</div>

<div class="install-overlay" id="installOverlay" hidden>
  <div class="install-sheet" id="installSheet" role="dialog" aria-modal="true" aria-labelledby="installTitle">
    <div class="install-sheet-handle" aria-hidden="true"></div>
    <button type="button" class="install-close" aria-label="Close">&times;</button>
    <h2 id="installTitle" class="install-title">Add NightCalc to your Home Screen</h2>
    <p class="install-sub">One tap from your iPhone — full-screen, no Safari bars.</p>
    <ol class="install-steps">
      <li>
        <span class="install-step-n">1</span>
        <span>Tap <b>&ctdot;</b> (top-right of the address bar), then <b>Share</b>.</span>
        <svg class="install-step-glyph" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4"></path><path d="M6 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1"></path></svg>
      </li>
      <li>
        <span class="install-step-n">2</span>
        <span>Scroll down and tap <b>Add to Home Screen</b>.</span>
      </li>
      <li>
        <span class="install-step-n">3</span>
        <span>Keep <b>Open as Web App</b> on, then tap <b>Add</b>.</span>
      </li>
    </ol>
    <p class="install-foot">That&rsquo;s it — NightCalc launches like a native app, with its own icon.</p>
  </div>
</div>
```

- [ ] **Step 3: Bump cache-busting versions**

In `index.html`, change `styles.css?v=59` → `styles.css?v=60` and `app.js?v=59` → `app.js?v=60`.

- [ ] **Step 4: Verify markup is present and hidden**

Serve and load `http://127.0.0.1:4173/`. In DevTools console:
```js
document.querySelector("#installBanner").hidden    // true
document.querySelector("#installOverlay").hidden   // true
document.querySelector("#a2hsMenuRow").hidden      // true
document.querySelector("#installSheet").getAttribute("role")  // "dialog"
```
Expected: all hidden true, role "dialog", page renders normally with no visible change and no console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Add hidden install banner, sheet, and menu row; bump assets to v60"
```

---

## Task 3: Styles — banner, scrim, sheet, steps, menu item (`styles.css`)

**Files:**
- Modify: `styles.css` — append a new section at the end of the file (before the pixel-skin block is fine; place it after the existing default-skin rules and before/after is cosmetic — append at end of file, the pixel block stays last after Task 6 adds to it).

- [ ] **Step 1: Append the install-guide styles**

At the end of `styles.css`, add:

```css
/* ============================================================================
   NightCalc — iOS "Add to Home Screen" install guide
   Banner + modal bottom sheet + ⋯-menu row. Token-based, so it inherits
   light/dark + accent. Shown only on iOS Safari (gated in app.js).
   ========================================================================== */

.install-banner {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  padding: 6px;
}
.install-banner[hidden] { display: none; }
.install-banner-main {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 10px;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: var(--ink);
  font-weight: 650;
  text-align: left;
  cursor: pointer;
}
.install-banner-main svg { flex: 0 0 auto; color: var(--accent); }
.install-banner-dismiss {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  min-height: 40px;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: var(--muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.install-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(2, 6, 16, 0.55);
}
.install-overlay[hidden] { display: none; }
.install-sheet {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 14px 18px calc(18px + env(safe-area-inset-bottom, 0px));
  background: var(--panel);
  color: var(--ink);
  border: 1px solid var(--line);
  border-bottom: 0;
  border-radius: 18px 18px 0 0;
  box-shadow: var(--shadow);
}
.install-sheet-handle {
  width: 38px;
  height: 4px;
  margin: 2px auto 12px;
  border-radius: 2px;
  background: var(--line);
}
.install-close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 36px;
  height: 36px;
  min-height: 36px;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: var(--muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.install-title { margin: 0 0 4px; font-size: 18px; }
.install-sub { margin: 0 0 14px; color: var(--muted); font-size: 14px; }
.install-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.install-steps li { display: flex; align-items: center; gap: 10px; }
.install-steps li > span:nth-child(2) { font-size: 14px; line-height: 1.35; }
.install-step-n {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.install-step-glyph { flex: 0 0 auto; margin-left: auto; color: var(--muted); }
.install-foot { margin: 14px 0 0; color: var(--muted); font-size: 13px; }

.a2hs-menu-row[hidden] { display: none; }
.a2hs-menu-item {
  display: block;
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  background: var(--panel);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
}

@media (prefers-reduced-motion: no-preference) {
  .install-overlay:not([hidden]) { animation: a2hs-fade 0.18s ease both; }
  .install-sheet { animation: a2hs-rise 0.22s ease both; }
  .install-banner:not([hidden]) { animation: a2hs-rise 0.22s ease both; }
  @keyframes a2hs-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes a2hs-rise {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}
```

- [ ] **Step 2: Verify styling by force-showing (DevTools)**

Serve and load the page. In DevTools console, force the elements visible to inspect styling without iOS detection:
```js
installOverlay.hidden = false;   // sheet appears over a dimmed scrim
installBanner.hidden = false;    // banner appears bottom
```
Check: sheet sits at the bottom over a scrim, readable steps, rounded top, close button top-right; banner pinned bottom. Toggle theme (sun/moon) and accent (blue/maroon) in the UI — banner/sheet recolor with tokens. Capture screenshots in light and dark:
```bash
# Chrome headless screenshot (see CLAUDE/AGENTS verification notes)
```
Expected: legible in all four theme×accent combos; no layout overflow at 390px width.

- [ ] **Step 3: Re-hide and commit**

Re-hide (`installOverlay.hidden = true; installBanner.hidden = true`) is automatic on reload. Commit:
```bash
git add styles.css
git commit -m "Style the install banner, bottom sheet, and menu row"
```

---

## Task 4: Wire eligibility, banner show/dismiss, menu reveal (`app.js`)

**Files:**
- Modify: `app.js` — add `els` entries near the other `els` query selectors; add `initInstallGuide()` and call it where `applySkin(...)` is called at load; add click listeners near the other picker listeners at the bottom of the file.

- [ ] **Step 1: Add element references**

In `app.js`, inside the `els = { ... }` object, after the `skinPicker:` entry, add:

```js
  installBanner: document.querySelector("#installBanner"),
  installOverlay: document.querySelector("#installOverlay"),
  installSheet: document.querySelector("#installSheet"),
  a2hsMenuRow: document.querySelector("#a2hsMenuRow"),
  a2hsMenuItem: document.querySelector("#a2hsMenuItem"),
```

- [ ] **Step 2: Add the init function and call it at load**

In `app.js`, immediately after the `applySkin(localStorage.getItem(SKIN_KEY) || DEFAULT_SKIN);` load line, add:

```js
initInstallGuide();
```

Then add the function next to the other A2HS helpers (after `a2hsDismissed`):

```js
function initInstallGuide() {
  if (!a2hsEligible()) return; // desktop / Android / other browsers / already installed → nothing
  els.a2hsMenuRow?.removeAttribute("hidden"); // menu entry: always available when eligible
  if (!a2hsDismissed()) {
    els.installBanner?.removeAttribute("hidden"); // proactive banner once, until dismissed
  }
}
```

- [ ] **Step 3: Add the banner click handler (open vs dismiss)**

In `app.js`, near the bottom where `els.skinPicker?.addEventListener(...)` is wired, add:

```js
els.installBanner?.addEventListener("click", (event) => {
  if (event.target.closest(".install-banner-dismiss")) {
    localStorage.setItem(A2HS_KEY, "dismissed");
    els.installBanner.setAttribute("hidden", "");
    return;
  }
  openInstallSheet(els.installBanner.querySelector(".install-banner-main"));
});
```

(`openInstallSheet` is added in Task 5; it is safe to reference here because both ship before the feature is exercised. If implementing strictly task-by-task, define a temporary no-op `function openInstallSheet() {}` now and replace it in Task 5 — or implement Task 5 before testing interactions.)

- [ ] **Step 4: Verify banner appears + dismissal persists (DevTools iPhone emulation)**

Serve. In DevTools, set an iPhone Safari UA (Task 1 string) and reload. Expected: the banner appears at the bottom; the ⋯ menu shows an "Add to Home Screen" row. Click the banner ✕. Expected: banner hides. Reload (UA still iPhone). Expected: banner does **not** reappear, but the ⋯ row is still present. In console:
```js
localStorage.getItem("nightcalc.a2hs.v1")  // "dismissed"
```
Reset for further testing: `localStorage.removeItem("nightcalc.a2hs.v1")`.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "Wire install banner/menu reveal + dismissal on eligible iOS Safari"
```

---

## Task 5: Sheet open/close + focus trap + Esc + scrim (`app.js`)

**Files:**
- Modify: `app.js` — add the sheet controller functions (after `initInstallGuide`) and the menu-item + overlay listeners (near the banner listener from Task 4). If a temporary `openInstallSheet` no-op was added in Task 4, replace it.

- [ ] **Step 1: Add the sheet controller**

In `app.js`, after `initInstallGuide`, add:

```js
let a2hsLastFocus = null;

function openInstallSheet(trigger) {
  a2hsLastFocus = trigger || document.activeElement;
  els.installOverlay.removeAttribute("hidden");
  const focusTarget = els.installSheet.querySelector(".install-close") || els.installSheet;
  focusTarget.focus();
  document.addEventListener("keydown", onInstallKeydown);
}

function closeInstallSheet() {
  els.installOverlay.setAttribute("hidden", "");
  document.removeEventListener("keydown", onInstallKeydown);
  if (a2hsLastFocus && typeof a2hsLastFocus.focus === "function") a2hsLastFocus.focus();
  a2hsLastFocus = null;
}

function onInstallKeydown(event) {
  if (event.key === "Escape") {
    closeInstallSheet();
    return;
  }
  if (event.key !== "Tab") return;
  const focusables = els.installSheet.querySelectorAll(
    'button, [href], input, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
```

- [ ] **Step 2: Add the menu-item and overlay (scrim + close) listeners**

In `app.js`, right after the `els.installBanner?.addEventListener(...)` from Task 4, add:

```js
els.a2hsMenuItem?.addEventListener("click", () => {
  els.a2hsMenuItem.closest("details.disclosure-menu")?.removeAttribute("open");
  openInstallSheet(els.a2hsMenuItem);
});

els.installOverlay?.addEventListener("click", (event) => {
  if (event.target === els.installOverlay || event.target.closest(".install-close")) {
    closeInstallSheet();
  }
});
```

- [ ] **Step 3: Verify open/close + a11y (DevTools iPhone emulation)**

Serve, iPhone UA, reload, `localStorage.removeItem("nightcalc.a2hs.v1")`, reload.
- Tap the banner body → sheet slides up over a scrim; the steps read correctly (iOS 26: ••• → Share → Add to Home Screen → Open as Web App → Add).
- Press **Esc** → sheet closes, focus returns to the banner.
- Open the ⋯ menu → tap "Add to Home Screen" → menu closes, sheet opens.
- Tap the dimmed scrim outside the sheet, and the ✕ → both close.
- With the sheet open, press Tab repeatedly → focus stays within the sheet (close button is the only focusable; focus cycles to it).
Expected: all behaviors as described, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "Open/close install sheet with focus trap, Esc, and scrim dismiss"
```

---

## Task 6: Pixel-skin compatibility (`styles.css`)

**Files:**
- Modify: `styles.css` — append to the existing `PIXEL SKIN` block at the end of the file.

- [ ] **Step 1: Append pixel overrides for the new components**

At the very end of `styles.css` (after the existing pixel-skin rules), add:

```css
/* ---- install guide under the pixel skin: square + thick + hard shadow ---- */
:root[data-skin="pixel"] .install-banner,
:root[data-skin="pixel"] .install-sheet,
:root[data-skin="pixel"] .install-banner-main,
:root[data-skin="pixel"] .a2hs-menu-item { border-radius: 0; }
:root[data-skin="pixel"] .install-banner { border-width: 3px; }
:root[data-skin="pixel"] .install-sheet { border-width: 3px; border-bottom-width: 0; }
:root[data-skin="pixel"] .install-step-n { border-radius: 0; }
:root[data-skin="pixel"] .a2hs-menu-item { border-width: 2px; }
```

- [ ] **Step 2: Verify under the pixel skin**

Serve, iPhone UA, reload. In the ⋯ menu set Skin → **Pixel**. Force-show the sheet (`installOverlay.hidden = false`). Expected: banner/sheet now have square corners, 3px borders, hard shadow, and Silkscreen type (inherited), consistent with the rest of the pixel skin. Toggle dark theme — the CRT scanlines render over the sheet (faint, on-theme) and do not block the close button (it still clicks). Check light + dark.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "Make the install guide compose with the Pixel skin"
```

---

## Task 7: Service-worker cache bump (`service-worker.js`)

**Files:**
- Modify: `service-worker.js:1`

- [ ] **Step 1: Bump the cache name**

In `service-worker.js`, change line 1:
```js
const CACHE_NAME = "nightcalc-v60";
```
(No `ASSETS` change — the feature adds no new files.)

- [ ] **Step 2: Verify both version locations agree**

```bash
grep -n "v=60" index.html        # styles.css?v=60 and app.js?v=60
grep -n "nightcalc-v60" service-worker.js
```
Expected: two matches in `index.html`, one in `service-worker.js`. Reload the served page twice; in DevTools → Application → Cache Storage, confirm `nightcalc-v60` is created and older caches are cleared on activate.

- [ ] **Step 3: Commit**

```bash
git add service-worker.js
git commit -m "Bump service-worker cache to nightcalc-v60"
```

---

## Task 8: Docs (`MEMORY.md`, `AGENTS.md`)

**Files:**
- Modify: `MEMORY.md` — update "Last Session" + "Current Version".
- Modify: `AGENTS.md` — note the install-guide component, the `nightcalc.a2hs.v1` key, and that the iOS home-screen flow follows current iOS 26 Safari (••• → Share → Add to Home Screen).

- [ ] **Step 1: Update MEMORY.md**

Replace the "Last Session" bullet block with an entry describing this feature (date 2026-06-10; banner + ⋯ entry + bottom sheet; iOS-Safari-gated; `nightcalc.a2hs.v1`; iOS 26 steps; composes with Pixel skin; `v60`). Update "Current Version" to `v60` / `nightcalc-v60`.

- [ ] **Step 2: Update AGENTS.md**

Under the relevant section (e.g., Info Menu / Theme area and the storage-key list), add: the install guide shows only on iOS Safari when not already installed; persists dismissal in `localStorage` `nightcalc.a2hs.v1`; steps follow current iOS 26 Safari (••• → Share → Add to Home Screen → keep "Open as Web App" on → Add).

- [ ] **Step 3: Commit**

```bash
git add MEMORY.md AGENTS.md
git commit -m "Document the iOS install guide (component + nightcalc.a2hs.v1 key)"
```

---

## Task 9: Full verification pass + screenshots

**Files:** none (verification only; optional final tidy commit).

- [ ] **Step 1: Matrix check**

Serve. With an iPhone Safari UA:
- Eligible path: banner shows; tap → sheet; steps correct; ✕ persists across reload; ⋯ row persists.
- Themes × accents × skins: default+pixel, light+dark, blue+maroon — banner/sheet legible and on-brand in all.
- Widths: 390px and 1280px — no overflow; banner doesn't cover critical content.
- Keyboard: Esc + focus trap + focus restore.

- [ ] **Step 2: Negative paths**

- Desktop Chrome (normal UA): nothing renders; `a2hsEligible()` is `false`.
- Standalone: in DevTools console run `matchMedia('(display-mode: standalone)').matches` emulation OR add `?` test — confirm `isStandalone()`-gated path hides everything. (Real-device check recommended; note in PR that emulation can't fully reproduce `navigator.standalone`.)
- Console clean throughout.

- [ ] **Step 3: Capture evidence**

Take headless-Chrome screenshots of the sheet in light and dark (default + pixel) for the PR description.

- [ ] **Step 4: Open PR**

```bash
git push -u origin ios-home-screen-install-guide
gh pr create --base main --head ios-home-screen-install-guide \
  --title "Add iOS Add to Home Screen install guide" \
  --body-file -   # summary + screenshots + the emulation caveat
```

---

## Self-review (completed by plan author)

- **Spec coverage:** detection (T1), banner+sheet+menu markup (T2), styles (T3), eligibility/banner/dismissal (T4), sheet a11y/open/close (T5), Pixel-skin compat (T6), v60 bump (T2+T7), docs (T8), full matrix incl. negative paths + real-device caveat (T9). All spec sections map to a task.
- **Placeholders:** none — every code step shows complete code. The only forward reference (`openInstallSheet` used in T4, defined in T5) is called out explicitly with a no-op fallback.
- **Type/name consistency:** `A2HS_KEY`, `a2hsEligible`, `a2hsDismissed`, `initInstallGuide`, `openInstallSheet`/`closeInstallSheet`/`onInstallKeydown`, `a2hsLastFocus`, and element ids (`installBanner`/`installOverlay`/`installSheet`/`a2hsMenuRow`/`a2hsMenuItem`) are used identically across tasks and match the markup in T2 and the CSS selectors in T3/T6.
