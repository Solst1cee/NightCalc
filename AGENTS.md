# NightCalc — AI Agent Context

This is the canonical agent context for NightCalc. It is written for any AI coding agent (Claude Code, Codex, Cursor, Aider, etc.) — Codex and others auto-load `AGENTS.md`; Claude Code is pointed here from `CLAUDE.md`.

Read this file and `MEMORY.md` before making any changes.

---

## Project Purpose

NightCalc is a lightweight clinical calculator web app for a medicine resident during ward rounds — built for night-shift work, with a dark "night" identity. iPhone-first, fast, bedside-usable.

Intentionally simple:
- Static HTML / CSS / JavaScript only
- No framework, no build step, no dependencies
- Session-only patient context
- Runs via local browser or static hosting

**Clinical data is draft/demo unless explicitly marked verified. Do not treat any drug-dose data as clinically authoritative.**

---

## Before You Start

1. Read `MEMORY.md` — current tool status, known bugs, decisions made, what's next
2. Check `index.html` for current cache version string (e.g. `?v=57`)
3. Never assume tool status from this file — always check `MEMORY.md`

---

## Repository

| | |
|---|---|
| **Local workspace** | `C:\Users\User\Project\MedCalc` |
| **GitHub** | `https://github.com/Solst1cee/NightCalc` |
| **GitHub Pages** | `https://solst1cee.github.io/NightCalc/` |
| **Remote** | `origin` |
| **Main branch** | `main` |

> **Note:** the GitHub repo was renamed MedCalc → NightCalc. Only the on-disk workspace folder still uses `MedCalc` (left as-is to avoid breaking the open workspace); rename it locally if desired.

Always run `git status --short` before committing or pushing — there may be local edits ahead of the last push.

---

## Run Locally

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open: `http://127.0.0.1:4173/`

---

## File Map

| File | Role |
|---|---|
| `index.html` | Shell, top bar, theme button, Info Menu, root containers |
| `styles.css` | Full responsive styling and theme variables |
| `app.js` | All app state, data structures, render functions, calculator logic |
| `service-worker.js` | PWA / static asset cache |
| `manifest.webmanifest` | PWA manifest |
| `icons/` | Local UI and status icons; brand icons: `icon.svg` (PWA/manifest), tile-less `favicon.svg`, `apple-touch-icon.png` (+ `.svg` source) for the iOS home screen |
| `brand/` | NightCalc brand kit — static SVGs (`blue/`, `maroon/`), themeable SVGs, `theme.css`, `BRAND.md`, `tools/palette-studio.html` |
| `README.md` | User-facing project overview |
| `AGENTS.md` | This file — canonical AI agent context |
| `CLAUDE.md` | One-line pointer to `AGENTS.md` (Claude Code auto-loads this) |
| `MEMORY.md` | Living progress log — update after every session |

### Icons Reference
| Purpose | File |
|---|---|
| Ready | `icons/icons8-check-24.svg` |
| In progress | `icons/icons8-pickaxe-24.png` |
| Down | `icons/icons8-lightning-bolt-24.png` |
| Back button | `icons/icons8-back-24.png` |

---

## Versioning Rule

When changing any cached asset (`app.js`, `styles.css`, icons, `service-worker.js`):
1. Bump query version strings in `index.html` (e.g. `?v=57` → `?v=58`)
2. Bump `CACHE_NAME` in `service-worker.js` (e.g. `nightcalc-v57` → `nightcalc-v58`)

Both must be updated together. Check current version in `index.html` before bumping.

---

## Core UX Principles

- App opens to the tool/calculator list — never to patient data entry
- Each calculator asks only for the parameters it needs
- Values entered in one tool become reusable session context for other tools
- No permanent patient storage — `sessionStorage` only, never `localStorage` for clinical data
- Calculations update automatically once required fields are filled
- Avoid calculate buttons unless a workflow genuinely needs one
- **Mobile:** tool list → calculator subpage with icon back button
- **Desktop:** left panel = tool list, right panel = active calculator
- Search bars are prefix-based left-to-right unless a specific feature needs broader search
- Search suggestions support keyboard navigation — arrow keys move through list, Enter selects closest/highlighted result
- UI should be dense, calm, and ward-round efficient — not decorative

---

## Session Data

State object: `state.session`
Persisted to: `sessionStorage` key `nightcalc.session.v1`

| Key | Type | Unit/Values |
|---|---|---|
| `age` | number | years |
| `sex` | string | `"male"` \| `"female"` |
| `weight` | number | kg |
| `serumCreatinine` | number | numeric value only |
| `creatinineUnit` | string | `"mg/dL"` \| `"µmol/L"` |
| `calculatedCrCl` | number | mL/min |
| `infusionConcentrationChoices` | object | per-drug preset selections |

**Never add patient identifiers (name, HN, ID, DOB) to session or any storage.**

---

## Data Architecture

### Current Data Objects

| Object | Used By |
|---|---|
| `infusionDrugs` | IV / Inotrope Infusion, Reference |
| `demoDrugRules` | Renal Dose Adjustment, Reference |
| `fractionalExcretionTypes` | Fractional Excretion |

### Rules
- Do not duplicate clinical values across multiple objects
- Prefer one shared source object read by both the calculator and Reference
- All new medical data must include maintenance metadata:

