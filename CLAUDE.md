# FlowFindr Fitness

A hypertrophy training tracker built for one-handed use mid-workout. Personal app,
also shared publicly as a demo.

## Architecture

- React 18, Vite build, deployed to Vercel from GitHub. Two entries: the app at
  `index.html` -> `src/App.jsx`, and the marketing landing page at `landing.html` ->
  `src/Landing.jsx`. The landing page is a separate bundle on inline styles, no
  Tailwind, and `src/index.css` excludes it with `@source not`.
- No backend. All persistence is `localStorage`.
- Styling is mid-migration from inline styles to Tailwind v4. Strangler pattern:
  one component per PR, the app stays working throughout.
- Semantic colour tokens live in `src/index.css` via `@theme inline`. Palettes swap
  at runtime through a `data-theme` attribute on the root wrapper, driven by the
  existing theme picker.
- `@theme inline` is deliberate. Plain `@theme` resolves the variables once at
  `:root`, which freezes the palette and breaks runtime switching.

## Migration status

Converted to Tailwind: `Panel`, `Action`, `Label`, `Chip`.
Still on inline styles: `Gauge`, `Sheet`.

`Panel`, `Action` and `Label` still accept a `t` prop they no longer use. Drop those
together in a single cleanup PR once enough components are converted, rather than
churning call sites twice. `Chip` never took one.

`Label` carries a fifth role, `text`, on top of the three fixed role names, because
one call site prints the date in the primary text colour.

## Token roles

Nine tokens, usable as `bg-*`, `text-*`, `border-*`:

`brand` `live` `hot` `surface` `void` `panel2` `line` `text` `mute`

The three role names carry fixed meaning and must never be reassigned:

- `brand` — identity, completed sets, primary action
- `live` — current set, rest timer, live data
- `hot` — failure sets, personal records

Themes: `ultraviolet-circuit` (default), `nightdrive`, `cyan-prime`.

## Rules

- NEVER use raw Tailwind colour utilities (`bg-purple-500`, `text-cyan-400`).
  Semantic token names only.
- NEVER build class names dynamically. Use static lookup objects where every full
  class string appears literally in the source. Tailwind scans source text and
  cannot see a template literal.
- NEVER touch the accessibility CSS in `src/index.css`: `focus-visible` rules,
  `prefers-reduced-motion` rules, 44px hit targets.
- NEVER change app logic, state shape, exercise data, split definitions, or
  `localStorage` keys as part of a styling change.
- NEVER alter a hex value during conversion. Colours must render identically
  before and after.
- Components take colour as a semantic `role` string, not a hex value. Conditionals
  switch strings: `editing !== null ? "live" : "brand"`.
- Convert one component per PR. Do not widen scope because an adjacent component
  looks easy.
- Only make changes directly requested. Do not add features, abstractions, config
  files, or refactor beyond what was asked.

## Verification

- Always run `npm run build` before proposing a commit.
- Report verification as raw command output, not as a summary. If asked to check
  something, paste what the command printed.
- Flag any visual change outside the component being converted, however small.

## Workflow

- Branch per PR. Never commit to `main` — Vercel deploys `main` to production.
- Branch naming: `design/<what>` for styling work, `feat/<what>` for features.
- Ask before: installing any package, deleting any file, committing, pushing,
  changing git config, or touching Vercel settings.

## Known trade-offs

- `src/index.css` carries a Preflight compatibility rule restoring `<p>` margins,
  inside `@layer base` so utilities still override it. Remove it once all `<p>`
  elements carry explicit margins.
- Estimated 1RM uses Epley, which drifts above roughly 12 reps. Trend line, not a
  true max.
- Recharts is lazy-loaded so it only costs bundle size when the Progress tab opens.
- The palette exists in three places: `THEMES` in `src/App.jsx`, the `[data-theme]`
  blocks in `src/index.css`, and `THEMES` in `src/theme.js` for the landing page.
  Change a hex in one and the others diverge silently. No build check catches it.

## Context that does not live in the code

The app is used in a gym, on a Samsung S26 Ultra, one-handed, with sweaty hands and
fluorescent lighting. It is dark-only. Contrast decisions that look correct on a
laptop regularly fail in that environment, and no build check catches it. Every
merge is preceded by a manual check on the phone.
