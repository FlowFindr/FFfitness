import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Play, X, Check, SkipForward, Plus, Minus, RotateCcw, Flame, CalendarPlus, Repeat,
  Activity, Dumbbell, SlidersHorizontal, Footprints, Info, Trash2, Pencil, Trophy,
  ChevronRight, ChevronUp, ChevronDown, Search, Wrench, Shuffle, CornerDownRight,
} from "lucide-react";

/* ============================================================
   FLOWFINDR FITNESS
   Colour roles, held constant across every theme:
     brand  identity, completed sets, primary action
     live   the current set, the rest timer, live data
     hot    intensity only: failure sets and personal records
   ============================================================ */

const THEMES = {
  "ultraviolet-circuit": {
    name: "Ultraviolet Circuit",
    note: "Indigo-black base, violet identity, cyan runs the data.",
    void: "#06070F", panel: "#0D1020", panel2: "#151A2E", line: "#242B45",
    brand: "#7C6BFF", live: "#00E5FF", hot: "#FF4D8D",
    text: "#EEF1FF", mute: "#9AA6C4",
  },
  nightdrive: {
    name: "Nightdrive",
    note: "Warmer purple base. Softer glow, same structure.",
    void: "#0A0818", panel: "#140F26", panel2: "#1C1636", line: "#2C2450",
    brand: "#8B5CF6", live: "#22D3EE", hot: "#FF5C9E",
    text: "#F3F0FF", mute: "#ADA3CB",
  },
  "cyan-prime": {
    name: "Cyan Prime",
    note: "Roles flip. Cyan is the identity, violet marks live state.",
    void: "#04060E", panel: "#0A0F1C", panel2: "#101827", line: "#1D2940",
    brand: "#00E5FF", live: "#7B5CFF", hot: "#FF3D7F",
    text: "#ECF6FF", mute: "#93A6C0",
  },
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/* ---------------- storage ---------------- */
const mem = {};
const store = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : null;
      }
      if (typeof window !== "undefined" && window.localStorage) {
        const v = window.localStorage.getItem(key);
        return v ? JSON.parse(v) : null;
      }
    } catch { return mem[key] ?? null; }
    return mem[key] ?? null;
  },
  async set(key, value) {
    mem[key] = value;
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value)); return;
      }
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch { /* memory fallback already written */ }
  },
};

