import React from "react";
import { THEMES, MONO, SANS } from "./theme.js";

/* Landing page, implemented from Landing.dc.html in the "FlowFindr login mockup"
   Claude Design project (f2660682-ed92-4430-bafa-4cdc8960f8ef).

   The design's DCLogic renderVals() is reproduced in buildVals() below, and its
   {{ th.* }} placeholders resolve against the same THEMES the app uses, so no
   hex value differs from the source. Inline styles rather than Tailwind: the
   design leans on alpha-suffixed hex and three gradient types throughout. */

function buildVals(t) {
  const raw = [
    ["Chest", 14], ["Back", 17], ["Quads", 13], ["Hamstrings", 11],
    ["Shoulders", 9], ["Rear delt", 4], ["Calves", 8], ["Biceps", 12],
  ];
  const volume = raw.map(([muscle, n]) => {
    const inRange = n >= 10 && n <= 20;
    const color = n > 20 ? t.hot : inRange ? t.brand : t.mute;
    return {
      muscle, n, color,
      pct: `${Math.min(100, (n / 20) * 100)}%`,
      flag: n > 20 ? "Too much" : inRange ? "On target" : "Add a set",
    };
  });

  return {
    volume,
    stats: [
      { value: "2×", label: "Every muscle, every week", color: t.brand },
      { value: "55+", label: "Exercises with swaps", color: t.live },
      { value: "0", label: "Guesswork per session", color: t.hot },
    ],
    pains: [
      { pain: "\"What did I lift last time?\"", detail: "Notes app, memory, a photo of a scrap of paper. Then you round down to be safe.", fix: "Last session's weights, reps and RIR sit above the slider before your first set.", tilt: -1.2 },
      { pain: "Your split has blind spots", detail: "Four years in and rear delts, hamstrings or calves quietly haven't been trained since spring.", fix: "Weekly sets counted per muscle group, with the ones falling behind flagged.", tilt: 1 },
      { pain: "Someone is on your machine", detail: "You wait, skip it, or improvise something that trains a different muscle entirely.", fix: "One tap swaps in an alternative for the same muscle and keeps the sets you already logged.", tilt: -1 },
      { pain: "Re-setting the machine every time", detail: "Seat height, pin position, incline angle, all relearned from scratch each week.", fix: "Per-exercise settings, starting loads, rep ranges and rest all remembered.", tilt: 1.4 },
    ],
    swaps: [
      { name: "Pull-up", equip: "Bodyweight" },
      { name: "Neutral-grip pulldown", equip: "Cable" },
      { name: "Assisted pull-up machine", equip: "Machine" },
    ],
    flowPoints: [
      "Come back later: park an exercise and finish it before the session closes.",
      "Rest timer starts itself the moment a set is logged, tuned per exercise.",
      "Tap any logged set to fix a number without breaking your place in the session.",
    ],
    pillars: [
      { step: "01", title: "Program", body: "Pick 3, 4 or 5 sessions a week. Every split trains each muscle group roughly twice. Swap exercises, reorder, tune sets, reps and rest, then it's yours.", color: t.brand, tilt: -1.5 },
      { step: "02", title: "Plan", body: "Sessions land on real weekdays with start times, walk and sauna time included, and export to your calendar for the whole week.", color: t.live, tilt: 1.2 },
      { step: "03", title: "Track", body: "Log by slider one-handed, watch estimated 1RM per lift trend over months, and see weekly volume per muscle group at a glance.", color: t.hot, tilt: -1 },
    ],
    ledger: [
      { label: "SET 1", value: "32.5×10", color: t.brand, bg: `${t.brand}16`, valueColor: t.brand },
      { label: "SET 2", value: "32.5×9", color: t.brand, bg: `${t.brand}16`, valueColor: t.brand },
      { label: "SET 3", value: "-", color: t.live, bg: `${t.live}16`, valueColor: t.live },
      { label: "SET 4", value: "-", color: t.line, bg: "transparent", valueColor: t.mute },
    ],
    rirChips: [
      { label: "FAIL", border: t.line, bg: "transparent", color: t.mute, weight: 400 },
      { label: "1", border: t.line, bg: "transparent", color: t.mute, weight: 400 },
      { label: "2", border: t.brand, bg: `${t.brand}1A`, color: t.brand, weight: 700 },
      { label: "3", border: t.line, bg: "transparent", color: t.mute, weight: 400 },
    ],
    sessionPoints: [
      { title: "Slider entry, not a keypad", body: "Weight and reps move on big sliders with fine-nudge buttons either side, sized for one thumb with chalky hands. The slider opens on what you lifted last time, so most sets are two taps.", color: t.brand },
      { title: "Rest timers that start themselves", body: "Log a set and the clock runs at the rest length set for that exercise. Add 30 seconds or hit ready early. Either way you are not watching the wall clock and guessing.", color: t.live },
      { title: "Effort, not just numbers", body: "Every set records reps left in reserve, so the app knows the difference between a comfortable set and a set to failure, and it flags when you are on personal-record pace.", color: t.hot },
    ],
    science: [
      { figure: "10–20", title: "Sets per muscle, per week", body: "The volume range where growth reliably shows up. FlowFindr counts yours and flags anything under or over.", color: t.brand },
      { figure: "2×", title: "Frequency per muscle", body: "Every split spreads each muscle group across two sessions a week rather than one punishing hit.", color: t.live },
      { figure: "0–3", title: "Reps in reserve", body: "Effort logged as RIR, the autoregulation standard, so hard sets count and junk sets are visible.", color: t.hot },
      { figure: "≤10", title: "Sets per muscle in one session", body: "Past roughly ten, extra sets stop paying. The builder warns you and suggests spreading them across the week.", color: t.brand },
    ],
    themeCards: Object.values(THEMES),
  };
}

