/* ---------------- login ---------------- */
/* Ported from the Login.dc.html artboard in the "FlowFindr login mockup"
   Claude Design project. Three things changed on the way in:

   - The artboard carried its own copy of THEMES and interpolated hexes into
     inline styles. That copy is gone. Colour comes from the semantic tokens,
     which resolve against the data-theme attribute already on the app's root
     wrapper, so the theme picker drives this screen for free and there is no
     fourth palette to keep in sync.
   - The phone frame (min-height 812px, rounded corners, drop shadow) was
     mockup scaffolding. A real screen fills the viewport.
   - Three tap targets were under 44px. Fixed below, marked where.

   Buttons are local rather than the app's Action primitive: Action has no
   disabled state and borders its ghost variant with `mute` where this design
   uses `line`. Extracting the primitives into a shared module so both can use
   them is the right follow-up, but it is a refactor and not this change. */

import { useState } from "react";
import { MONO } from "./theme";
import { signIn, signUp, resetPassword, signOut, importLocal, flush } from "./data";

/* Every class string is written out in full. Tailwind scans source text and
   would never generate a name assembled from a template literal. */
const FIELD =
  "w-full box-border rounded-[3px] border border-line bg-surface " +
  "px-[13px] py-[15px] text-[15px] text-text placeholder:text-mute outline-none";

const BTN_BASE =
  "w-full flex items-center justify-center gap-2 cursor-pointer border rounded-[3px] " +
  "px-[18px] font-bold uppercase transition-[background,box-shadow] duration-[120ms] " +
  "ease-[ease] [-webkit-tap-highlight-color:transparent]";

/* py-[15px] with a 12px mono line clears 44px. */
const BTN_PRIMARY =
  "py-[15px] text-[12px] tracking-[0.18em] text-void bg-brand border-brand " +
  "shadow-[0_0_24px_color-mix(in_oklab,var(--ff-brand)_33.333%,transparent)]";

/* Was py-[14px] with an 11px line, about 41px. py-[16px] takes it to 45px. */
const BTN_GHOST =
  "py-[16px] text-[11px] tracking-[0.16em] text-mute bg-transparent border-line";

const BTN_OFF = " opacity-60 cursor-not-allowed";

const LABEL = "text-[10px] uppercase tracking-[0.24em]";

/* The artboard's `Forgot?` and mode-toggle links were bare 12px text, about
   12px of tap height. The padding here is cancelled by an equal negative
   margin, so the target grows to roughly 44px without moving the layout —
   the same trick the wordmark in App.jsx uses. */
const LINK_44 = "inline-block py-[15px] -my-[15px] no-underline";

const SWATCHES = [
  "bg-brand shadow-[0_0_8px_color-mix(in_oklab,var(--ff-brand)_53.333%,transparent)]",
  "bg-live shadow-[0_0_8px_color-mix(in_oklab,var(--ff-live)_53.333%,transparent)]",
  "bg-hot shadow-[0_0_8px_color-mix(in_oklab,var(--ff-hot)_53.333%,transparent)]",
];

const COPY = {
  signin: {
    mode: "Welcome back",
    headline: "Log the next set.",
    subhead: "Sign in to sync your programme, history and rest timers across devices.",
    cta: "Sign in",
    busy: "Signing in",
    prompt: "New here?",
    action: "Create one",
  },
  signup: {
    mode: "Create account",
    headline: "Start tracking.",
    subhead: "One account keeps your splits, logs and PRs with you on any phone.",
    cta: "Create account",
    busy: "Creating",
    prompt: "Already have an account?",
    action: "Sign in",
  },
  forgot: {
    mode: "Reset password",
    headline: "Send a reset link.",
    subhead: "We will email a link that signs you in so you can pick a new password.",
    cta: "Send reset link",
    busy: "Sending",
    prompt: "Remembered it?",
    action: "Sign in",
  },
};

function Mark() {
  return (
    <svg width="34" height="34" viewBox="0 0 512 512" aria-hidden="true">
      <g className="text-live" stroke="currentColor" strokeWidth="26" strokeLinecap="square" fill="none">
        <path d="M148 190v132" />
        <path d="M364 190v132" />
        <path d="M104 226v60" />
        <path d="M408 226v60" />
        <path d="M148 256h216" />
      </g>
      <path d="M148 256h216" className="text-hot" stroke="currentColor" strokeWidth="10" strokeLinecap="square" />
    </svg>
  );
}

