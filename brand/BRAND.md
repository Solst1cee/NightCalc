# NightCalc — Brand Sheet

The mark: a calculator keypad at night. Three operator keys (+ − ×) and a moon
sitting where the fourth key (=) would be — the answer. The + doubles quietly
as a medical cross.

## Two accent variants

| Token | Maroon kit | Blue kit |
|---|---|---|
| `--nc-accent` | `#B92D5D` | `#2563EB` |
| `--nc-bg` (dark) | `#0B1220` | `#0B1220` |
| `--nc-tile` (dark) | `#101A30` | `#101A30` |
| `--nc-moon` (dark) | `#F1F5F9` | `#F1F5F9` |
| `--nc-tile` (light) | `#FFFFFF` | `#FFFFFF` |
| `--nc-moon` (light) | `#0F172A` | `#0F172A` |

Dark mode is the primary identity. Light variants are for README/docs surfaces.

## The alert-red rule (binding for the maroon kit)

Color in a clinical tool carries meaning. To keep brand and warnings from
colliding:

1. **Brand accent** (`#B92D5D` or `#2563EB`) is used ONLY for chrome:
   icon, headers, primary buttons, links, selected states.
   It must never color a result value.
2. **Alert red `#DC2626`** is used ONLY for abnormal / critical values
   and warnings. Never decoratively.
3. Optional tiers: amber `#D97706` for borderline values; neutral text
   for normal. These also never decorate.
4. Color is never the only signal for an abnormal value — always pair
   with bold weight, an icon, or a label (covers color-vision deficiency
   and the maroon-vs-red edge case).

The blue kit sidesteps rule 1's risk by hue, but the rule still applies:
one color, one meaning.

## Files (per kit)

- `icon-dark.svg` — primary app icon (dark tile)
- `icon-light.svg` — light-surface icon (hairline border)
- `favicon.svg` — same as dark icon; reads on both browser themes
- `lockup-dark.svg` / `lockup-light.svg` — icon + wordmark

## Usage notes

- Minimum icon size: 16 px. The mark was scale-tested at 24 px; below
  that, prefer showing the moon + one key only if you ever need smaller.
- The wordmark splits as Night (moon color) + Calc (accent).
- Keep clear space around the lockup of at least the moon's diameter.
- Do not add gradients, shadows, or outlines to the mark.


## Custom theming (future-proofing)

The kit has two layers:

1. **Static SVGs** (`maroon/`, `blue/`) — self-contained, hardcoded colors.
   Use these where CSS cannot reach: `favicon`, app-store icons, README
   images, social cards. Browsers do not pass page CSS variables into
   `<img>`-loaded or favicon SVGs, so these must stay hardcoded.

2. **Themeable SVGs** (`themeable/logo.svg`, `themeable/lockup.svg`) —
   every color is `var(--nc-*, fallback)`. **Inline** these into your HTML
   (paste the SVG markup or fetch-and-inject); they then follow `theme.css`
   live. A user-picked theme color becomes one line:

   ```js
   document.documentElement.style.setProperty('--nc-accent', userColor);
   ```

   The logo, buttons, and headers all recolor instantly, no asset edits.

3. **`theme.css`** — the single source of truth for tokens. Preset themes
   are `data-theme="blue"` and `data-mode="light"` attributes on `<html>`;
   adding a theme is one block. The semantic colors `--nc-alert` and
   `--nc-warn` are reserved and must never be themed (alert-red rule).

4. **`tools/palette-studio.html`** — the interactive picker used to choose
   these colors; keep it in the repo as the design playground for future
   theme candidates.

Practical wiring order in the app: link `theme.css`, inline
`themeable/logo.svg` in the header, point the favicon at
`maroon/favicon.svg` (or `blue/`), done.
