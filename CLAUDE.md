# FlowFindr Fitness

A hypertrophy training tracker built for one-handed use mid-workout. Currently a
personal app shared publicly as a demo. Heading for a small private beta and then a
public launch.

## Product direction

The app is becoming a multi-user product. Three stages, in order:

1. **Now.** Single user, `localStorage` only for anyone who has not signed in.
   The account layer exists in the repo — schema, data access layer, login screen,
   background sync — and is wired up behind the account button. Nobody has been
   invited yet.
2. **Private beta, from roughly September 2026.** About a dozen friends, each with
   their own account and their own synced history.
3. **Public launch, targeted late October 2026.** Open self-serve sign-up, and the
   commercial groundwork in place so a paid tier does not need a schema migration.

Two product commitments follow from this, and both constrain how features get built:

- **The app works before you have an account.** Anyone can open the URL and start
  logging immediately, exactly as today. Sign-up is offered once someone has data
  worth keeping, and signing up carries their existing local history into the new
  account. Never gate the training flow behind a login wall.
- **Nothing is manual for the admin.** No hand-created accounts, no manual password
  resets, no admin-only steps in normal operation. If a feature needs an operator
  in the loop, it is not finished.

## Architecture

- React 18, Vite build, deployed to Vercel from GitHub. Two entries: the app at
  `index.html` -> `src/App.jsx`, and the marketing landing page at `landing.html` ->
  `src/Landing.jsx`. The landing page is a separate bundle on inline styles, no
  Tailwind, and `src/index.css` excludes it with `@source not`.
- There is a backend now, and it is a mirror rather than the source of truth. Every
  read and write still goes through the `localStorage` `store` adapter in
  `src/App.jsx`; Supabase sits alongside it and catches up in the background. See
  Backend.
- Styling is mid-migration from inline styles to Tailwind v4. Strangler pattern:
  one component per PR, the app stays working throughout.
- Semantic colour tokens live in `src/index.css` via `@theme inline`. Palettes swap
  at runtime through a `data-theme` attribute on the root wrapper, driven by the
  existing theme picker.
- `@theme inline` is deliberate. Plain `@theme` resolves the variables once at
  `:root`, which freezes the palette and breaks runtime switching.

## Backend

Supabase (hosted Postgres plus auth). Org `Flowfindr`, project `FlowFindr-Fitness`,
ref `qnnqnyptmhznlfiszvtn`, region `ap-southeast-2` (Sydney). Region is fixed at
creation, so the earlier Tokyo and Singapore projects were replaced rather than moved.
Chosen over AWS because it is plain Postgres underneath:
`pg_dump` moves the data to RDS or anywhere else without a rewrite, so the choice is
reversible. The lock-in that does exist sits in the auth layer and the client SDK,
which is what the data access layer below is for.

**Local-first, not cloud-first.** `localStorage` stays the source of truth for reads
and writes. Supabase is a background mirror that catches up when there is signal.
The app is used in a gym basement on patchy reception, so no user action may ever
block on a network round trip. This supersedes the older note in `README.md` that
said to replace the `store` functions with Supabase queries.

**Sign-up is local-until-registered, not anonymous auth.** Logged-out users stay on
`localStorage` alone and create no rows at all. On successful sign-up, a one-time
import pushes their local history into the new account. Supabase anonymous sign-ins
were considered and rejected: they write a real `auth.users` row per visitor, have no
automatic cleanup, count toward MAU, and need CAPTCHA to avoid abuse. The import path
gives the same experience with none of that.

**Custom SMTP is mandatory, not an optimisation.** Without it Supabase Auth refuses
to deliver mail to anyone outside the project team, so confirmation and password
reset emails to friends silently never arrive. Resend is now configured and sends
from `flowfindr.com.au`, so the beta is no longer blocked on it. That moves the risk
rather than removing it: bounces now count against our own domain reputation, and
that domain also carries Google Workspace business mail. Read **Email and auth
testing** below before touching anything that sends mail. Setup steps are in
`README.md`; `scripts/auth-config.sh` reads and changes the settings through the
Management API.

Tables are `profiles`, `workouts` (one row per user per day), and `plans` (one row
per user per customised template). The `jsonb` columns hold the same objects the app
already builds, so `logs` can be rebuilt on login in the exact shape `src/App.jsx`
expects and no read site changes.

