# NightCalc — Memory

Update this file at the end of every session. This is the living record of project state.

---

## Last Session

- Date: 2026-06-10
- What was done: **Tile-less logo pass** (follow-up to the rebrand — the tiled header badge read "off"). Swapped the top-bar mark for the tile-less version (`brand/themeable/logo-notile.svg`) inlined in `index.html`; the moon crescent is now cut with an SVG `mask` instead of a tile-colored overlap. Made `--nc-moon` theme-adaptive — dark `#0F172A` on the light topbar, light `#F1F5F9` on the dark topbar — so the mark reads with no tile behind it; key glyphs stay light (they sit on the accent squares). Replaced `icons/favicon.svg` with a tile-less, `prefers-color-scheme`-aware version. Added the iOS home-screen icon: `icons/apple-touch-icon.png` (180×180, full-bleed navy tile — iOS ignores SVG here and composites transparency on black) with `icons/apple-touch-icon.svg` as the design source and an `apple-touch-icon` link. Removed the now-unused `--nc-tile` token. Verified both themes × both accents (mask renders a clean crescent; moon legible on white and navy; app.js error-free). Bumped `?v=58` / `nightcalc-v58`.
- Files changed: `index.html`, `styles.css`, `service-worker.js`, `icons/favicon.svg`, `icons/apple-touch-icon.png` (new), `icons/apple-touch-icon.svg` (new), `brand/themeable/logo-notile.svg` (added), `AGENTS.md`, `MEMORY.md`
- Note: `manifest.webmanifest` PWA icon is still the tiled `icons/icon.svg` (correct for Android maskable contexts) — only the iOS home-screen icon was added this pass.

### Earlier same day — MedCalc → NightCalc rebrand
- Integrated `nightcalc-brand-kit.zip` into `brand/`; inline themeable header logo + `Night`/`Calc` wordmark; night palette (`#0B1220`/`#101A30`); selectable accent (blue default, maroon) via `data-accent` + persistence and one-time migration of legacy `medcalc.*` storage keys; fixed the previously-missing `icons/icon.svg` (had been breaking the service-worker install); favicon + manifest + service worker (`nightcalc-v57`) + all docs.
- GitHub repo renamed MedCalc → NightCalc (remote URL → `Solst1cee/NightCalc`; docs URLs → `solst1cee.github.io/NightCalc`). Only the on-disk folder still uses `MedCalc` (left as-is).

---

## Current Version

Check `index.html` for current version string.
Last known: `v58` / `nightcalc-v58`

---

## Tool Status

| Tool | Status | Notes |
|---|---|---|
| Creatinine Clearance | ✅ Ready | Cockcroft-Gault, reusable session inputs |
| IV / Inotrope Infusion | ✅ Ready | Two-way dose/rate calc, draft drug data, warnings |
| Fractional Excretion | ✅ Ready | FENa, FEUrea, FEK, FEMg, FEP, FECa |
| Renal Dose Adjustment | 🔴 Down | Workflow ready, drug data is demo-only — do not promote to Ready without user confirmation |
| Reference | 🔨 In progress | Becoming master maintenance view for all calculator data |

---

## Current Focus

Reference page — build out as master data view covering all categories (infusion drugs, renal-dose drugs, future antibiotics, FE references, local protocol citations)

---

## Known Bugs

- None confirmed yet — add here as discovered

---

## Decisions Made

| Decision | Reason |
|---|---|
| No ES modules — everything stays in `app.js` | Simplicity, no build step |
| No framework | Intentional — static, dependency-free |
| `sessionStorage` only for clinical data | No permanent patient storage by design |
| Reference page becomes master data maintenance view | Single source of truth for all calculator data |
| Drug data stays marked demo until user explicitly verifies | Safety — not a medical device |
| Search updates list only, not full page re-render | Avoid cursor jump/blink UX bug |
| Rebranded to NightCalc; blue default accent, maroon selectable | Night-shift identity; blue is the lower-risk accent next to clinical red/amber warnings |
| Brand accent is chrome-only (never colors values) | Brand kit's binding "alert-red rule" — keep brand and warnings from colliding |

---

## Next Up

1. Complete Reference page as master data view
2. Add all data categories to Reference (not just infusion drugs)
3. Add verified drug data to Renal Dose Adjustment → promote status to Ready
4. Add antibiotic dosing category to data architecture

---

## Parking Lot

Ideas captured, not started:

- Antibiotic dosing calculator
- FE interpretation reference panel (normal ranges, clinical interpretation)
- Local protocol citation fields per drug
- Paediatric dosing support (flagged — significant scope addition)

---

## Data Verification Log

Track which drug/clinical data has been verified and by whom.

| Data Object | Item | Verified? | Source | Date |
|---|---|---|---|---|
| `infusionDrugs` | All entries | ❌ Demo | — | — |
| `demoDrugRules` | All entries | ❌ Demo | — | — |

**Do not remove demo warnings until entries in this table are marked verified.**