/* ---------------- exercise library ---------------- */
const EX = {
  "inc-db-press": { name: "Incline dumbbell press", muscle: "Chest", equip: "Free weight", cue: "Bench at 30 to 45 degrees. Elbows about 45 degrees from the torso. Stop a finger off the chest.", alts: ["Incline barbell press", "Incline Smith press", "Technogym incline chest press"] },
  "flat-db-press": { name: "Flat dumbbell press", muscle: "Chest", equip: "Free weight", cue: "Shoulder blades pinned back and down. Two second descent, no bounce.", alts: ["Barbell bench press", "Cable chest press", "Technogym chest press"] },
  "barbell-bench": { name: "Barbell bench press", muscle: "Chest", equip: "Barbell", cue: "Feet planted, slight arch. Bar to the lower chest, elbows tucked to about 45 degrees.", alts: ["Flat dumbbell press", "Smith machine bench", "Chest press machine"] },
  "cable-fly-low": { name: "Low-to-high cable fly", muscle: "Chest", equip: "Cable", cue: "Fix a slight elbow bend and keep it. Cross slightly past the midline.", alts: ["High-to-low cable fly", "Pec deck", "Dumbbell fly on incline"] },
  "pec-deck": { name: "Pec deck", muscle: "Chest", equip: "Machine", cue: "Set the seat so the handles sit at chest height. Squeeze for one second.", alts: ["Cable fly", "Dumbbell fly", "Technogym chest fly"] },
  "dips": { name: "Chest dip", muscle: "Chest", equip: "Bodyweight", cue: "Lean the torso forward. Stop when the shoulders reach elbow depth.", alts: ["Assisted dip machine", "Weighted dip", "Decline press"] },

  "lat-pulldown": { name: "Lat pulldown, wide grip", muscle: "Back", equip: "Cable", cue: "Drive the elbows down toward your hips. Torso still, no swinging.", alts: ["Pull-up", "Neutral-grip pulldown", "Assisted pull-up machine"] },
  "neutral-pulldown": { name: "Neutral-grip pulldown", muscle: "Back", equip: "Cable", cue: "Palms facing. Slightly more biceps, easier on the shoulders.", alts: ["Wide pulldown", "Chin-up", "Single-arm pulldown"] },
  "pull-up": { name: "Pull-up", muscle: "Back", equip: "Bodyweight", cue: "Full hang at the bottom. Chest toward the bar, no kipping.", alts: ["Assisted pull-up machine", "Lat pulldown", "Band-assisted pull-up"] },
  "chest-sup-row": { name: "Chest-supported row", muscle: "Back", equip: "Machine", cue: "Chest glued to the pad. Pull to the lower ribs, pause one second.", alts: ["Seated cable row", "Single-arm dumbbell row", "T-bar row"] },
  "seated-cable-row": { name: "Seated cable row", muscle: "Back", equip: "Cable", cue: "Neutral spine. Let the shoulder blades travel forward on the stretch.", alts: ["Chest-supported row", "Technogym row", "Single-arm cable row"] },
  "db-row": { name: "Single-arm dumbbell row", muscle: "Back", equip: "Dumbbell", cue: "Hand and knee on the bench. Pull to the hip, not the armpit.", alts: ["Chest-supported row", "Cable row", "Meadows row"] },
  "t-bar-row": { name: "T-bar row", muscle: "Back", equip: "Barbell", cue: "Hinge to about 45 degrees and hold it. No jerking with the lower back.", alts: ["Chest-supported row", "Barbell row", "Machine row"] },
  "straight-arm-pd": { name: "Straight-arm pulldown", muscle: "Back", equip: "Cable", cue: "Arms nearly locked. This is lats only, not triceps.", alts: ["Cable pullover", "Machine pullover", "Dumbbell pullover"] },

  "face-pull": { name: "Cable face pull", muscle: "Rear delt", equip: "Cable", cue: "Rope to forehead height. Thumbs rotate back at the finish.", alts: ["Reverse pec deck", "Bent-over cable rear fly", "Dumbbell rear fly"] },
  "rear-delt-fly": { name: "Reverse pec deck", muscle: "Rear delt", equip: "Machine", cue: "Wide arc, stop level with the shoulders. Light weight wins here.", alts: ["Cable rear delt fly", "Bent-over dumbbell fly", "Face pull"] },
  "db-rear-fly": { name: "Bent-over dumbbell fly", muscle: "Rear delt", equip: "Dumbbell", cue: "Chest on an incline bench if one is free. Lead with the pinkies.", alts: ["Reverse pec deck", "Cable rear fly", "Face pull"] },

  "db-shoulder-press": { name: "Seated dumbbell press", muscle: "Shoulders", equip: "Free weight", cue: "Ribs down, no lower-back arch. Press slightly in front of the ears.", alts: ["Standing barbell press", "Technogym shoulder press", "Cable shoulder press"] },
  "barbell-ohp": { name: "Standing barbell press", muscle: "Shoulders", equip: "Barbell", cue: "Squeeze the glutes to stop the lean. Head moves through at lockout.", alts: ["Seated dumbbell press", "Machine press", "Landmine press"] },
  "machine-shoulder-press": { name: "Machine shoulder press", muscle: "Shoulders", equip: "Machine", cue: "Seat height so the handles start at ear level.", alts: ["Dumbbell press", "Smith machine press", "Cable press"] },

  "cable-lat-raise": { name: "Cable lateral raise", muscle: "Side delt", equip: "Cable", cue: "Lead with the elbow. No shrug, stop at shoulder height.", alts: ["Dumbbell lateral raise", "Machine lateral raise", "Cable Y-raise"] },
  "db-lat-raise": { name: "Dumbbell lateral raise", muscle: "Side delt", equip: "Dumbbell", cue: "Slight forward lean, pour-the-jug at the top. Lighter than you think.", alts: ["Cable lateral raise", "Machine lateral raise", "Leaning single-arm raise"] },
  "machine-lat-raise": { name: "Machine lateral raise", muscle: "Side delt", equip: "Machine", cue: "Pads against the outer arm, not the forearm.", alts: ["Cable lateral raise", "Dumbbell raise", "Cable Y-raise"] },

  "back-squat": { name: "Barbell back squat", muscle: "Quads", equip: "Barbell", cue: "Depth over load. Knees track over the toes, brace before you descend.", alts: ["Hack squat", "Leg press", "Goblet squat"] },
  "front-squat": { name: "Front squat", muscle: "Quads", equip: "Barbell", cue: "Elbows high. More upright, more quad, less lower back.", alts: ["Hack squat", "Goblet squat", "Smith front squat"] },
  "hack-squat": { name: "Hack squat", muscle: "Quads", equip: "Machine", cue: "Feet slightly low on the platform for quads. Full depth.", alts: ["Leg press", "Barbell squat", "Smith squat"] },
  "leg-press": { name: "Leg press", muscle: "Quads", equip: "Machine", cue: "Feet mid-platform. Go deep enough to feel the stretch, keep the lower back down.", alts: ["Hack squat", "Barbell squat", "Smith machine squat"] },
  "goblet-squat": { name: "Goblet squat", muscle: "Quads", equip: "Dumbbell", cue: "Dumbbell at the chest as a counterweight. Elbows inside the knees at the bottom.", alts: ["Front squat", "Hack squat", "Leg press"] },
  "leg-ext": { name: "Leg extension", muscle: "Quads", equip: "Machine", cue: "One second squeeze at the top. Control the way down.", alts: ["Sissy squat", "Reverse Nordic", "Cable knee extension"] },
  bulgarian: { name: "Bulgarian split squat", muscle: "Quads and glutes", equip: "Dumbbell", cue: "Torso leans slightly forward. Back foot is a kickstand, not a driver.", alts: ["Walking lunge", "Step-up", "Single-leg press"] },
  "walking-lunge": { name: "Walking lunge", muscle: "Quads and glutes", equip: "Dumbbell", cue: "Long stride for glutes, short for quads. Knee kisses the floor.", alts: ["Bulgarian split squat", "Step-up", "Reverse lunge"] },
  "step-up": { name: "Dumbbell step-up", muscle: "Quads and glutes", equip: "Dumbbell", cue: "Box at knee height. Drive through the heel, do not push off the back foot.", alts: ["Bulgarian split squat", "Walking lunge", "Single-leg press"] },

  rdl: { name: "Romanian deadlift", muscle: "Hamstrings", equip: "Barbell", cue: "Hips travel back, bar stays on the legs. Stop when the stretch runs out.", alts: ["Dumbbell RDL", "Cable pull-through", "45 degree back extension"] },
  "db-rdl": { name: "Dumbbell RDL", muscle: "Hamstrings", equip: "Dumbbell", cue: "Same hinge, easier to bail out of. Dumbbells brush the thighs.", alts: ["Barbell RDL", "Single-leg RDL", "Back extension"] },
  "leg-curl": { name: "Seated leg curl", muscle: "Hamstrings", equip: "Machine", cue: "Hips strapped down. Two second negative every rep.", alts: ["Lying leg curl", "Nordic curl", "Cable leg curl"] },
  "lying-leg-curl": { name: "Lying leg curl", muscle: "Hamstrings", equip: "Machine", cue: "Hips stay on the pad. Do not arch to move more weight.", alts: ["Seated leg curl", "Nordic curl", "Cable leg curl"] },
  "back-extension": { name: "45 degree back extension", muscle: "Hamstrings", equip: "Machine", cue: "Round the upper back slightly to bias glutes and hamstrings.", alts: ["Romanian deadlift", "Cable pull-through", "Reverse hyper"] },

  "hip-thrust": { name: "Barbell hip thrust", muscle: "Glutes", equip: "Barbell", cue: "Chin tucked, ribs down. Full lockout, one second hold.", alts: ["Machine hip thrust", "Cable pull-through", "Single-leg glute bridge"] },
  "machine-hip-thrust": { name: "Machine hip thrust", muscle: "Glutes", equip: "Machine", cue: "Same lockout, no bar digging into the hips.", alts: ["Barbell hip thrust", "Glute bridge", "Cable pull-through"] },
  "cable-kickback": { name: "Cable glute kickback", muscle: "Glutes", equip: "Cable", cue: "Hinge slightly and hold. Drive the heel back, not up.", alts: ["Machine kickback", "Hip thrust", "Reverse hyper"] },

  "calf-raise": { name: "Standing calf raise", muscle: "Calves", equip: "Machine", cue: "Two second stretch at the bottom. No bouncing off the tendon.", alts: ["Smith machine calf raise", "Leg press calf press", "Single-leg dumbbell raise"] },
  "seated-calf": { name: "Seated calf raise", muscle: "Calves", equip: "Machine", cue: "Knees bent hits the soleus. Slow at both ends.", alts: ["Standing calf raise", "Leg press calf press", "Smith calf raise"] },
  "leg-press-calf": { name: "Leg press calf press", muscle: "Calves", equip: "Machine", cue: "Toes on the bottom edge. Do not let the knees bend and cheat.", alts: ["Standing calf raise", "Seated calf raise", "Smith calf raise"] },

  "cable-curl": { name: "Cable bicep curl", muscle: "Biceps", equip: "Cable", cue: "Elbows pinned to the ribs. The cable keeps tension at the bottom.", alts: ["EZ-bar curl", "Incline dumbbell curl", "Machine preacher curl"] },
  "ez-curl": { name: "EZ-bar curl", muscle: "Biceps", equip: "Barbell", cue: "No hip swing. If the bar needs momentum, it is too heavy.", alts: ["Cable curl", "Dumbbell curl", "Preacher curl"] },
  "incline-curl": { name: "Incline dumbbell curl", muscle: "Biceps", equip: "Dumbbell", cue: "Bench at 45 to 60 degrees. Arms hang behind the body for the stretch.", alts: ["Cable curl", "Preacher curl", "Standing dumbbell curl"] },
  "preacher-curl": { name: "Preacher curl", muscle: "Biceps", equip: "Machine", cue: "Armpits into the top of the pad. Do not fully lock out at the bottom.", alts: ["Incline curl", "Cable curl", "EZ-bar curl"] },
  "hammer-curl": { name: "Hammer curl", muscle: "Biceps and brachialis", equip: "Dumbbell", cue: "Neutral wrist throughout. No hip swing to start the rep.", alts: ["Rope cable hammer curl", "Reverse curl", "Cross-body curl"] },

  "tri-pushdown": { name: "Cable triceps pushdown", muscle: "Triceps", equip: "Cable", cue: "Elbows locked at your sides. Only the forearm moves.", alts: ["Rope pushdown", "Dip machine", "Close-grip bench press"] },
  "oh-tri-ext": { name: "Overhead cable extension", muscle: "Triceps", equip: "Cable", cue: "Big stretch behind the head. This is where the long head grows.", alts: ["Dumbbell overhead extension", "EZ-bar skullcrusher", "Machine triceps extension"] },
  "skullcrusher": { name: "EZ-bar skullcrusher", muscle: "Triceps", equip: "Barbell", cue: "Bar to the forehead or just behind it. Elbows stay pointed up.", alts: ["Overhead cable extension", "Dumbbell extension", "Close-grip bench"] },
  "close-grip-bench": { name: "Close-grip bench press", muscle: "Triceps", equip: "Barbell", cue: "Hands shoulder width. Elbows tucked tight to the ribs.", alts: ["Dip", "Machine triceps press", "Skullcrusher"] },

  "cable-crunch": { name: "Cable crunch", muscle: "Abs", equip: "Cable", cue: "Round the spine down. Hips stay fixed, this is not a hip hinge.", alts: ["Machine crunch", "Weighted decline crunch", "Ab wheel rollout"] },
  "hanging-leg-raise": { name: "Hanging leg raise", muscle: "Abs", equip: "Bodyweight", cue: "Curl the pelvis up at the top. Kill the swing between reps.", alts: ["Captain's chair leg raise", "Lying leg raise", "Reverse crunch"] },
  "ab-wheel": { name: "Ab wheel rollout", muscle: "Abs", equip: "Bodyweight", cue: "Ribs down and pelvis tucked. Only roll as far as you can hold that.", alts: ["Cable crunch", "Plank", "Barbell rollout"] },
  pallof: { name: "Pallof press", muscle: "Core", equip: "Cable", cue: "Resist the rotation. Breathe out as you press away.", alts: ["Cable woodchop", "Suitcase carry", "Side plank"] },
  "suitcase-carry": { name: "Suitcase carry", muscle: "Core", equip: "Dumbbell", cue: "One heavy weight, walk tall, do not lean away from it.", alts: ["Pallof press", "Farmer carry", "Side plank"] },
};

const MUSCLES = [...new Set(Object.values(EX).map((e) => e.muscle))];

const S = (ex, sets, lo, hi, rest) => ({ ex, sets, lo, hi, rest });

