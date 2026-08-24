# FlowFindr Fitness

A hypertrophy tracker built for one-handed use in a gym. Guided sessions, slider entry,
automatic rest timers, weekly volume tracking, and calendar export.

Dark cyberpunk interface, Tailwind v4 semantic tokens, local-first storage.

## Why it is built this way

- **Local-first.** Training data and custom sessions live on the device that logged them,
  via a small storage adapter in `src/App.jsx`. Anyone can open the public URL and start
  logging immediately with no sign-up. Accounts are being added on top of this rather than
  in front of it: the device stays the source of truth, and the cloud is a mirror that
  catches up when there is signal. Gyms eat reception, so nothing a user taps is ever
  allowed to wait on a network round trip.
- **Tailwind v4, mid-migration.** Styling is moving from inline styles to Tailwind
  utilities, one component per PR, with the app working throughout. Converted so far:
  `Panel`, `Action`, `Label`, `Chip`. Still inline: `Gauge`, `Sheet`.
- **Colour is a role, never a hex.** Converted components take a semantic `role` string
  (`brand`, `live`, `hot`, `mute`) that maps to token classes such as `text-brand` or
  `border-hot/40`, through static lookup objects. The lookups spell out every class in
  full: Tailwind scans source text, so a name built as `` `text-${role}` `` would never
  be generated.
- **Themes swap at runtime.** `THEMES` at the top of `src/App.jsx` drives the picker's
  labels, and `src/index.css` mirrors the same hex values as `[data-theme]` blocks
  feeding an `@theme inline` token layer. A palette has to be added in both places.
  A new `THEMES` entry on its own will appear in the picker but render with the default
  palette in every converted component.
- **Almost one file.** The programme, the UI, and the storage layer live in
  `src/App.jsx` so they can be read top to bottom. Two pieces sit outside it:
  `src/StrengthChart.jsx`, lazy-loaded to keep Recharts out of the initial bundle,
  and `src/Landing.jsx`, the marketing page, which is a second Vite entry with its
  own bundle so it costs the app nothing.

## Run it locally

Requires Node 20.19 or newer, or 22.12 or newer. That is Vite 7's `engines` range,
and the build fails on Node 18.

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
index.html                  app entry: meta tags, theme colour, manifest link
landing.html                landing page entry: marketing meta tags, Open Graph
public/manifest.webmanifest installable app config
public/icon.svg             barbell mark
src/main.jsx                React entry for the app
src/index.css               Tailwind import, semantic token layer, the three palettes,
                            reset, focus rings, reduced-motion, slider hit targets
src/StrengthChart.jsx       Recharts strength trend, lazy-loaded by the Progress tab
src/landing-main.jsx        React entry for the landing page
src/Landing.jsx             landing page, inline styles, no Tailwind
src/landing.css             landing page reset and its one breakpoint
src/theme.js                palette copy the landing page reads, mirrors THEMES
src/App.jsx                 everything else
```

### Where things are in `src/App.jsx`

| Section | What it controls |
| --- | --- |
| `THEMES` | Three palettes. Each defines `brand` (identity, completed sets, primary action), `live` (current set, rest timer, live data) and `hot` (failure sets and personal records). Roles never change meaning between themes. The same hex values are mirrored in `src/index.css` as `[data-theme]` blocks, which is what the converted components read. |
| `store` | Storage adapter. Every byte the app persists goes through here, which is why adding sync touches so little else. Reads stay local; the cloud mirror is layered on top rather than replacing it. |
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

## Where this is going

The app is moving from a single-user tool to a small product. Three stages:

1. **Now.** One user, no accounts, everything in `localStorage`.
2. **Private beta, from around September 2026.** About a dozen friends, each with their
   own account and their own synced history.
3. **Public launch, targeted late October 2026.** Open self-serve sign-up, with enough
   commercial groundwork that a paid tier later is a config change, not a migration.

Two commitments shape every decision below. **The app works before you have an account**,
so sign-up is offered once someone has data worth keeping rather than as a wall in front
of the first session. And **nothing is manual for the admin**: no hand-created accounts,
no manual password resets.

## Adding accounts and sync

An earlier version of this README said to replace `store.get` and `store.set` with
Supabase queries. Do not. That version of the app breaks in a gym basement, where the
network is worst and logging a set matters most. Supabase goes *alongside* the storage
adapter, not in place of it.

**Provider.** Supabase: hosted Postgres with auth attached. It was picked over AWS
(Cognito plus DynamoDB or RDS plus API Gateway) because it is plain Postgres underneath,
so `pg_dump` moves the data to RDS or anywhere else without a rewrite. The AWS stack is
several times the setup for a solo developer and has no equivalent of Row Level Security,
meaning authorisation gets hand-written per endpoint. The lock-in that does exist lives in
the auth layer and the client SDK, and is contained by routing every query through
`src/data/` so no component imports `supabase` directly.

**Shape.** Three tables, mirroring the three storage keys:

| Table | Rows | Mirrors |
| --- | --- | --- |
| `profiles` | one per user | `fff:settings`, plus display name and plan |
| `workouts` | one per user per day | `fff:logs` |
| `plans` | one per user per customised template | `fff:custom` |

The `entries` and `settings` columns are `jsonb`, holding the same objects the app already
builds. On login the `logs` object is reassembled from `workouts` rows in the exact shape
`src/App.jsx` expects, so no existing read site changes.

Every table gets Row Level Security with both a `using` and a `with check` clause. The
anon key ships inside the JavaScript bundle by design; RLS is the only thing keeping one
person's training history away from another's.

**Sign-up.** Logged-out users stay on `localStorage` alone and create no database rows.
On successful sign-up, a one-time import pushes their existing local history into the new
account. Supabase anonymous sign-ins were considered and rejected: they write a real
`auth.users` row for every visitor, have no automatic cleanup, count toward monthly active
users, and need CAPTCHA to avoid abuse. The import gives the same experience without any
of it.

**Email.** A custom SMTP provider is required, not optional. Without one, Supabase Auth
refuses to deliver mail to any address outside the project team, so confirmation and
password-reset emails to friends silently never arrive. With custom SMTP configured the
default cap is 30 auth emails per hour, adjustable in the dashboard.

**Environment.** Two variables, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, in
`.env.local` locally and in the Vercel project for both Production and Preview. Vite bakes
these in at build time, so existing deployments do not pick up a change until they are
rebuilt. Anything prefixed `VITE_` is public by definition; the `service_role` key must
never go near it.

## Before making it public

- Data export and account deletion. Training data is personal data under the Australian
  Privacy Act and GDPR, and both are far cheaper to design in than to retrofit.
- A privacy policy and terms of use, linked from the landing page and the sign-up form.
- Daily backups, which is the actual reason to move off the free tier.
- Free Supabase projects pause after about a week of no traffic. Harmless during the beta,
  worth removing before launch.

Cost today is nothing: the free tier covers 50,000 monthly active users and 500 MB of
database, and a set is four numbers. The first real spend is Supabase Pro at 25 USD a
month, triggered by launch rather than by the size of the beta.

## Known trade-offs

- The initial JS bundle is about 66 kB gzipped. Recharts is another 106 kB gzipped, but
  it sits in a separate chunk that only loads when the Progress tab is opened.
- `src/index.css` carries a Preflight compatibility rule restoring `<p>` margins, inside
  `@layer base` so utilities still override it. It can go once every `<p>` carries an
  explicit margin.
- Weight sliders top out at 260. Raise the `max` on the weight `Gauge` in `Session` if you
  outgrow it.
- Estimated 1RM uses the Epley formula, which drifts above roughly 12 reps. Treat it as a
  trend line, not a true max.