Schema lives in `supabase/migrations/`: `0001_accounts.sql` creates the three tables
with RLS, and `0002_lock_down_trigger_functions.sql` revokes `execute` on the trigger
helpers, which were otherwise reachable as `/rest/v1/rpc/` endpoints. Postgres fires
triggers without checking `execute` on the caller, so the revoke closes the endpoint
and leaves the triggers working. `src/data/` holds the access layer: `client.js`
(null when the env vars are absent), `auth.js`, `sync.js` (the write queue), and
`index.js`, the only module the app may import from.

**The app is wired to it, lazily.** `src/Login.jsx` is the one component that imports
`src/data/` at the top level, and `src/App.jsx` reaches it only through dynamic
`import("./data")` — once to subscribe to auth changes, and once per local write to
mirror the change into the queue. `Login` itself is `lazy()`, so a logged-out user who
never opens the account sheet downloads neither the login screen nor the Supabase SDK.
Keep it that way: a static `import` of `src/data/` from `src/App.jsx` drags the SDK
into the initial bundle for everyone.

## Email and auth testing

Supabase previously flagged this project for a high bounce rate on its built-in
email provider. That provider only delivers to Supabase org team members, so every
external signup bounced by definition. Custom SMTP now runs through Resend on
`flowfindr.com.au`.

The consequence has moved, not disappeared. Bounces now count against our own
domain reputation, and that domain also carries Google Workspace business mail. A
suspension would take down real correspondence, not just app signups.

- NEVER send auth email to a fabricated address. `test@test.com`, `foo@example.com`
  and `a@a.com` hard bounce every time and are the single largest source of the
  original problem.
- NEVER run signup, password reset, or magic link flows against the hosted Supabase
  project during local development. Run `supabase start` and read the mail in
  Mailpit at `http://localhost:54324`, which sends nothing externally and accepts
  any address.
- When a test genuinely needs the hosted project, use Gmail plus-addressing
  (`gus+ff1@gmail.com`, `gus+ff2@gmail.com`). Real deliverable addresses, one
  inbox, unlimited variants.
- Delete test users from Auth > Users after each run. Leaving them behind means
  repeat flows keep hitting stale addresses.
- NEVER enable click tracking in Resend. It rewrites links, and mail scanners
  following a rewritten link consume the single-use token before the user clicks.
  The user then sees "token expired".
- Ask before changing SMTP settings, Supabase auth rate limits, Resend domain
  configuration, or any DNS record on `flowfindr.com.au`.

### Budgets

- Resend free tier: 100 emails per day, 3000 per month. Sending pauses at the daily
  cap, which means auth email stops until the window resets.
- Supabase auth rate limit is set above the 30/hour default but must stay under the
  Resend daily cap in aggregate.
- Keep bounce rate under 2% and complaint rate under 0.1%. Resend runs on Amazon
  SES, which opens a review around 5% bounce and suspends near 10%.

### Config reference

| Setting | Value |
| --- | --- |
| SMTP host | `smtp.resend.com` |
| SMTP port | `587` |
| SMTP username | `resend` (literal, not an email address) |
| SMTP password | Resend API key, sending-only, scoped to the domain |
| Sender | `no-reply@flowfindr.com.au` |
| Resend region | Tokyo (`ap-northeast-1`), fixed at domain creation |
| Sending domain | `flowfindr.com.au`, DKIM at `resend._domainkey`, SPF at `send` |

DNS note: `dc-fd741b8612._spfm.send` looks like junk but is the include target of
the `send` SPF record. Deleting it breaks Resend SPF.

### Reading an SMTP failure

Both signatures below were observed on 24 Aug 2026. The HTTP response is useless for
diagnosis -- it only ever says `Error sending confirmation email` -- so read
`auth_logs` instead.

| In `auth_logs` | HTTP | Means |
| --- | --- | --- |
| `535 "Invalid username"` | 500 | SMTP auth rejected. The username is not the sender address and not the account email; it is the literal string `resend`. |
| `context deadline exceeded`, `request_timeout`, duration exactly 10s | 504 | TCP connects but the TLS handshake never completes, so port and TLS mode disagree. 465 is implicit TLS; 587 and 2587 are STARTTLS. Use 587. |

Query it with:

```sql
select timestamp, event_message from logs
where source = 'auth_logs' and event_message ilike '%error%'
order by timestamp desc limit 10
```

A failed send rolls the signup back, so `auth.users` stays clean and the same address
can be reused on the next attempt. Confirm with
`select id, email from auth.users order by created_at` rather than assuming.