const PROGRAMS = {
  3: [
    { id: "fbA", name: "Full body A", focus: "Squat, horizontal push and pull", day: 1, ex: [S("back-squat", 3, 6, 10, 180), S("inc-db-press", 3, 8, 12, 150), S("seated-cable-row", 3, 8, 12, 120), S("cable-lat-raise", 3, 12, 20, 75), S("tri-pushdown", 3, 10, 15, 75), S("cable-crunch", 3, 10, 15, 60)] },
    { id: "fbB", name: "Full body B", focus: "Hinge, vertical push and pull", day: 3, ex: [S("rdl", 3, 6, 10, 180), S("lat-pulldown", 3, 8, 12, 150), S("db-shoulder-press", 3, 8, 12, 120), S("leg-curl", 3, 10, 15, 90), S("cable-curl", 3, 10, 15, 75), S("hanging-leg-raise", 3, 8, 15, 60)] },
    { id: "fbC", name: "Full body C", focus: "Single leg, chest and back volume", day: 5, ex: [S("bulgarian", 3, 8, 12, 150), S("flat-db-press", 3, 8, 12, 150), S("chest-sup-row", 3, 8, 12, 120), S("leg-ext", 3, 12, 15, 75), S("face-pull", 3, 12, 20, 60), S("calf-raise", 4, 8, 12, 75)] },
  ],
  4: [
    { id: "upA", name: "Upper A", focus: "Push bias", day: 1, ex: [S("inc-db-press", 4, 6, 10, 180), S("lat-pulldown", 3, 8, 12, 150), S("db-shoulder-press", 3, 8, 12, 120), S("seated-cable-row", 3, 10, 15, 90), S("cable-lat-raise", 3, 12, 20, 75), S("tri-pushdown", 3, 10, 15, 75), S("cable-curl", 2, 10, 15, 60)] },
    { id: "loA", name: "Lower A", focus: "Quad bias", day: 2, ex: [S("back-squat", 4, 5, 8, 180), S("rdl", 3, 8, 12, 150), S("leg-press", 3, 10, 15, 120), S("leg-curl", 3, 10, 15, 90), S("calf-raise", 4, 8, 12, 75), S("cable-crunch", 3, 10, 15, 60)] },
    { id: "upB", name: "Upper B", focus: "Pull bias", day: 4, ex: [S("chest-sup-row", 4, 8, 12, 180), S("flat-db-press", 3, 8, 12, 150), S("straight-arm-pd", 3, 12, 15, 75), S("rear-delt-fly", 3, 12, 20, 60), S("cable-fly-low", 3, 10, 15, 75), S("hammer-curl", 3, 10, 15, 60), S("oh-tri-ext", 3, 10, 15, 60)] },
    { id: "loB", name: "Lower B", focus: "Hinge and glute bias", day: 5, ex: [S("rdl", 4, 6, 10, 180), S("bulgarian", 3, 8, 12, 150), S("hip-thrust", 3, 8, 12, 120), S("leg-ext", 3, 12, 15, 75), S("calf-raise", 4, 10, 15, 75), S("hanging-leg-raise", 3, 8, 15, 60)] },
  ],
  5: [
    { id: "push", name: "Push", focus: "Chest, shoulders, triceps", day: 1, ex: [S("inc-db-press", 4, 6, 10, 180), S("db-shoulder-press", 3, 8, 12, 150), S("cable-fly-low", 3, 10, 15, 90), S("cable-lat-raise", 4, 12, 20, 75), S("tri-pushdown", 3, 10, 15, 75), S("oh-tri-ext", 2, 10, 15, 60), S("pallof", 3, 8, 12, 45)] },
    { id: "pull", name: "Pull", focus: "Back and biceps", day: 2, ex: [S("lat-pulldown", 4, 8, 12, 180), S("chest-sup-row", 4, 8, 12, 150), S("straight-arm-pd", 3, 12, 15, 75), S("face-pull", 3, 15, 20, 60), S("cable-curl", 3, 10, 15, 75), S("hammer-curl", 3, 10, 15, 60), S("hanging-leg-raise", 3, 8, 15, 60)] },
    { id: "legs", name: "Legs", focus: "Quads and hamstrings", day: 3, ex: [S("back-squat", 4, 5, 8, 180), S("rdl", 3, 8, 12, 150), S("leg-curl", 3, 10, 15, 90), S("leg-ext", 3, 12, 15, 75), S("calf-raise", 4, 8, 12, 75), S("cable-crunch", 3, 10, 15, 60)] },
    { id: "upper", name: "Upper", focus: "Second chest and back hit", day: 5, ex: [S("flat-db-press", 4, 8, 12, 180), S("seated-cable-row", 4, 8, 12, 150), S("cable-fly-low", 3, 10, 15, 75), S("rear-delt-fly", 3, 12, 20, 60), S("cable-curl", 3, 10, 15, 60), S("tri-pushdown", 3, 10, 15, 60)] },
    { id: "lower", name: "Lower", focus: "Glutes and single leg", day: 6, ex: [S("hip-thrust", 4, 8, 12, 180), S("bulgarian", 3, 8, 12, 150), S("leg-press", 3, 10, 15, 120), S("leg-curl", 3, 10, 15, 90), S("calf-raise", 4, 10, 15, 75), S("pallof", 3, 8, 12, 45)] },
  ],
};

const RUN_DAY = { 3: 6, 4: 6, 5: 4 };
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULTS = { days: 3, startTime: "12:00", sauna: 20, walk: 10, unit: "kg", theme: "ultraviolet-circuit" };

/* ---------------- helpers ---------------- */
const pad2 = (n) => String(n).padStart(2, "0");
const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const e1rm = (w, r) => (w > 0 ? w * (1 + r / 30) : 0);
const clock = (s) => `${Math.floor(Math.max(0, s) / 60)}:${pad2(Math.max(0, s) % 60)}`;