```js
{
  category: "",           // e.g. "inotrope", "antibiotic"
  usedByTool: "",         // which calculator reads this
  sourceName: "",         // guideline or textbook name
  sourceLink: "",         // URL or citation placeholder
  lastReviewed: "",       // ISO date or "unreviewed"
  updateStatus: "",       // "current" | "needs review" | "draft"
  localProtocolNotes: ""  // institution-specific notes
}
```

---

## Feature Specifications

### Creatinine Clearance
- Formula: Cockcroft-Gault
- Stores age, sex, weight, creatinine to session on change
- Result renders automatically — no button

### IV / Inotrope Infusion
- Drug presets + custom concentration (drug amount ÷ final volume)
- Dose rate ↔ infusion rate linked bidirectionally
- Unit conversion supported both directions
- Warning thresholds:
  - 🔴 Red — exceeds central line limit
  - 🟡 Yellow — exceeds peripheral line limit
- Output area is informational display, not a required result box

### Renal Dose Adjustment
- Search: prefix-based, left-to-right
- Search list visible only while typing
- Arrow keys navigate list; Enter selects
- Can accept known CrCl or calculate inline
- **Status: Down — data is demo-only. Do not change to Ready until user confirms data is verified.**

### Fractional Excretion
- Single calculator handles: FENa, FEUrea, FEK, FEMg, FEP, FECa
- Labels update dynamically based on selected electrolyte
- Unit selectors kept compact

### Reference Page
- Goal: master maintenance view for all calculator source data
- Must cover: infusion drugs, renal-dose drugs, future antibiotics, FE references, local protocol citations
- Search: update list/content area only on keystroke — do not re-render full page
- No cursor jump or blink during search

### Info Menu
- Top-right corner
- Closes on outside click/tap
- Contact fields: GitHub and Email (currently `N/A`)
- Contains an **Install** section ("Add to Home Screen" button) that is shown only when the guide is eligible (iOS Safari + not already installed); opens the install bottom sheet

### iOS "Add to Home Screen" install guide
- Shown only on iOS Safari when not already installed as a standalone app (`isIosSafari() && !isStandalone()`)
- A dismissible bottom banner and a persistent ⋯-menu "Add to Home Screen" entry both open a shared modal bottom sheet
- Dismissal persisted in `localStorage` key `nightcalc.a2hs.v1`; the menu entry remains available even after the banner is dismissed
- Steps follow current iOS 26 Safari: ••• → Share → Add to Home Screen → keep "Open as Web App" on → Add
- Composes with all themes, accents, and the Pixel skin (square corners, thick borders in pixel mode)

### Theme
- Light/dark default: system preference; user override saved to `localStorage` (`nightcalc.theme.v1`)
- Button icon: sun (light) / moon (dark)
- Install guide banner dismissal saved to `localStorage` (`nightcalc.a2hs.v1`)
- **Brand accent** is selectable (blue default, maroon) from the Info menu; saved to `localStorage` (`nightcalc.accent.v1`), applied via `data-accent` on `<html>`
  - Add a new accent: append it to `ACCENTS` in `app.js`, add a swatch button in `index.html`, and add a `:root[data-accent="..."]` (+ dark) block in `styles.css`
  - The inline header logo is the brand's **tile-less** themeable mark; the keycaps follow `--nc-accent: var(--accent)` (recolors with the accent) and the moon uses `--nc-moon`, which flips with the theme (dark on the light topbar, light on the dark topbar) so the mark reads without a tile. The browser-tab `favicon.svg` and iOS `apple-touch-icon.png` are separate static assets in `icons/` (page CSS variables don't reach them, so their colors are baked in)
  - **Alert-red rule (binding):** the accent colors chrome only (logo, headers, buttons, links) — never a clinical result or warning value. Warnings keep their own red/amber. See `brand/BRAND.md`

---

## Never Do

- Do not add npm, yarn, bundlers, or any build step
- Do not use ES module imports (`import`/`export`) — keep everything in `app.js`
- Do not add a backend, API calls, or server-side logic
- Do not store or suggest storing patient identifiers anywhere
- Do not remove demo/draft warnings from any drug calculator without explicit user confirmation that data is verified
- Do not split `app.js` into multiple files unless the user explicitly requests it
- Do not add decorative UI — keep it clinical and dense

---

## Testing Checklist

After any frontend change:

```
1. python -m http.server 4173 --bind 127.0.0.1
2. Open http://127.0.0.1:4173/
3. DevTools console → zero errors baseline
4. Test at ~390px width (iPhone)
5. Test at ~1280px width (desktop)
6. If cached assets changed → verify version bump in index.html + service-worker.js
```

---

## Development Rules

- Dependency-free unless user explicitly chooses otherwise
- Preserve iPhone usability at all times
- Use concise, clinical wording throughout
- Do not add clinical claims unless data is supplied or verified by user
- Keep all drug data visibly marked draft/demo until user confirms verification
- Wrap all draft/demo placeholder data with `[draft]...[/d]` so unverified content is quickly identifiable
- When adding new medical data, always include reference placeholders and review metadata
- When changing cached assets, always update both version locations (see Versioning Rule)

---

## Safety Notes

This app is not a medical device, prescribing system, or replacement for clinical judgment.

- Keep safety disclaimers visible wherever calculator outputs could influence treatment decisions
- Do not remove draft/demo warnings until user explicitly confirms data has been verified against accepted clinical references or local institutional protocol
- Never present unverified dosing data without a visible warning
