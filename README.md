# FlowFindr Fitness

A hypertrophy tracker built for one-handed use in a gym. Guided sessions, slider entry,
automatic rest timers, weekly volume tracking, and calendar export.

Dark cyberpunk interface, no build-time CSS framework, no backend.

## Why it is built this way

- **No backend.** Training data and custom sessions live on the device that logged them,
  via a small storage adapter in `src/App.jsx`. Anyone can open the public URL and start logging immediately
  with no sign-up, and nobody sees anyone else's data.
- **Inline styles, no Tailwind.** The whole visual system is the `THEMES` object at the top
  of `src/App.jsx`. Add a fourth entry and it shows up in the theme picker automatically.
- **One file.** All components live in `src/App.jsx` so the programme, the UI, and the
  storage layer can be read top to bottom.

## Run it locally

Requires Node 18 or newer.

```bash
npm install
npm run dev
```

Open the printed URL. To test on your phone on the same wifi, run `npm run dev -- --host`
and use the network URL.

## Deploy to Vercel

**Option A, from the dashboard.** Push this folder to a GitHub repo, then at
vercel.com/new import the repo. Vercel detects Vite automatically. Framework preset Vite,
build command `npm run build`, output directory `dist`. Deploy.

**Option B, from the terminal.**

```bash
npm i -g vercel
vercel        # preview deployment
vercel --prod # production
```

Once live, open the URL on Android and use Chrome's menu → Add to Home screen. The
manifest makes it launch full screen with no browser chrome.

## Project layout

```
index.html                  meta tags, theme colour, manifest link
public/manifest.webmanifest installable app config
public/icon.svg             barbell mark
src/main.jsx                React entry
src/index.css               reset, focus rings, reduced-motion, slider hit targets
src/App.jsx                 everything else
```

### Where things are in `src/App.jsx`

| Section | What it controls |
| --- | --- |
| `THEMES` | Three palettes. Each defines `brand` (identity, completed sets, primary action), `live` (current set, rest timer, live data) and `hot` (failure sets and personal records). Roles never change meaning between themes. |
| `store` | Storage adapter. Swap these two functions for Supabase later. |
| `EX` | Exercise library, about 55 movements: name, muscle, equipment, coaching cue. |
| `PROGRAMS` | Default 3, 4, and 5 day splits. Each entry is `S(exerciseId, sets, minReps, maxReps, restSeconds)`. User edits are stored separately under `fff:custom` and override these per session. |
| `Builder` | The Set up screen: swap, reorder, add, remove, and tune sets, reps and rest. |
| `Picker` | Exercise chooser, grouped by muscle with the current muscle group first. |
| `RUN_DAY` | Which weekday the 5k lands on, kept away from leg day. |
| `Session` | The guided runner: last-session reference, sliders, RIR chips, tap-to-edit set ledger, rest timer. |
| `Train` / `ProgressTab` / `ProgramTab` | The three tabs. |
| `buildICS` / `gcalLink` | Calendar export. |

## Storage keys

| Key | Holds |
| --- | --- |
| `fff:settings` | Days per week, start time, sauna and walk minutes, theme. |
| `fff:logs` | Every completed session, keyed by date. |
| `fff:custom` | Per-session exercise lists built in the Set up screen. Deleting a key restores that session's default. |

## Editing the programme

Add an exercise to `EX`, then reference its key in `PROGRAMS`. Example:

```js
"pendlay-row": {
  name: "Pendlay row",
  muscle: "Back",
  equip: "Barbell",
  cue: "Bar resets on the floor every rep. No hip drive.",
  alts: ["Chest-supported row", "T-bar row", "Seated cable row"],
},
```

```js
S("pendlay-row", 4, 6, 10, 180)   // 4 sets of 6 to 10, 3 min rest
```

## Adding accounts and sync later

Only the `store` object needs to change. Create a Supabase project, add a `logs` table
keyed by user id, then replace `store.get` and `store.set` with Supabase queries and wrap
the app in an auth check. Nothing else in the file touches persistence.

## Known trade-offs

- The initial JS bundle is about 163 kB gzipped, most of it Recharts. Fine on mobile, but
  if it matters, move `Stats` into its own file and `React.lazy` it so charts only load
  when the Stats tab is opened.
- Weight sliders top out at 260. Raise the `max` on the weight `Gauge` in `Session` if you
  outgrow it.
- Estimated 1RM uses the Epley formula, which drifts above roughly 12 reps. Treat it as a
  trend line, not a true max.