const partOfDay = (h) => (h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 22 ? "evening" : "night");
const longDate = (d) => `${DOW[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
const addMinutes = (hhmm, mins) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + mins) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
};

/* A session's exercises: the user's custom list if they have built one, else the default. */
const templates = (days) => PROGRAMS[days];
const templateById = (days, id) => PROGRAMS[days].find((s) => s.id === id);
const exercisesFor = (days, id, custom) => custom?.[id] || templateById(days, id)?.ex || [];
const planFor = (days, id, custom) => {
  const tpl = templateById(days, id);
  return tpl ? { ...tpl, ex: exercisesFor(days, id, custom) } : null;
};
const planForDow = (days, dow, custom) => {
  const tpl = PROGRAMS[days].find((s) => s.day === dow);
  return tpl ? planFor(days, tpl.id, custom) : null;
};
const nextTraining = (days, custom) => {
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i);
    const p = planForDow(days, d.getDay(), custom);
    if (p) return { plan: p, date: d };
  }
  return null;
};

function history(logs, exId) {
  const out = [];
  Object.keys(logs).sort().forEach((d) => {
    const sets = logs[d]?.entries?.[exId];
    if (sets && sets.length) out.push({ date: d, sets });
  });
  return out;
}
const lastSession = (logs, exId) => {
  const h = history(logs, exId);
  return h.length ? h[h.length - 1] : null;
};
const bestE1rm = (logs, exId) =>
  history(logs, exId).reduce((m, s) => Math.max(m, ...s.sets.map((x) => e1rm(x.w, x.r))), 0);

/* ---------------- primitives ---------------- */
const Panel = ({ t, children, style, ...r }) => (
  <div {...r} style={{ background: t.panel, border: `1px solid ${t.line}`, borderRadius: 5, ...style }}>{children}</div>
);

const Label = ({ t, children, color }) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", color: color || t.mute, textTransform: "uppercase" }}>{children}</div>
);

const Chip = ({ children, color }) => (
  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color, border: `1px solid ${color}66`, padding: "3px 7px", borderRadius: 2, whiteSpace: "nowrap" }}>{children}</span>
);

function Action({ t, children, onClick, color, filled, style }) {
  const c = color || t.brand;
  return (
    <button onClick={onClick} style={{
      fontFamily: MONO, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700,
      color: filled ? t.void : c, background: filled ? c : `${c}14`,
      border: `1px solid ${c}`, borderRadius: 3, padding: "15px 18px", width: "100%", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      boxShadow: filled ? `0 0 24px ${c}55` : "none",
      transition: "background 120ms ease, box-shadow 120ms ease", WebkitTapHighlightColor: "transparent", ...style,
    }}>{children}</button>
  );
}

function Gauge({ t, label, value, min, max, step, fine, suffix, onChange, color, compact }) {
  const c = color || t.brand;
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const nudge = (d) => onChange(Math.min(max, Math.max(min, +(value + d).toFixed(2))));
  return (
    <div style={{ marginBottom: compact ? 10 : 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <Label t={t}>{label}</Label>
        <div style={{ fontFamily: MONO, fontSize: compact ? 20 : 34, fontWeight: 700, color: c, lineHeight: 1, textShadow: `0 0 18px ${c}55` }}>
          {value}<span style={{ fontSize: compact ? 10 : 12, color: t.mute, marginLeft: 5 }}>{suffix}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => nudge(-(fine || step))} style={nudgeBtn(t, c, compact)} aria-label={`Decrease ${label}`}><Minus size={compact ? 14 : 17} /></button>
        <div style={{ flex: 1, position: "relative", height: compact ? 36 : 44, display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 6, background: t.panel2, borderRadius: 3, border: `1px solid ${t.line}` }} />
          <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 6, background: c, borderRadius: 3, boxShadow: `0 0 14px ${c}88` }} />
          <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{ position: "absolute", left: 0, width: "100%", height: compact ? 36 : 44, opacity: 0, margin: 0, cursor: "pointer" }} aria-label={label} />
          <div style={{ position: "absolute", left: `calc(${pct}% - 11px)`, width: 22, height: 22, background: t.void, border: `2px solid ${c}`, boxShadow: `0 0 16px ${c}99`, transform: "rotate(45deg)", pointerEvents: "none" }} />
        </div>
        <button onClick={() => nudge(fine || step)} style={nudgeBtn(t, c, compact)} aria-label={`Increase ${label}`}><Plus size={compact ? 14 : 17} /></button>
      </div>
    </div>
  );
}
const nudgeBtn = (t, c, compact) => ({
  width: compact ? 40 : 48, height: compact ? 40 : 48, flexShrink: 0, background: `${c}14`, border: `1px solid ${c}66`, color: c,
  borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent",
});

function Reveal({ t, icon, label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        background: "none", border: `1px solid ${t.line}`, color: t.mute, fontFamily: MONO, fontSize: 10,
        letterSpacing: "0.16em", textTransform: "uppercase", padding: "8px 11px", borderRadius: 3, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 7, WebkitTapHighlightColor: "transparent",
      }}>
        {icon} {label}
        <ChevronRight size={12} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 150ms ease" }} />
      </button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

const Sheet = ({ t, title, subtitle, onClose, children, footer }) => (
  <div style={{ position: "fixed", inset: 0, background: t.void, zIndex: 70, display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "13px 16px", borderBottom: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div>
        <Label t={t} color={t.brand}>{title}</Label>
        {subtitle && <div style={{ fontFamily: MONO, fontSize: 11, color: t.mute, marginTop: 3 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", color: t.mute, cursor: "pointer", padding: 8 }} aria-label="Close"><X size={22} /></button>
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>{children}</div>
    {footer && <div style={{ padding: 16, borderTop: `1px solid ${t.line}`, background: t.panel, flexShrink: 0 }}>{footer}</div>}
  </div>
);

/* ============================================================
   EXERCISE PICKER
   Same-muscle options float to the top, because the usual
   reason you are here is that a machine is occupied.
   ============================================================ */
function Picker({ t, currentId, onPick, onClose }) {
  const [q, setQ] = useState("");
  const focusMuscle = currentId ? EX[currentId]?.muscle : null;

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const g = {};
    Object.entries(EX).forEach(([id, e]) => {
      if (needle && !`${e.name} ${e.muscle} ${e.equip}`.toLowerCase().includes(needle)) return;
      if (!g[e.muscle]) g[e.muscle] = [];
      g[e.muscle].push({ id, ...e });
    });
    return Object.keys(g)
      .sort((a, b) => (a === focusMuscle ? -1 : b === focusMuscle ? 1 : MUSCLES.indexOf(a) - MUSCLES.indexOf(b)))
      .map((m) => [m, g[m]]);
  }, [q, focusMuscle]);

  return (
    <Sheet t={t} title="Choose exercise" subtitle={focusMuscle ? `${focusMuscle} shown first` : "All muscle groups"} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 11px", marginBottom: 16, background: t.panel, border: `1px solid ${t.line}`, borderRadius: 3 }}>
        <Search size={15} color={t.mute} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, muscle or equipment"
          style={{ flex: 1, padding: "13px 0", background: "none", border: "none", color: t.text, fontFamily: SANS, fontSize: 14, outline: "none" }} />
        {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", color: t.mute, cursor: "pointer", padding: 4 }}><X size={15} /></button>}
      </div>

      {grouped.length === 0 && <p style={{ fontSize: 13, color: t.mute }}>Nothing matches that. Try a muscle name like "back".</p>}

      {grouped.map(([muscle, list]) => (
        <div key={muscle} style={{ marginBottom: 18 }}>
          <Label t={t} color={muscle === focusMuscle ? t.live : t.mute}>{muscle}</Label>
          <div style={{ marginTop: 8 }}>
            {list.map((e) => {
              const on = e.id === currentId;
              return (
                <button key={e.id} onClick={() => onPick(e.id)} style={{
                  width: "100%", textAlign: "left", padding: "12px 13px", marginBottom: 6, borderRadius: 4, cursor: "pointer",
                  background: on ? `${t.brand}14` : t.panel, border: `1px solid ${on ? t.brand : t.line}`,
                  display: "flex", alignItems: "center", gap: 10, WebkitTapHighlightColor: "transparent",
                }}>
                  <span style={{ flex: 1, fontSize: 14, color: t.text, fontWeight: on ? 700 : 400 }}>{e.name}</span>
                  <Chip color={t.mute}>{e.equip}</Chip>
                  {on && <Check size={15} color={t.brand} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </Sheet>
  );
}

/* ============================================================
   SESSION BUILDER
   ============================================================ */
function Builder({ t, plan, unit = "kg", onSave, onResetToDefault, onClose }) {
  const [list, setList] = useState(plan.ex);
  const [open, setOpen] = useState(null);
  const [picking, setPicking] = useState(null); // index, or "add"

  const patch = (n, changes) => setList(list.map((it, k) => (k === n ? { ...it, ...changes } : it)));
  const move = (n, dir) => {
    const k = n + dir;
    if (k < 0 || k >= list.length) return;
    const next = [...list];
    [next[n], next[k]] = [next[k], next[n]];
    setList(next);
    setOpen(k);
  };
  const remove = (n) => { setList(list.filter((_, k) => k !== n)); setOpen(null); };

  const handlePick = (id) => {
    if (picking === "add") setList([...list, S(id, 3, 8, 12, 120)]);
    else patch(picking, { ex: id });
    setPicking(null);
  };

  const totalSets = list.reduce((a, it) => a + it.sets, 0);
  const estMin = Math.round(list.reduce((a, it) => a + it.sets * (it.rest + 45), 0) / 60);

  const volume = useMemo(() => {
    const m = {};
    list.forEach((it) => {
      const g = EX[it.ex]?.muscle || "Other";
      m[g] = (m[g] || 0) + it.sets;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [list]);

  return (
    <>
      <Sheet
        t={t}
        title={`Build · ${plan.name}`}
        subtitle={`${list.length} exercises · ${totalSets} sets · about ${estMin} min`}
        onClose={onClose}
        footer={
          <>
            <Action t={t} filled onClick={() => onSave(list)}><Check size={15} /> Save this session</Action>
            <button onClick={onResetToDefault} style={{
              width: "100%", marginTop: 8, padding: 12, background: "none", border: `1px solid ${t.line}`,
              color: t.mute, fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
              borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}><RotateCcw size={12} /> Restore the default session</button>
          </>
        }
      >
        {list.map((it, n) => {
          const ex = EX[it.ex];
          const isOpen = open === n;
          return (
            <Panel t={t} key={`${it.ex}-${n}`} style={{ marginBottom: 7, borderColor: isOpen ? t.brand : t.line }}>
              <button onClick={() => setOpen(isOpen ? null : n)} style={{
                width: "100%", textAlign: "left", padding: 13, background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, WebkitTapHighlightColor: "transparent",
              }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: t.mute, width: 18, flexShrink: 0 }}>{pad2(n + 1)}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 14, color: t.text, fontWeight: 600 }}>{ex.name}</span>
                  <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: t.mute, marginTop: 3 }}>
                    {ex.muscle} · {ex.equip}
                  </span>
                </span>
                <span style={{ flexShrink: 0, textAlign: "right" }}>
                  <span style={{ display: "block", fontFamily: MONO, fontSize: 11, color: t.brand }}>{it.sets}×{it.lo}-{it.hi}</span>
                  {it.w > 0 && <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: t.live, marginTop: 3 }}>{it.w}{unit}</span>}
                </span>
                <ChevronRight size={14} color={t.mute} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 150ms ease" }} />
              </button>

              {isOpen && (
                <div style={{ padding: "0 13px 13px", borderTop: `1px solid ${t.line}` }}>
                  <div style={{ display: "flex", gap: 6, margin: "12px 0 14px" }}>
                    <button onClick={() => setPicking(n)} style={miniBtn(t, t.live)}><Shuffle size={13} /> Swap</button>
                    <button onClick={() => move(n, -1)} style={miniBtn(t, t.mute)} aria-label="Move up"><ChevronUp size={14} /></button>
                    <button onClick={() => move(n, 1)} style={miniBtn(t, t.mute)} aria-label="Move down"><ChevronDown size={14} /></button>
                    <button onClick={() => remove(n)} style={miniBtn(t, t.hot)} aria-label="Remove"><Trash2 size={13} /></button>
                  </div>
                  <Gauge t={t} compact label="Sets" value={it.sets} min={1} max={6} step={1} suffix="sets" onChange={(v) => patch(n, { sets: v })} />
                  <Gauge t={t} compact label={it.w ? "Starting weight" : "Starting weight · auto"} value={it.w || 0} min={0} max={260} step={2.5} fine={1.25} suffix={it.w ? unit : "auto"} onChange={(v) => patch(n, { w: v })} color={t.brand} />
                  <p style={{ fontFamily: MONO, fontSize: 9, color: t.mute, letterSpacing: "0.06em", lineHeight: 1.7, margin: "-4px 0 12px" }}>
                    {it.w
                      ? `THE FIRST SET LOADS AT ${it.w}${unit.toUpperCase()} UNTIL YOU HAVE LOGGED THIS LIFT ONCE.`
                      : "LEAVE AT ZERO AND THE SLIDER USES YOUR LAST SESSION INSTEAD."}
                  </p>
                  <Gauge t={t} compact label="Min reps" value={it.lo} min={1} max={25} step={1} suffix="reps" onChange={(v) => patch(n, { lo: v, hi: Math.max(v, it.hi) })} color={t.live} />
                  <Gauge t={t} compact label="Max reps" value={it.hi} min={1} max={30} step={1} suffix="reps" onChange={(v) => patch(n, { hi: v, lo: Math.min(v, it.lo) })} color={t.live} />
                  <Gauge t={t} compact label="Rest" value={it.rest} min={30} max={240} step={15} suffix="sec" onChange={(v) => patch(n, { rest: v })} color={t.mute} />
                  <p style={{ fontFamily: SANS, fontSize: 12, color: t.mute, lineHeight: 1.55, margin: "4px 0 0" }}>{ex.cue}</p>
                </div>
              )}
            </Panel>
          );
        })}

        <button onClick={() => setPicking("add")} style={{
          width: "100%", padding: 14, marginTop: 4, marginBottom: 20, background: "none",
          border: `1px dashed ${t.line}`, color: t.brand, fontFamily: MONO, fontSize: 11,
          letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: 4, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, WebkitTapHighlightColor: "transparent",
        }}><Plus size={14} /> Add exercise</button>

        <Label t={t}>Sets by muscle in this session</Label>
        <div style={{ marginTop: 10 }}>
          {volume.map(([m, n]) => (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: t.mute, width: 108, flexShrink: 0 }}>{m}</span>
              <div style={{ flex: 1, height: 5, background: t.panel2, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (n / 10) * 100)}%`, height: "100%", background: n > 10 ? t.hot : t.brand }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: n > 10 ? t.hot : t.brand, width: 18, textAlign: "right" }}>{n}</span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: MONO, fontSize: 9, color: t.mute, marginTop: 12, lineHeight: 1.7, letterSpacing: "0.06em" }}>
          MORE THAN ABOUT 10 SETS FOR ONE MUSCLE IN A SINGLE SESSION IS MOSTLY WASTED. SPREAD IT ACROSS THE WEEK INSTEAD.
        </p>
      </Sheet>

      {picking !== null && (
        <Picker t={t} currentId={picking === "add" ? null : list[picking]?.ex} onPick={handlePick} onClose={() => setPicking(null)} />
      )}
    </>
  );
}
const miniBtn = (t, c) => ({
  flex: 1, padding: "10px 0", background: `${c}14`, border: `1px solid ${c}66`, color: c,
  fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 3,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, WebkitTapHighlightColor: "transparent",
});