const wrap = { maxWidth: 1180, margin: "0 auto" };
const eyebrow = (t, color) => ({
  fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
  color, marginBottom: 10,
});
const cardBase = (t) => ({
  background: t.panel, border: `2px solid ${t.line}`, borderRadius: 14,
});
const diamond = (color, size) => ({
  width: size, height: size, background: color, boxShadow: `0 0 10px ${color}aa`,
  transform: "rotate(45deg)", borderRadius: 3,
});

export default function Landing({ theme = "ultraviolet-circuit", appHref = "/" }) {
  /* "Log in" opens the app with the auth sheet already up. The two other
     calls to action deliberately do not: the app works signed out, and
     the training flow is never put behind a login wall. */
  const loginHref = `${appHref}${appHref.includes("?") ? "&" : "?"}auth`;
  const t = THEMES[theme] || THEMES["ultraviolet-circuit"];
  const v = buildVals(t);

  return (
    <div style={{ background: t.void, color: t.text, fontFamily: SANS, overflow: "hidden", minHeight: "100vh" }}>

      {/* NAV */}
      <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true">
            <rect width="512" height="512" fill={t.void} />
            <g stroke={t.live} strokeWidth="30" strokeLinecap="square" fill="none">
              <path d="M148 190v132" /><path d="M364 190v132" />
              <path d="M104 226v60" /><path d="M408 226v60" />
              <path d="M148 256h216" />
            </g>
            <path d="M148 256h216" stroke={t.hot} strokeWidth="12" strokeLinecap="square" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>
            FlowFindr <span style={{ color: t.mute, fontWeight: 600 }}>Fitness</span>
          </span>
        </div>
        <a href={loginHref} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: t.text, border: `1px solid ${t.line}`, padding: "11px 18px", borderRadius: 3, textDecoration: "none" }}>Log in</a>
      </div>

      {/* HERO */}
      <div className="lp-hero" style={{ ...wrap, position: "relative", padding: "40px 24px 90px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 40, alignItems: "center" }}>
        <div style={{ position: "absolute", top: -160, left: -120, width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${t.brand}55, transparent 70%)`, filter: "blur(10px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -200, right: -140, width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${t.live}44, transparent 70%)`, filter: "blur(10px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(${t.line}22 0 1px, transparent 1px 42px)`, pointerEvents: "none", WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)", maskImage: "linear-gradient(to bottom, black, transparent 80%)" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: t.live, background: `${t.live}14`, border: `1px solid ${t.live}55`, padding: "7px 12px", borderRadius: 20, marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.live, boxShadow: `0 0 8px ${t.live}` }} />
            Program · plan · track · adjust
          </div>
          <h1 className="lp-h1" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", margin: "0 0 20px", textWrap: "pretty" }}>
            Never guess your<br />next workout
            <span style={{ background: `linear-gradient(90deg, ${t.brand}, ${t.hot})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}> again.</span>
          </h1>
          <p style={{ fontSize: 17, color: t.mute, lineHeight: 1.6, maxWidth: 470, margin: "0 0 30px" }}>
            FlowFindr Fitness plans your whole training week on the latest hypertrophy science, hits every muscle group
            twice, remembers the weights and settings you used, and keeps up when the gym doesn't go to plan. Stop wasting
            sets and start hitting your goals.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 34 }}>
            <a href={appHref} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: t.void, background: t.brand, border: `1px solid ${t.brand}`, borderRadius: 4, padding: "16px 24px", textDecoration: "none", boxShadow: `0 0 30px ${t.brand}66` }}>Plan my week</a>
            <a href="#how-it-works" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: t.text, background: "none", border: `1px solid ${t.line}`, borderRadius: 4, padding: "16px 24px", textDecoration: "none" }}>See how it works</a>
          </div>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
            {v.stats.map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: s.color, textShadow: `0 0 18px ${s.color}55` }}>{s.value}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: t.mute, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: "120%", height: "120%", background: `conic-gradient(from 180deg, ${t.brand}33, ${t.live}33, ${t.hot}33, ${t.brand}33)`, borderRadius: "50%", filter: "blur(60px)", opacity: 0.6 }} />
          <div className="lp-float" style={{ position: "relative", width: 290, borderRadius: 36, border: `3px solid ${t.line}`, background: t.void, padding: 8, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ borderRadius: 28, overflow: "hidden", background: t.void }}>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${t.line}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: t.brand }}>Upper A</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: t.mute, marginTop: 3 }}>01/07 · 2/21 sets · 12:04</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 16, color: t.mute }}>✕</div>
              </div>
              <div style={{ height: 2, background: t.panel2 }}>
                <div style={{ width: "14%", height: "100%", background: t.brand, boxShadow: `0 0 10px ${t.brand}` }} />
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 12, background: `${t.live}12`, border: `1px solid ${t.live}55`, borderRadius: 3 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", color: t.live }}>LAST</span>
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: t.text }}>30×10  30×9</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: t.mute, marginLeft: "auto" }}>08-13</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: t.brand, border: `1px solid ${t.brand}66`, padding: "3px 7px", borderRadius: 2 }}>Chest</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: t.mute, border: `1px solid ${t.mute}66`, padding: "3px 7px", borderRadius: 2 }}>Free weight</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: t.mute, border: `1px solid ${t.mute}66`, padding: "3px 7px", borderRadius: 2 }}>4 × 6-10</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: 12 }}>Incline dumbbell press</div>
                <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
                  {v.ledger.map((l) => (
                    <div key={l.label} style={{ flex: 1, padding: "8px 2px", borderRadius: 3, border: `1px solid ${l.color}`, background: l.bg, textAlign: "center" }}>
                      <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", color: t.mute }}>{l.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, marginTop: 2, color: l.valueColor }}>{l.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: t.mute }}>Weight (kg)</span>
                  <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: t.brand, lineHeight: 1, textShadow: `0 0 18px ${t.brand}55` }}>
                    32.5<span style={{ fontSize: 11, color: t.mute, marginLeft: 5 }}>kg</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, flexShrink: 0, background: `${t.brand}14`, border: `1px solid ${t.brand}66`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 15, height: 2, background: t.brand }} />
                  </div>
                  <div style={{ flex: 1, position: "relative", height: 42, display: "flex", alignItems: "center" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: 6, background: t.panel2, border: `1px solid ${t.line}`, borderRadius: 3 }} />
                    <div style={{ position: "absolute", left: 0, width: "44%", height: 6, background: t.brand, borderRadius: 3, boxShadow: `0 0 14px ${t.brand}88` }} />
                    <div style={{ position: "absolute", left: "calc(44% - 11px)", width: 22, height: 22, background: t.void, border: `2px solid ${t.brand}`, boxShadow: `0 0 16px ${t.brand}99`, transform: "rotate(45deg)" }} />
                  </div>
                  <div style={{ width: 42, height: 42, flexShrink: 0, background: `${t.brand}14`, border: `1px solid ${t.brand}66`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ width: 15, height: 2, background: t.brand }} />
                    <div style={{ width: 2, height: 15, background: t.brand, position: "absolute" }} />
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: t.mute, marginBottom: 8 }}>Reps left in the tank</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {v.rirChips.map((c) => (
                    <div key={c.label} style={{ flex: 1, padding: "12px 0", borderRadius: 3, border: `1px solid ${c.border}`, background: c.bg, color: c.color, fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", fontWeight: c.weight, textAlign: "center" }}>{c.label}</div>
                  ))}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: t.void, background: t.brand, border: `1px solid ${t.brand}`, borderRadius: 3, padding: "15px 18px", textAlign: "center", boxShadow: `0 0 24px ${t.brand}55` }}>✓ Log set 3</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAIN POINTS */}
      <div style={{ ...wrap, padding: "20px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={eyebrow(t, t.hot)}>Sound familiar?</div>
          <h2 className="lp-h2" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Four years of training, still winging it</h2>
        </div>
        <div className="lp-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
          {v.pains.map((p) => (
            <div key={p.pain} className="lp-tilt" style={{ ...cardBase(t), padding: 24, display: "flex", gap: 18, alignItems: "flex-start", transform: `rotate(${p.tilt}deg)` }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: `${t.hot}14`, border: `2px solid ${t.hot}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={diamond(t.hot, 15)} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 7 }}>{p.pain}</div>
                <div style={{ fontSize: 13, color: t.mute, lineHeight: 1.55, marginBottom: 10 }}>{p.detail}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: t.brand, flexShrink: 0 }}>Fix</span>
                  <span style={{ fontSize: 13, color: t.text, lineHeight: 1.5 }}>{p.fix}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INSIDE A SESSION */}
      <div style={{ ...wrap, padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={eyebrow(t, t.live)}>Inside a session</div>
          <h2 className="lp-h2" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>One thumb, one screen, no thinking</h2>
        </div>
        <div className="lp-session" style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: 48, alignItems: "center" }}>
          <div style={{ position: "relative", width: 290, borderRadius: 36, border: `3px solid ${t.line}`, background: t.void, padding: 8, boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
            <div style={{ borderRadius: 28, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${t.line}` }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: t.brand }}>Upper A</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: t.mute, marginTop: 3 }}>01/07 · 3/21 sets · 14:38</div>
              </div>
              <div style={{ height: 2, background: t.panel2 }}>
                <div style={{ width: "21%", height: "100%", background: t.brand, boxShadow: `0 0 10px ${t.brand}` }} />
              </div>
              <div style={{ padding: "22px 16px 26px", textAlign: "center" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: t.live }}>Rest</div>
                <div style={{ fontFamily: MONO, fontSize: 70, fontWeight: 700, color: t.live, lineHeight: 1, letterSpacing: "-0.04em", textShadow: `0 0 44px ${t.live}55`, margin: "12px 0 16px" }}>1:47</div>
                <div style={{ height: 4, background: t.panel2, borderRadius: 2, overflow: "hidden", marginBottom: 18 }}>
                  <div style={{ width: "59%", height: "100%", background: t.live }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, fontFamily: MONO, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: t.mute, background: `${t.mute}14`, border: `1px solid ${t.mute}`, borderRadius: 3, padding: "11px 0" }}>+30s</div>
                  <div style={{ flex: 1, fontFamily: MONO, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: t.live, background: `${t.live}14`, border: `1px solid ${t.live}`, borderRadius: 3, padding: "11px 0" }}>Ready</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", color: t.mute, lineHeight: 1.7, marginTop: 20 }}>REST LENGTH SET PER EXERCISE. HEAVY COMPOUND, 3 MIN. ISOLATION, 60 SEC.</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {v.sessionPoints.map((sp) => (
                <div key={sp.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: `${sp.color}1A`, border: `2px solid ${sp.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={diamond(sp.color, 14)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{sp.title}</div>
                    <div style={{ fontSize: 14, color: t.mute, lineHeight: 1.6, maxWidth: 520 }}>{sp.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SCIENCE */}
      <div style={{ position: "relative", borderTop: `1px solid ${t.line}`, borderBottom: `1px solid ${t.line}`, background: `linear-gradient(120deg, ${t.brand}14, transparent 45%, ${t.live}14)`, marginBottom: 80 }}>
        <div style={{ ...wrap, padding: "56px 24px" }}>
          <div style={{ maxWidth: 620, marginBottom: 34 }}>
            <div style={eyebrow(t, t.brand)}>Built on the current evidence</div>
            <h2 className="lp-h2" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 14px", lineHeight: 1.1 }}>The programme follows the research, so you stop wasting sets</h2>
            <p style={{ fontSize: 15, color: t.mute, lineHeight: 1.6, margin: 0 }}>
              Every default in FlowFindr Fitness comes from the current hypertrophy literature: weekly volume targets,
              training frequency, effort measured in reps left in reserve, and rest long enough to matter. Follow it and
              the time you spend in the gym goes into your goals instead of into habit.
            </p>
          </div>
          <div className="lp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {v.science.map((s) => (
              <div key={s.title} style={{ ...cardBase(t), padding: "22px 20px" }}>
                <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: s.color, textShadow: `0 0 18px ${s.color}55`, marginBottom: 10 }}>{s.figure}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 7 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: t.mute, lineHeight: 1.55 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MUSCLE ACTIVATION */}
      <div style={{ ...wrap, padding: "0 24px 80px" }}>
        <div className="lp-split lp-pad" style={{ ...cardBase(t), borderRadius: 20, padding: 44, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, left: -60, width: 320, height: 320, background: `radial-gradient(circle,${t.brand}33,transparent 70%)`, borderRadius: "50%" }} />
          <div style={{ position: "relative" }}>
            <div style={eyebrow(t, t.brand)}>Muscle group activation</div>
            <h3 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 14px", lineHeight: 1.1 }}>The muscle you skip is the one you love your split for</h3>
            <p style={{ fontSize: 14, color: t.mute, lineHeight: 1.6, margin: "0 0 16px" }}>
              Lifters get attached to their own schedule and quietly drop rear delts, hamstrings and calves for months.
              FlowFindr counts every set by muscle group across the week and flags what is falling behind, plus what you are
              hammering past the point it does anything.
            </p>
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: t.mute, lineHeight: 1.8, margin: 0 }}>
              TARGET 10–20 SETS PER MUSCLE, PER WEEK. EVERY SPLIT HITS EACH GROUP ROUGHLY TWICE.
            </p>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: t.mute }}>Sets this week</span>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: t.mute }}>TARGET 10-20</span>
            </div>
            {v.volume.map((vol) => (
              <div key={vol.muscle} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                <span style={{ fontSize: 12, color: t.mute, width: 96, flexShrink: 0 }}>{vol.muscle}</span>
                <div style={{ flex: 1, height: 7, background: t.panel2, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: vol.pct, height: "100%", background: vol.color, boxShadow: `0 0 10px ${vol.color}88` }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: vol.color, width: 22, textAlign: "right" }}>{vol.n}</span>
                <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: vol.color, width: 52 }}>{vol.flag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOW / MACHINE TAKEN */}
      <div className="lp-flow" style={{ ...wrap, padding: "0 24px 80px", display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 40, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{ background: t.panel, border: `2px solid ${t.live}`, borderRadius: 16, padding: 22, boxShadow: `0 0 40px ${t.live}22` }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: t.live, background: `${t.live}14`, border: `1px solid ${t.live}66`, padding: "8px 12px", borderRadius: 3, marginBottom: 16 }}>Machine taken</div>
            <div style={{ fontSize: 13, color: t.mute, marginBottom: 6 }}>Lat pulldown, wide grip · occupied</div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: t.mute, margin: "16px 0 10px" }}>Suggested swaps · same muscle</div>
            {v.swaps.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, background: t.panel2, border: `1px solid ${t.line}`, borderRadius: 4, padding: "12px 13px", marginBottom: 7 }}>
                <span style={{ flex: 1, fontSize: 14 }}>{s.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: t.mute, border: `1px solid ${t.line}`, padding: "3px 7px", borderRadius: 2 }}>{s.equip}</span>
              </div>
            ))}
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", color: t.mute, lineHeight: 1.7, marginTop: 12 }}>SWAPPING KEEPS THE SETS ALREADY LOGGED HERE.</div>
          </div>
        </div>
        <div>
          <div style={eyebrow(t, t.live)}>Stay in flow</div>
          <h3 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 16px", lineHeight: 1.08 }}>A plan that bends instead of breaking</h3>
          <p style={{ fontSize: 15, color: t.mute, lineHeight: 1.6, margin: "0 0 18px", maxWidth: 520 }}>
            Machine occupied? Swap it for an alternative that trains the same muscle with one tap, and your weekly set count
            updates with it. Need to come back later? Park the exercise and keep moving. Rest timers start themselves so you
            are never doing arithmetic between sets.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {v.flowPoints.map((fp) => (
              <div key={fp} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 11, height: 11, marginTop: 5, flexShrink: 0, background: t.brand, transform: "rotate(45deg)", borderRadius: 2, boxShadow: `0 0 10px ${t.brand}88` }} />
                <div style={{ fontSize: 14, color: t.text, lineHeight: 1.5 }}>{fp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* THREE PILLARS */}
      <div id="how-it-works" style={{ ...wrap, padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={eyebrow(t, t.brand)}>How it works</div>
          <h2 className="lp-h2" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Program it once. Follow it. Watch it move.</h2>
        </div>
        <div className="lp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {v.pillars.map((f) => (
            <div key={f.step} className="lp-tilt" style={{ ...cardBase(t), padding: "28px 22px", transform: `rotate(${f.tilt}deg)` }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: f.color, marginBottom: 14 }}>{f.step}</div>
              <div style={{ width: 46, height: 46, borderRadius: 11, background: `${f.color}1A`, border: `2px solid ${f.color}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <div style={diamond(f.color, 18)} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 9 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: t.mute, lineHeight: 1.6 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* THEMES */}
      <div style={{ ...wrap, padding: "0 24px 80px" }}>
        <div className="lp-split lp-pad" style={{ ...cardBase(t), borderRadius: 20, padding: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, background: `radial-gradient(circle,${t.hot}33,transparent 70%)`, borderRadius: "50%" }} />
          <div>
            <div style={eyebrow(t, t.live)}>Readable mid-set</div>
            <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 14px" }}>Three neon looks. One colour language.</h3>
            <p style={{ fontSize: 14, color: t.mute, lineHeight: 1.6, margin: 0 }}>
              Identity, live data and intensity keep the same meaning in every theme, so a glance at the rest timer or a
              personal record reads the same whichever one you pick.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {v.themeCards.map((tc) => (
              <div key={tc.name} style={{ display: "flex", alignItems: "center", gap: 12, background: tc.panel, border: `1px solid ${tc.line}`, borderRadius: 8, padding: "13px 16px" }}>
                <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{tc.name}</span>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: tc.brand, boxShadow: `0 0 8px ${tc.brand}aa` }} />
                <span style={{ width: 14, height: 14, borderRadius: 3, background: tc.live, boxShadow: `0 0 8px ${tc.live}aa` }} />
                <span style={{ width: 14, height: 14, borderRadius: 3, background: tc.hot, boxShadow: `0 0 8px ${tc.hot}aa` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ ...wrap, padding: "0 24px 90px", textAlign: "center" }}>
        <h2 className="lp-h2" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 14px" }}>Your week, programmed in five minutes.</h2>
        <p style={{ fontSize: 14, color: t.mute, margin: "0 0 26px" }}>Start logging without an account. Sign in later when you want your history on more than one phone.</p>
        <a href={appHref} style={{ display: "inline-block", fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: t.void, background: t.brand, border: `1px solid ${t.brand}`, borderRadius: 4, padding: "17px 30px", textDecoration: "none", boxShadow: `0 0 30px ${t.brand}66` }}>Open FlowFindr Fitness</a>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${t.line}` }}>
        <div style={{ ...wrap, padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: t.mute }}>FlowFindr Fitness · program, plan, track</span>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: t.mute }}>No account required to start</span>
        </div>
      </div>
    </div>
  );
}