To check whether custom SMTP is live at all, look for the rate limit line at the last
config reload: `Email limiter from 2/1h to 30` means Supabase accepted a custom SMTP
config. Built-in sends log `mail_from: noreply@mail.app.supabase.io`; a send through
Resend logs the configured sender instead.

### Verification after any auth email change

- Send to a real address you control, then check Resend Logs shows Delivered rather
  than Bounced.
- In Gmail, use Show original and confirm SPF: PASS and DKIM: PASS with
  `flowfindr.com.au` as the signing domain.
- Confirm the confirmation link resolves to the intended environment. Preview
  deployments need their URL pattern present in Supabase URL Configuration or the
  link dead-ends.
- Report these as raw output, not as a summary.

## Migration status

Converted to Tailwind: `Panel`, `Action`, `Label`, `Chip`.
Still on inline styles: `Gauge`, `Sheet`.

`Panel`, `Action` and `Label` still accept a `t` prop they no longer use. Drop those
together in a single cleanup PR once enough components are converted, rather than
churning call sites twice. `Chip` never took one.

`Label` carries a fifth role, `text`, on top of the three fixed role names, because
one call site prints the date in the primary text colour.

`src/Login.jsx` is not part of the migration. It was built on token classes from the
start, so there is no inline-style version of it to convert.

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

Backend rules:

- NEVER import `supabase` directly in `src/App.jsx` or any component. All data access
  goes through `src/data/`, so the provider stays swappable and the lock-in stays in
  one folder.
- NEVER create a table without Row Level Security enabled and a policy carrying both
  `using` and `with check`. The anon key ships in the bundle; RLS is the only thing
  separating one user's training history from another's.
- NEVER put a secret in a `VITE_` variable. Anything prefixed `VITE_` is compiled
  into the browser bundle. The publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY`)
  belongs there. The `service_role` key and any Supabase personal access token must
  never appear in the repo, in Vercel, or in a chat window.
- `.env` is tracked in git **on purpose** and this is not a leak. It holds only
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, both of which ship inside
  the browser bundle anyway, and committing them stops Preview and Production
  drifting apart while letting a fresh clone build. Row Level Security, not key
  secrecy, is what separates one user's history from another's. Do not raise this as
  a security finding, and do not "fix" it by gitignoring the file. Genuine secrets
  live in `.env.local`, which `*.local` already excludes. If auditing, check that
  `.env` still contains only those two `VITE_` keys rather than assuming the worst
  from the filename.
- NEVER let a write block the UI on the network. Write local, queue, flush in the
  background.
- Every user-owned table carries `user_id` and `updated_at` from the start, even when
  nothing reads them yet. Backfilling them later means a migration on live data.

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
  The login screen avoided becoming a fourth copy: it uses token classes, which
  resolve against the `data-theme` attribute already on the app's root wrapper, and
  imports `MONO` from `src/theme.js` rather than retyping it. Do the same for any
  new surface.
- One workout per user per day. The `unique (user_id, date)` constraint mirrors what
  the app already does, since `logs[todayKey]` overwrites. Someone training twice in
  a day loses the first session. Not a regression, but now it is written down.
- Supabase free projects pause after about a week of no traffic. Fine during beta,
  a real risk at launch. The sync layer must treat a failed request as "carry on
  locally", never as an error the user sees.
- Cost today is nothing. The free tier covers 50,000 monthly active users and 500 MB.
  The first real spend is Supabase Pro at 25 USD a month, and the trigger for it is
  public launch, for backups and no auto-pause, not the size of the beta.

## Before public launch

Non-negotiable, and all cheaper to build now than to retrofit:

- Data export and account deletion. Training and body data is personal data under
  the Australian Privacy Act and GDPR. A user must be able to get their data out and
  have their account erased without emailing anyone.
- A privacy policy and terms of use, linked from the landing page and the sign-up
  form.
- `profiles` carries a `plan` column from day one, defaulting to `free`, so adding a
  paid tier is a value change and not a migration on live user data.
- Daily backups. This is what the Supabase Pro plan is actually being bought for.
- One friend's account tested end to end on a real phone: sign up, confirm email,
  log a session, sign out, sign in on a second device, see the history.

## Context that does not live in the code

The app is used in a gym, on a Samsung S26 Ultra, one-handed, with sweaty hands and
fluorescent lighting. It is dark-only. Contrast decisions that look correct on a
laptop regularly fail in that environment, and no build check catches it. Every
merge is preceded by a manual check on the phone.