/* ============================================================
   SESSION
   ============================================================ */
function Session({ t, plan, logs, unit, onFinish, onClose }) {
  const [items, setItems] = useState(plan.ex);
  const [i, setI] = useState(0);
  const [done, setDone] = useState({});
  const [rest, setRest] = useState(0);
  const [restTotal, setRestTotal] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [editing, setEditing] = useState(null);
  const [picking, setPicking] = useState(false);

  const item = items[i];
  const ex = EX[item.ex];
  const sets = done[item.ex] || [];
  const prev = useMemo(() => lastSession(logs, item.ex), [logs, item.ex]);
  const pr = useMemo(() => bestE1rm(logs, item.ex), [logs, item.ex]);

  const seedFor = useCallback((n) => {
    if (prev && prev.sets[n]) return prev.sets[n];
    if (prev && prev.sets.length) return prev.sets[prev.sets.length - 1];
    return { w: item.w > 0 ? item.w : 20, r: item.hi, rir: 2 };
  }, [prev, item.hi, item.w]);

  const [w, setW] = useState(() => seedFor(0).w);
  const [r, setR] = useState(() => seedFor(0).r);
  const [rir, setRir] = useState(() => seedFor(0).rir ?? 2);
  const load = (v) => { setW(v.w); setR(v.r); setRir(v.rir ?? 2); };

  useEffect(() => { load(seedFor((done[item.ex] || []).length)); setEditing(null); setRest(0); }, [i, item.ex]); // eslint-disable-line
  useEffect(() => { const x = setInterval(() => setElapsed((e) => e + 1), 1000); return () => clearInterval(x); }, []);
  useEffect(() => {
    if (rest <= 0) return;
    const x = setInterval(() => setRest((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(x);
  }, [rest > 0]); // eslint-disable-line

  const complete = sets.length >= item.sets && editing === null;
  const isLast = i === items.length - 1;
  const beatsPr = pr > 0 && e1rm(w, r) > pr;

  const commit = () => {
    const next = [...sets];
    if (editing !== null) next[editing] = { w, r, rir };
    else next.push({ w, r, rir });
    setDone({ ...done, [item.ex]: next });
    if (editing !== null) { setEditing(null); load(seedFor(next.length)); }
    else if (next.length < item.sets) { setRest(item.rest); setRestTotal(item.rest); load(seedFor(next.length)); }
  };
  const removeSet = () => {
    const next = sets.filter((_, n) => n !== editing);
    setDone({ ...done, [item.ex]: next });
    setEditing(null);
    load(seedFor(next.length));
  };
  const startEdit = (n) => { setEditing(n); load(sets[n]); setRest(0); };

  /* Machine occupied: replace this slot for today only. Anything already
     logged stays recorded against the original exercise. */
  const swapCurrent = (id) => {
    setItems(items.map((it, k) => (k === i ? { ...it, ex: id } : it)));
    setPicking(false);
    setRest(0);
  };

  const totalSets = items.reduce((a, e) => a + e.sets, 0);
  const doneSets = Object.values(done).reduce((a, v) => a + v.length, 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: t.void, zIndex: 50, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <Label t={t} color={t.brand}>{plan.name}</Label>
          <div style={{ fontFamily: MONO, fontSize: 11, color: t.mute, marginTop: 3 }}>
            {pad2(i + 1)}/{pad2(items.length)} · {doneSets}/{totalSets} sets · {clock(elapsed)}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: t.mute, cursor: "pointer", padding: 8 }} aria-label="Close session"><X size={22} /></button>
      </div>
      <div style={{ height: 2, background: t.panel2, flexShrink: 0 }}>
        <div style={{ width: `${(doneSets / totalSets) * 100}%`, height: "100%", background: t.brand, boxShadow: `0 0 10px ${t.brand}`, transition: "width 250ms ease" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {rest > 0 ? (
          <div style={{ textAlign: "center", padding: "14px 0 22px" }}>
            <Label t={t} color={t.live}>Rest</Label>
            <div style={{ fontFamily: MONO, fontSize: 82, fontWeight: 700, color: t.live, lineHeight: 1, letterSpacing: "-0.04em", textShadow: `0 0 44px ${t.live}55`, margin: "10px 0 14px" }}>
              {clock(rest)}
            </div>
            <div style={{ height: 4, background: t.panel2, borderRadius: 2, overflow: "hidden", marginBottom: 18 }}>
              <div style={{ width: `${(rest / restTotal) * 100}%`, height: "100%", background: t.live, transition: "width 900ms linear" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Action t={t} color={t.mute} style={{ padding: 11 }} onClick={() => { setRest((s) => s + 30); setRestTotal((x) => x + 30); }}>+30s</Action>
              <Action t={t} color={t.live} style={{ padding: 11 }} onClick={() => setRest(0)}><SkipForward size={14} /> Ready</Action>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 14, background: `${t.live}12`, border: `1px solid ${t.live}55`, borderRadius: 3 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", color: t.live, flexShrink: 0 }}>LAST</span>
            {prev ? (
              <>
                <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: t.text }}>
                  {prev.sets.map((s) => `${s.w}×${s.r}`).join("  ")}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: t.mute, marginLeft: "auto", flexShrink: 0 }}>{prev.date.slice(5)}</span>
              </>
            ) : (
              <span style={{ fontFamily: MONO, fontSize: 13, color: t.mute }}>First time. Set a baseline.</span>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <Chip color={t.brand}>{ex.muscle}</Chip>
          <Chip color={t.mute}>{ex.equip}</Chip>
          <Chip color={t.mute}>{item.sets} × {item.lo}-{item.hi}</Chip>
        </div>
        <h2 style={{ fontFamily: SANS, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: t.text, margin: "0 0 14px", lineHeight: 1.08 }}>{ex.name}</h2>

        <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
          {Array.from({ length: Math.max(item.sets, sets.length) }).map((_, n) => {
            const rec = sets[n];
            const isEditing = editing === n;
            const active = !rec && n === sets.length && editing === null;
            const c = isEditing ? t.hot : rec ? (rec.rir === 0 ? t.hot : t.brand) : active ? t.live : t.line;
            return (
              <button key={n} onClick={() => rec && startEdit(n)} disabled={!rec} style={{
                flex: 1, padding: "8px 2px", borderRadius: 3, cursor: rec ? "pointer" : "default",
                border: `1px solid ${c}`, background: rec || active ? `${c}16` : "transparent", WebkitTapHighlightColor: "transparent",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 8, color: t.mute, letterSpacing: "0.1em" }}>{isEditing ? "EDIT" : `SET ${n + 1}`}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, marginTop: 2, color: rec ? c : active ? t.live : t.mute }}>
                  {rec ? `${rec.w}×${rec.r}` : "—"}
                </div>
              </button>
            );
          })}
        </div>

        {/* machine occupied */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <button onClick={() => setPicking(true)} style={{
            background: `${t.live}14`, border: `1px solid ${t.live}66`, color: t.live, fontFamily: MONO, fontSize: 10,
            letterSpacing: "0.16em", textTransform: "uppercase", padding: "9px 12px", borderRadius: 3, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7, WebkitTapHighlightColor: "transparent",
          }}><Shuffle size={12} /> Machine taken</button>
          {!isLast && (
            <button onClick={() => setI(i + 1)} style={{
              background: "none", border: `1px solid ${t.line}`, color: t.mute, fontFamily: MONO, fontSize: 10,
              letterSpacing: "0.16em", textTransform: "uppercase", padding: "9px 12px", borderRadius: 3, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7, WebkitTapHighlightColor: "transparent",
            }}><CornerDownRight size={12} /> Come back later</button>
          )}
        </div>

        <Reveal t={t} icon={<Info size={12} />} label="Cue">
          <p style={{ fontFamily: SANS, fontSize: 13, color: t.mute, margin: 0, lineHeight: 1.55 }}>{ex.cue}</p>
        </Reveal>

        {sets.length > 0 && (
          <p style={{ fontFamily: MONO, fontSize: 9, color: t.mute, letterSpacing: "0.1em", lineHeight: 1.7, marginBottom: 10 }}>
            SWAPPING NOW KEEPS THE {sets.length} SET{sets.length > 1 ? "S" : ""} ALREADY LOGGED HERE.
          </p>
        )}

        {!complete && rest === 0 && (
          <div style={{ marginTop: 6 }}>
            <Gauge t={t} label={`Weight (${unit})`} value={w} min={0} max={260} step={2.5} fine={1.25} suffix={unit} onChange={setW} color={t.brand} />
            <Gauge t={t} label="Reps" value={r} min={1} max={30} step={1} suffix="reps" onChange={setR} color={t.text} />

            {beatsPr && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", marginBottom: 12, border: `1px solid ${t.hot}`, background: `${t.hot}14`, borderRadius: 3 }}>
                <Trophy size={14} color={t.hot} />
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: t.hot }}>PERSONAL RECORD PACE</span>
              </div>
            )}

            <Label t={t}>Reps left in the tank</Label>
            <div style={{ display: "flex", gap: 6, margin: "8px 0 18px" }}>
              {[0, 1, 2, 3].map((v) => {
                const on = rir === v;
                const c = v === 0 ? t.hot : t.brand;
                return (
                  <button key={v} onClick={() => setRir(v)} style={{
                    flex: 1, padding: "13px 0", borderRadius: 3, cursor: "pointer",
                    border: `1px solid ${on ? c : t.line}`, background: on ? `${c}1A` : "transparent",
                    color: on ? c : t.mute, fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", fontWeight: on ? 700 : 400,
                    WebkitTapHighlightColor: "transparent",
                  }}>{v === 0 ? "FAIL" : v}</button>
                );
              })}
            </div>

            <Action t={t} filled color={editing !== null ? t.live : t.brand} onClick={commit}>
              {editing !== null ? <><Pencil size={15} /> Save set {editing + 1}</> : <><Check size={15} /> Log set {sets.length + 1}</>}
            </Action>
            {editing !== null && (
              <button onClick={removeSet} style={{
                width: "100%", marginTop: 8, padding: 12, background: "none", border: `1px solid ${t.line}`,
                color: t.hot, fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}><Trash2 size={13} /> Delete this set</button>
            )}
          </div>
        )}

        {complete && rest === 0 && (
          <div style={{ marginTop: 6 }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: t.mute, letterSpacing: "0.12em", marginBottom: 12, lineHeight: 1.7 }}>
              ALL SETS IN. TAP ANY SET ABOVE TO CORRECT IT BEFORE MOVING ON.
            </p>
            <Action t={t} filled color={isLast ? t.hot : t.brand} onClick={() => (isLast ? onFinish(done, elapsed) : setI(i + 1))}>
              {isLast ? <><Flame size={15} /> Finish session</> : <>Next · {EX[items[i + 1].ex].name}</>}
            </Action>
          </div>
        )}
      </div>

      {picking && <Picker t={t} currentId={item.ex} onPick={swapCurrent} onClose={() => setPicking(false)} />}
    </div>
  );
}

/* ---------------- sauna ---------------- */
function Sauna({ t, minutes, onClose }) {
  const [s, setS] = useState(minutes * 60);
  useEffect(() => { const x = setInterval(() => setS((v) => (v <= 0 ? 0 : v - 1)), 1000); return () => clearInterval(x); }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: t.void, zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Label t={t} color={t.hot}>Sauna · 90 to 95 degrees</Label>
      <div style={{ fontFamily: MONO, fontSize: 80, fontWeight: 700, color: t.hot, textShadow: `0 0 46px ${t.hot}55`, margin: "14px 0", lineHeight: 1, letterSpacing: "-0.04em" }}>{clock(s)}</div>
      <div style={{ width: "100%", maxWidth: 320, height: 4, background: t.panel2, borderRadius: 2, overflow: "hidden", marginBottom: 22 }}>
        <div style={{ width: `${(s / (minutes * 60)) * 100}%`, height: "100%", background: t.hot, transition: "width 900ms linear" }} />
      </div>
      <p style={{ fontFamily: SANS, fontSize: 13, color: t.mute, textAlign: "center", maxWidth: 300, marginBottom: 22, lineHeight: 1.55 }}>
        Heat does not blunt muscle protein synthesis. Cold does. Water with salt in it on the way out.
      </p>
      <div style={{ width: "100%", maxWidth: 320 }}><Action t={t} color={t.mute} onClick={onClose}>Done</Action></div>
    </div>
  );
}

/* ---------------- calendar ---------------- */
const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
function stampFor(dow, startTime, minutes) {
  const [hh, mm] = startTime.split(":").map(Number);
  const d = new Date(); d.setHours(hh, mm, 0, 0);
  d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7));
  const end = new Date(d.getTime() + minutes * 60000);
  const f = (x) => `${x.getFullYear()}${pad2(x.getMonth() + 1)}${pad2(x.getDate())}T${pad2(x.getHours())}${pad2(x.getMinutes())}00`;
  return { start: f(d), end: f(end) };
}
function buildICS(days, startTime, sauna, walk, custom) {
  const dur = walk * 2 + 60 + sauna;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FlowFindrFitness//EN", "CALSCALE:GREGORIAN"];
  const add = (title, dow, minutes, desc) => {
    const { start, end } = stampFor(dow, startTime, minutes);
    lines.push("BEGIN:VEVENT", `UID:${title.replace(/\W/g, "")}-${dow}@flowfindrfitness`, `DTSTART:${start}`, `DTEND:${end}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[dow]}`, `SUMMARY:${title}`, `DESCRIPTION:${desc}`, "END:VEVENT");
  };
  templates(days).forEach((s) => {
    const names = exercisesFor(days, s.id, custom).map((it) => EX[it.ex].name).join(", ");
    add(`Gym · ${s.name}`, s.day, dur, `${s.focus}. ${names}. Includes ${walk} min walk each way and ${sauna} min sauna.`);
  });
  add("5k run", RUN_DAY[days], 30, "Easy to moderate. Kept away from leg day on purpose.");
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
const gcalLink = (title, dow, startTime, minutes, desc) => {
  const { start, end } = stampFor(dow, startTime, minutes);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(desc)}&recur=${encodeURIComponent(`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[dow]}`)}`;
};

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [tab, setTab] = useState("train");
  const [settings, setSettings] = useState(DEFAULTS);
  const [logs, setLogs] = useState({});
  const [custom, setCustom] = useState({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [building, setBuilding] = useState(null);
  const [sauna, setSauna] = useState(false);
  const [now, setNow] = useState(new Date());

  /* Keep the clock honest across midnight and long idle periods. */
  useEffect(() => {
    const x = setInterval(() => setNow(new Date()), 30000);
    const onShow = () => setNow(new Date());
    document.addEventListener("visibilitychange", onShow);
    return () => { clearInterval(x); document.removeEventListener("visibilitychange", onShow); };
  }, []);

  useEffect(() => {
    (async () => {
      const s = (await store.get("fff:settings")) ?? (await store.get("neonrack:settings"));
      const l = (await store.get("fff:logs")) ?? (await store.get("neonrack:logs"));
      const c = await store.get("fff:custom");
      if (s) setSettings({ ...DEFAULTS, ...s });
      if (l) setLogs(l);
      if (c) setCustom(c);
      setLoading(false);
    })();
  }, []);

  const t = THEMES[settings.theme] || THEMES["ultraviolet-circuit"];
  const saveSettings = (n) => { setSettings(n); store.set("fff:settings", n); };
  const saveLogs = (n) => { setLogs(n); store.set("fff:logs", n); };
  const saveCustom = (n) => { setCustom(n); store.set("fff:custom", n); };

  const finish = (entries, elapsed) => {
    saveLogs({ ...logs, [todayKey(new Date())]: { sessionId: running.id, name: running.name, entries, elapsed } });
    setRunning(null); setSauna(true);
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#06070F" }} />;

  const shared = { t, settings, custom, now };

  return (
    <div style={{ minHeight: "100vh", background: t.void, color: t.text, paddingBottom: 78, fontFamily: SANS }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${t.line}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(0deg, transparent 0 3px, ${t.brand}06 3px 4px)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, position: "relative" }}>
          <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, letterSpacing: "0.2em", color: t.brand, textShadow: `0 0 22px ${t.brand}55` }}>FLOWFINDR</span>
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: t.live }}>FITNESS</span>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: t.mute, marginLeft: "auto" }}>{settings.days}D / WK</span>
        </div>
      </div>

      {tab === "train" && (
        <Train {...shared} logs={logs}
          onStart={(p) => setRunning(p)}
          onBuild={(p) => setBuilding(p)}
          onSauna={() => setSauna(true)} />
      )}
      {tab === "progress" && <ProgressTab t={t} logs={logs} settings={settings} />}
      {tab === "program" && (
        <ProgramTab {...shared} save={saveSettings}
          onBuild={(p) => setBuilding(p)}
          onReset={() => saveLogs({})} />
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: t.panel, borderTop: `1px solid ${t.line}`, display: "flex", zIndex: 40 }}>
        {[
          { k: "train", label: "Train", Icon: Dumbbell },
          { k: "progress", label: "Progress", Icon: Activity },
          { k: "program", label: "Program", Icon: SlidersHorizontal },
        ].map(({ k, label, Icon }) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: "12px 0 16px", background: "none", border: "none",
            borderTop: `2px solid ${tab === k ? t.brand : "transparent"}`,
            color: tab === k ? t.brand : t.mute, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, WebkitTapHighlightColor: "transparent",
          }}>
            <Icon size={20} />
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase" }}>{label}</span>
          </button>
        ))}
      </div>

      {running && <Session t={t} plan={running} logs={logs} unit={settings.unit} onFinish={finish} onClose={() => setRunning(null)} />}
      {building && (
        <Builder t={t} plan={building} unit={settings.unit}
          onSave={(list) => { saveCustom({ ...custom, [building.id]: list }); setBuilding(null); }}
          onResetToDefault={() => {
            const next = { ...custom }; delete next[building.id];
            saveCustom(next); setBuilding(null);
          }}
          onClose={() => setBuilding(null)} />
      )}
      {sauna && <Sauna t={t} minutes={settings.sauna} onClose={() => setSauna(false)} />}
    </div>
  );
}

/* ---------------- TRAIN ---------------- */
function Train({ t, settings, custom, logs, now, onStart, onBuild, onSauna }) {
  const [choosing, setChoosing] = useState(false);
  const dow = now.getDay();
  const scheduled = planForDow(settings.days, dow, custom);
  const doneToday = logs[todayKey(now)];
  const isRunDay = RUN_DAY[settings.days] === dow;
  const upcoming = nextTraining(settings.days, custom);

  const dur = settings.walk * 2 + 60 + settings.sauna;
  const endTime = addMinutes(settings.startTime, dur);

  const volume = useMemo(() => {
    const m = {};
    Object.keys(logs).forEach((d) => {
      if ((now - new Date(d)) / 86400000 >= 7) return;
      Object.entries(logs[d].entries || {}).forEach(([id, sets]) => {
        const g = EX[id]?.muscle || "Other";
        m[g] = (m[g] || 0) + sets.length;
      });
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [logs, now]);

  const weekCount = Object.keys(logs).filter((d) => (now - new Date(d)) / 86400000 < 7).length;

  const SessionCard = ({ plan, tag, tagColor }) => (
    <Panel t={t} style={{ padding: 20 }}>
      <Label t={t} color={tagColor || t.live}>{tag}</Label>
      <h2 style={{ fontSize: 32, fontWeight: 800, margin: "8px 0 4px", letterSpacing: "-0.035em", lineHeight: 1.04 }}>{plan.name}</h2>
      <div style={{ fontSize: 13, color: t.mute, marginBottom: 14 }}>{plan.focus}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: t.live }}>{settings.startTime}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: t.mute }}>→</span>
        <span style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: t.live }}>{endTime}</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: t.mute, marginLeft: "auto" }}>{dur} MIN DOOR TO DOOR</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        {plan.ex.map((it, n) => {
          const prev = lastSession(logs, it.ex);
          return (
            <div key={it.ex + n} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${t.line}`, alignItems: "baseline" }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: t.mute, width: 18, flexShrink: 0 }}>{pad2(n + 1)}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{EX[it.ex].name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: prev ? t.live : it.w > 0 ? t.brand : t.mute, flexShrink: 0 }}>
                {prev ? `${prev.sets[0].w}${settings.unit}` : it.w > 0 ? `${it.w}${settings.unit}` : "new"}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: t.brand, flexShrink: 0, width: 46, textAlign: "right" }}>{it.sets}×{it.lo}-{it.hi}</span>
            </div>
          );
        })}
      </div>
      <Action t={t} filled onClick={() => onStart(plan)}><Play size={16} /> Start session</Action>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Action t={t} color={t.live} style={{ padding: 12 }} onClick={() => onBuild(plan)}><Wrench size={14} /> Set up</Action>
        <Action t={t} color={t.mute} style={{ padding: 12 }} onClick={() => setChoosing(true)}><Repeat size={14} /> Switch</Action>
      </div>
    </Panel>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <Label t={t} color={t.text}>{longDate(now)}</Label>
        <Label t={t}>{partOfDay(now.getHours())} · {weekCount}/{settings.days}</Label>
      </div>

      {doneToday ? (
        <>
          <Panel t={t} style={{ padding: 20, borderColor: `${t.brand}66` }}>
            <Label t={t} color={t.brand}>Logged today</Label>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: "8px 0 6px", letterSpacing: "-0.03em" }}>{doneToday.name}</h2>
            <div style={{ fontFamily: MONO, fontSize: 12, color: t.mute, marginBottom: 16 }}>
              {Object.values(doneToday.entries).reduce((a, v) => a + v.length, 0)} sets · {clock(doneToday.elapsed || 0)}
            </div>
            <Action t={t} color={t.hot} onClick={onSauna}><Flame size={15} /> Sauna timer</Action>
          </Panel>
          <div style={{ marginTop: 8 }}>
            <Action t={t} color={t.mute} onClick={() => setChoosing(true)}><Repeat size={14} /> Train something else</Action>
          </div>
        </>
      ) : scheduled ? (
        <SessionCard plan={scheduled} tag="On the schedule today" />
      ) : (
        <>
          <Panel t={t} style={{ padding: 20, borderColor: isRunDay ? `${t.live}55` : t.line }}>
            <Label t={t} color={isRunDay ? t.live : t.mute}>{isRunDay ? "Run day" : "Rest day"}</Label>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: "8px 0 6px", letterSpacing: "-0.035em" }}>
              {isRunDay ? "5 kilometres" : "No session scheduled"}
            </h2>
            <p style={{ fontSize: 13, color: t.mute, lineHeight: 1.55, margin: 0 }}>
              {isRunDay
                ? "One run a week is negligible interference. It sits away from leg day because running stacks eccentric damage on top of squats."
                : "Eat, sleep seven to nine hours, hit your protein. Growth happens here, not in the gym."}
            </p>
            {upcoming && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.line}` }}>
                <Label t={t}>Next up</Label>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 7 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{upcoming.plan.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: t.live }}>
                    {DOW_SHORT[upcoming.date.getDay()]} {settings.startTime}
                  </span>
                </div>
              </div>
            )}
          </Panel>
          <div style={{ marginTop: 8 }}>
            <Action t={t} color={t.brand} onClick={() => setChoosing(true)}><Dumbbell size={15} /> Train anyway</Action>
          </div>
        </>
      )}

      {volume.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <Label t={t}>Sets this week</Label>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: t.mute }}>TARGET 10-20</span>
          </div>
          {volume.map(([muscle, n]) => {
            const c = n >= 10 && n <= 20 ? t.brand : n > 20 ? t.hot : t.mute;
            return (
              <div key={muscle} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: t.mute, width: 100, flexShrink: 0 }}>{muscle}</span>
                <div style={{ flex: 1, height: 6, background: t.panel2, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (n / 20) * 100)}%`, height: "100%", background: c, boxShadow: `0 0 8px ${c}77` }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: c, width: 20, textAlign: "right" }}>{n}</span>
              </div>
            );
          })}
        </div>
      )}

      {choosing && (
        <Sheet t={t} title="Pick a session" subtitle={`Any session, any day · ${longDate(now)}`} onClose={() => setChoosing(false)}>
          {templates(settings.days).map((tpl) => {
            const p = planFor(settings.days, tpl.id, custom);
            const edited = !!custom[tpl.id];
            return (
              <Panel t={t} key={tpl.id} style={{ padding: 15, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{p.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: t.mute }}>{DOW_SHORT[tpl.day].toUpperCase()}</span>
                  {edited && <Chip color={t.live}>Custom</Chip>}
                </div>
                <div style={{ fontSize: 12, color: t.mute, margin: "5px 0 11px" }}>
                  {p.ex.length} exercises · {p.ex.reduce((a, x) => a + x.sets, 0)} sets
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <Action t={t} filled style={{ padding: 11 }} onClick={() => { setChoosing(false); onStart(p); }}><Play size={14} /> Start</Action>
                  <Action t={t} color={t.live} style={{ padding: 11 }} onClick={() => { setChoosing(false); onBuild(p); }}><Wrench size={14} /> Set up</Action>
                </div>
              </Panel>
            );
          })}
        </Sheet>
      )}
    </div>
  );
}