/* onDismiss: continue without an account, or close. onSignedIn: a session now
   exists. local: the current localStorage state, pushed into a new account.
   account: the signed-in user, when there already is one. */
export default function Login({ onDismiss, onSignedIn, local, account }) {
  const [mode, setMode] = useState("signin");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const c = COPY[mode];
  const busy = status === "busy";

  const go = (next) => {
    setMode(next);
    setStatus("idle");
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setStatus("busy");

    if (mode === "forgot") {
      const { error: err } = await resetPassword(email.trim());
      if (err) { setError(err); setStatus("idle"); return; }
      setStatus("resetSent");
      return;
    }

    if (mode === "signup") {
      const { error: err } = await signUp(email.trim(), password, name.trim() || null);
      if (err) { setError(err); setStatus("idle"); return; }
      /* Queue the local history now. There is no session until the address is
         confirmed, so this drains on the first successful sign-in rather than
         here. The queue lives in localStorage and survives the wait. */
      await importLocal(local ?? {});
      setStatus("checkEmail");
      return;
    }

    const { user, error: err } = await signIn(email.trim(), password);
    if (err) { setError(err); setStatus("idle"); return; }
    flush();
    setStatus("idle");
    onSignedIn?.(user);
  };

  /* Already signed in, so there is nothing to sign in to. */
  if (account && status === "idle") {
    return (
      <Shell>
        <div className={LABEL + " text-live"} style={{ fontFamily: MONO }}>Signed in</div>
        <h1 className="text-[27px] font-extrabold tracking-[-0.03em] text-text m-0 mt-2 mb-2 leading-[1.12]">
          You are synced.
        </h1>
        <p className="text-[13px] text-mute leading-[1.55] m-0 mb-6">
          Logging in as <span className="text-text">{account.email}</span>. Sessions upload in
          the background, so nothing waits on reception.
        </p>
        <button type="button" onClick={onDismiss} className={BTN_BASE + " " + BTN_PRIMARY} style={{ fontFamily: MONO }}>
          Back to training
        </button>
        <div className="mt-[10px]">
          <button
            type="button"
            onClick={async () => { await signOut(); onDismiss?.(); }}
            className={BTN_BASE + " " + BTN_GHOST}
            style={{ fontFamily: MONO }}
          >Sign out</button>
        </div>
        <p className="text-[9px] text-mute tracking-[0.05em] leading-[1.7] m-0 mt-3 text-center" style={{ fontFamily: MONO }}>
          SIGNING OUT LEAVES THIS DEVICE'S HISTORY IN PLACE. IT STAYS USABLE OFFLINE.
        </p>
      </Shell>
    );
  }

  /* Terminal states: nothing more to type, so the form is replaced. */
  if (status === "checkEmail" || status === "resetSent") {
    const sent = status === "checkEmail";
    return (
      <Shell>
        <div className={LABEL + " text-brand"} style={{ fontFamily: MONO }}>
          {sent ? "Almost there" : "Link sent"}
        </div>
        <h1 className="text-[27px] font-extrabold tracking-[-0.03em] text-text m-0 mt-2 mb-2 leading-[1.12]">
          Check your email.
        </h1>
        <p className="text-[13px] text-mute leading-[1.55] m-0 mb-6">
          {sent
            ? "We sent a confirmation link to "
            : "We sent a password reset link to "}
          <span className="text-text">{email.trim()}</span>
          {sent
            ? ". Open it to finish setting up your account, then sign in. Your existing history is queued on this device and uploads the moment you do."
            : ". Open it to choose a new password."}
        </p>
        <button type="button" onClick={() => go("signin")} className={BTN_BASE + " " + BTN_PRIMARY} style={{ fontFamily: MONO }}>
          Back to sign in
        </button>
        <p className="text-[9px] text-mute tracking-[0.05em] leading-[1.7] m-0 mt-3 text-center" style={{ fontFamily: MONO }}>
          NOTHING ARRIVED? CHECK SPAM, OR TRY AGAIN IN A FEW MINUTES.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={LABEL + " text-brand mb-2"} style={{ fontFamily: MONO }}>{c.mode}</div>
      <h1 className="text-[27px] font-extrabold tracking-[-0.03em] text-text m-0 mb-2 leading-[1.12]">{c.headline}</h1>
      <p className="text-[13px] text-mute leading-[1.55] m-0 mb-[26px]">{c.subhead}</p>

      <form onSubmit={submit}>
        {mode === "signup" && (
          <div className="mb-[14px]">
            <div className={LABEL + " text-mute mb-[6px]"} style={{ fontFamily: MONO }}>Name</div>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              autoComplete="name" placeholder="What should we call you?" className={FIELD}
            />
          </div>
        )}

        <div className="mb-[14px]">
          <div className={LABEL + " text-mute mb-[6px]"} style={{ fontFamily: MONO }}>Email</div>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" placeholder="you@example.com" className={FIELD}
          />
        </div>

        {mode !== "forgot" && (
          <div className="mb-2">
            <div className="flex justify-between items-baseline mb-[6px]">
              <div className={LABEL + " text-mute"} style={{ fontFamily: MONO }}>Password</div>
              {mode === "signin" && (
                <button
                  type="button" onClick={() => go("forgot")}
                  className={LINK_44 + " text-[10px] tracking-[0.1em] text-live bg-transparent border-none cursor-pointer"}
                  style={{ fontFamily: MONO }}
                >Forgot?</button>
              )}
            </div>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••••" className={FIELD}
            />
          </div>
        )}

        {error && (
          <p className="text-[11px] text-hot leading-[1.5] m-0 mt-3 tracking-[0.02em]" style={{ fontFamily: MONO }} role="alert">
            {error}
          </p>
        )}

        <div className="mt-[14px] mb-[10px]">
          <button
            type="submit" disabled={busy}
            className={BTN_BASE + " " + BTN_PRIMARY + (busy ? BTN_OFF : "")}
            style={{ fontFamily: MONO }}
          >{busy ? c.busy + "…" : c.cta}</button>
        </div>

        {mode === "signup" && (
          <p className="text-[9px] text-mute tracking-[0.05em] leading-[1.7] m-0 mb-2 text-center" style={{ fontFamily: MONO }}>
            BY CREATING AN ACCOUNT YOU AGREE TO OUR{" "}
            <a href="/terms.html" className="text-live no-underline">TERMS</a>{" AND "}
            <a href="/privacy.html" className="text-live no-underline">PRIVACY POLICY</a>.
          </p>
        )}
      </form>

      <div className="flex items-center gap-[10px] my-[18px]">
        <div className="flex-1 h-px bg-line" />
        <span className="text-[9px] uppercase tracking-[0.2em] text-mute" style={{ fontFamily: MONO }}>Or</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <button type="button" onClick={onDismiss} className={BTN_BASE + " " + BTN_GHOST} style={{ fontFamily: MONO }}>
        Continue without an account
      </button>
      <p className="text-[9px] text-mute tracking-[0.05em] leading-[1.7] m-0 mt-[10px] text-center" style={{ fontFamily: MONO }}>
        GUEST DATA STAYS ON THIS DEVICE ONLY. SIGN IN LATER TO SYNC IT ACROSS PHONES.
      </p>

      <div className="pt-4 pb-[6px] text-center">
        <span className="text-[13px] text-mute">{c.prompt} </span>
        <button
          type="button"
          onClick={() => go(mode === "signin" ? "signup" : "signin")}
          className={LINK_44 + " text-[12px] tracking-[0.08em] text-live font-bold bg-transparent border-none cursor-pointer"}
          style={{ fontFamily: MONO }}
        >{c.action}</button>
      </div>
    </Shell>
  );
}

/* Header and page chrome shared by the form and the terminal states. */
function Shell({ children }) {
  return (
    <div className="fixed inset-0 z-50 bg-void overflow-y-auto overscroll-contain">
      <div className="min-h-full flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[412px] px-[6px]">
          <div className="flex justify-end gap-[6px] mb-4">
            {SWATCHES.map((cls) => (
              <span key={cls} className={"w-[11px] h-[11px] rounded-[2px] " + cls} />
            ))}
          </div>
          <div className="flex items-center gap-[11px] mb-[26px]">
            <Mark />
            <div>
              <div className="text-[9px] uppercase tracking-[0.28em] text-mute" style={{ fontFamily: MONO }}>Flowfindr</div>
              <div className="text-[20px] font-extrabold tracking-[-0.02em] text-text leading-none">Fitness</div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