/* ---------------- PROGRESS ---------------- */
function ProgressTab({ t, logs, settings }) {
  const dates = Object.keys(logs).sort();
  const exIds = useMemo(() => {
    const s = new Set();
    dates.forEach((d) => Object.keys(logs[d].entries || {}).forEach((k) => s.add(k)));
    return [...s];
  }, [logs]);
  const [sel, setSel] = useState("");
  useEffect(() => { if (!sel && exIds.length) setSel(exIds[0]); }, [exIds]); // eslint-disable-line

  const series = useMemo(() => (
    sel ? dates.filter((d) => logs[d].entries?.[sel]).map((d) => ({
      date: d.slice(5),
      e1rm: Math.round(Math.max(...logs[d].entries[sel].map((s) => e1rm(s.w, s.r)))),
    })) : []
  ), [sel, logs]);

  if (!dates.length) {
    return (
      <div style={{ padding: 16 }}>
        <Panel t={t} style={{ padding: 26, textAlign: "center" }}>
          <Label t={t}>Nothing logged yet</Label>
          <p style={{ fontSize: 13, color: t.mute, marginTop: 10, lineHeight: 1.55 }}>
            Finish one session and this fills with your estimated one-rep max per lift, plus a session history.
          </p>
        </Panel>
      </div>
    );
  }

  const tick = { fill: t.mute, fontSize: 10, fontFamily: MONO };
  return (
    <div style={{ padding: 16 }}>
      <Label t={t}>Strength trend</Label>
      <select value={sel} onChange={(e) => setSel(e.target.value)} style={{
        width: "100%", margin: "8px 0 10px", padding: "12px 10px", background: t.panel,
        border: `1px solid ${t.line}`, color: t.text, fontFamily: MONO, fontSize: 12, borderRadius: 3,
      }}>
        {exIds.map((id) => <option key={id} value={id}>{EX[id]?.name || id}</option>)}
      </select>
      <Panel t={t} style={{ padding: "16px 6px 6px" }}>
        <ResponsiveContainer width="100%" height={195}>
          <LineChart data={series} margin={{ left: -16, right: 12 }}>
            <CartesianGrid stroke={t.line} />
            <XAxis dataKey="date" tick={tick} axisLine={{ stroke: t.line }} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.brand}66`, borderRadius: 3, fontFamily: MONO, fontSize: 11, color: t.text }} />
            <Line type="monotone" dataKey="e1rm" stroke={t.brand} strokeWidth={2} dot={{ fill: t.brand, r: 3 }} name={`Est. 1RM (${settings.unit})`} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
      <p style={{ fontFamily: MONO, fontSize: 9, color: t.mute, margin: "10px 0 24px", lineHeight: 1.7, letterSpacing: "0.06em" }}>
        EPLEY ESTIMATE. FLAT FOR THREE WEEKS MEANS ADD A SET, OR CHECK SLEEP AND CALORIES.
      </p>

      <Label t={t}>History</Label>
      <div style={{ marginTop: 10 }}>
        {[...dates].reverse().map((d) => {
          const s = logs[d];
          const n = Object.values(s.entries || {}).reduce((a, v) => a + v.length, 0);
          const day = DOW_SHORT[new Date(d).getDay()];
          return (
            <Panel t={t} key={d} style={{ padding: 13, marginBottom: 7, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: t.mute, width: 26, flexShrink: 0 }}>{day}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: t.live, width: 42, flexShrink: 0 }}>{d.slice(5)}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: t.mute }}>{n} sets · {clock(s.elapsed || 0)}</span>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- PROGRAM ---------------- */
function ProgramTab({ t, settings, custom, now, save, onBuild, onReset }) {
  const [confirm, setConfirm] = useState(false);
  const dur = settings.walk * 2 + 60 + settings.sauna;
  const endTime = addMinutes(settings.startTime, dur);
  const todayDow = now.getDay();

  const download = () => {
    const blob = new Blob([buildICS(settings.days, settings.startTime, settings.sauna, settings.walk, custom)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "flowfindr-fitness.ics"; a.click();
  };

  return (
    <div style={{ padding: 16 }}>
      <Label t={t}>Split</Label>
      <p style={{ fontSize: 12, color: t.mute, margin: "6px 0 12px", lineHeight: 1.55 }}>
        Three is full body A, B and C. Four is upper and lower twice. Five is push, pull, legs, upper, lower.
        Every option trains each muscle roughly twice a week.
      </p>
      <Gauge t={t} label="Sessions per week" value={settings.days} min={3} max={5} step={1} suffix="days" onChange={(v) => save({ ...settings, days: v })} />

      <div style={{ marginTop: 18, marginBottom: 26 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => {
          const tpl = templates(settings.days).find((s) => s.day === d);
          const p = tpl ? planFor(settings.days, tpl.id, custom) : null;
          const run = RUN_DAY[settings.days] === d;
          const isToday = d === todayDow;
          return (
            <Panel t={t} key={d} style={{
              padding: 13, marginBottom: 7, opacity: p || run ? 1 : 0.45,
              borderColor: isToday ? t.live : t.line,
              boxShadow: isToday ? `0 0 18px ${t.live}22` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: isToday ? t.live : t.mute, letterSpacing: "0.18em", width: 30 }}>{DOW_SHORT[d].toUpperCase()}</span>
                <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{p ? p.name : run ? "5k run" : "Rest"}</span>
                {isToday && <Chip color={t.live}>Today</Chip>}
                {custom[tpl?.id] && <Chip color={t.brand}>Custom</Chip>}
                {run && <Footprints size={14} color={t.live} />}
              </div>
              {p && (
                <>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: t.live, marginTop: 7 }}>
                    {settings.startTime} → {endTime}
                    <span style={{ color: t.mute, marginLeft: 8 }}>{dur} min</span>
                  </div>
                  <div style={{ marginTop: 9 }}>
                    {p.ex.map((it, n) => (
                      <div key={it.ex + n} style={{ display: "flex", gap: 8, padding: "5px 0", alignItems: "baseline" }}>
                        <span style={{ flex: 1, fontSize: 13, color: t.text }}>{EX[it.ex].name}</span>
                        {it.w > 0 && <span style={{ fontFamily: MONO, fontSize: 10, color: t.live }}>{it.w}{settings.unit}</span>}
                        <Chip color={t.mute}>{EX[it.ex].equip}</Chip>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: t.brand, width: 50, textAlign: "right" }}>{it.sets}×{it.lo}-{it.hi}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
                    <button onClick={() => onBuild(p)} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9,
                      letterSpacing: "0.14em", textTransform: "uppercase", color: t.brand, background: `${t.brand}14`,
                      border: `1px solid ${t.brand}66`, padding: "8px 11px", borderRadius: 3, cursor: "pointer",
                    }}><Wrench size={12} /> Set up this session</button>
                    <a href={gcalLink(`Gym · ${p.name}`, tpl.day, settings.startTime, dur, p.focus)} target="_blank" rel="noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9,
                      letterSpacing: "0.14em", textTransform: "uppercase", color: t.live, textDecoration: "none",
                      border: `1px solid ${t.live}55`, padding: "8px 11px", borderRadius: 3,
                    }}><CalendarPlus size={12} /> Calendar</a>
                  </div>
                </>
              )}
            </Panel>
          );
        })}
        <Action t={t} color={t.live} onClick={download}><CalendarPlus size={15} /> Download whole week (.ics)</Action>
      </div>

      <Label t={t}>Logistics</Label>
      <div style={{ margin: "10px 0 16px" }}>
        <Label t={t}>Start time</Label>
        <input type="time" value={settings.startTime} onChange={(e) => save({ ...settings, startTime: e.target.value })} style={{
          width: "100%", marginTop: 6, padding: "13px 10px", background: t.panel, border: `1px solid ${t.line}`,
          color: t.text, fontFamily: MONO, fontSize: 16, borderRadius: 3,
        }} />
      </div>
      <Gauge t={t} label="Sauna" value={settings.sauna} min={0} max={30} step={5} suffix="min" onChange={(v) => save({ ...settings, sauna: v })} color={t.hot} />
      <Gauge t={t} label="Walk each way" value={settings.walk} min={0} max={30} step={5} suffix="min" onChange={(v) => save({ ...settings, walk: v })} color={t.live} />
      <Panel t={t} style={{ padding: 15, marginBottom: 26 }}>
        <Label t={t}>Block out</Label>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: t.brand }}>{settings.startTime}</span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: t.mute }}>→</span>
          <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: t.brand }}>{endTime}</span>
        </div>
        <div style={{ fontSize: 12, color: t.mute, marginTop: 6 }}>
          {settings.walk} min walk, 60 min lift, {settings.sauna} min sauna, {settings.walk} min walk back. {dur} minutes total.
        </div>
      </Panel>

      <Label t={t}>Theme</Label>
      <div style={{ margin: "10px 0 26px" }}>
        {Object.entries(THEMES).map(([id, th]) => {
          const on = settings.theme === id;
          return (
            <button key={id} onClick={() => save({ ...settings, theme: id })} style={{
              width: "100%", textAlign: "left", padding: 13, marginBottom: 7, borderRadius: 5, cursor: "pointer",
              background: th.panel, border: `1px solid ${on ? th.brand : t.line}`,
              boxShadow: on ? `0 0 22px ${th.brand}33` : "none", WebkitTapHighlightColor: "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: th.text, flex: 1 }}>{th.name}</span>
                {[th.brand, th.live, th.hot].map((c) => (
                  <span key={c} style={{ width: 15, height: 15, background: c, borderRadius: 2, boxShadow: `0 0 8px ${c}88` }} />
                ))}
                {on && <Check size={15} color={th.brand} />}
              </div>
              <div style={{ fontSize: 11, color: th.mute, marginTop: 5 }}>{th.note}</div>
            </button>
          );
        })}
      </div>

      <Action t={t} color={confirm ? t.hot : t.mute} onClick={() => (confirm ? (onReset(), setConfirm(false)) : setConfirm(true))}>
        <RotateCcw size={14} /> {confirm ? "Tap again to erase everything" : "Clear training history"}
      </Action>
    </div>
  );
}
