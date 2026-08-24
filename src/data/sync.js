/* ---------------- background sync ---------------- */
/* localStorage stays the source of truth. Nothing here is ever awaited by a
   user action: writes land in a queue and drain when there is signal. A failed
   request means "carry on locally", never an error the user sees. */

import { supabase } from "./client";
import { currentUser } from "./auth";

const QUEUE_KEY = "fff:queue";

const readQueue = () => {
  try {
    const v = window.localStorage.getItem(QUEUE_KEY);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
};

const writeQueue = (q) => {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* storage full or unavailable; the local state is still correct */
  }
};

/* One pending op per (table, key). Logging six sets in a row should leave one
   row to push, not six. */
const enqueue = (op) => {
  const q = readQueue().filter((o) => !(o.table === op.table && o.key === op.key));
  q.push(op);
  writeQueue(q);
  flush();
};

export const queueSettings = (settings) =>
  enqueue({ table: "profiles", key: "me", op: "upsert", value: settings });

export const queueWorkout = (dateKey, entry) =>
  enqueue({ table: "workouts", key: dateKey, op: "upsert", value: entry });

export const queueWorkoutDelete = (dateKey) =>
  enqueue({ table: "workouts", key: dateKey, op: "delete", value: null });

export const queuePlan = (templateId, exercises) =>
  enqueue({ table: "plans", key: templateId, op: "upsert", value: exercises });

export const queuePlanDelete = (templateId) =>
  enqueue({ table: "plans", key: templateId, op: "delete", value: null });

const applyOp = async (userId, op) => {
  if (op.table === "profiles") {
    return supabase
      .from("profiles")
      .upsert({ user_id: userId, settings: op.value, updated_at: new Date().toISOString() },
              { onConflict: "user_id" });
  }
  if (op.table === "workouts") {
    if (op.op === "delete") {
      return supabase.from("workouts").delete().eq("user_id", userId).eq("date", op.key);
    }
    const e = op.value ?? {};
    return supabase.from("workouts").upsert(
      {
        user_id: userId,
        date: op.key,
        session_id: e.sessionId ?? null,
        name: e.name ?? null,
        entries: e.entries ?? [],
        elapsed: e.elapsed ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" },
    );
  }
  if (op.op === "delete") {
    return supabase.from("plans").delete().eq("user_id", userId).eq("key", op.key);
  }
  return supabase.from("plans").upsert(
    { user_id: userId, key: op.key, data: op.value, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" },
  );
};

let flushing = false;

/* Drains what it can and leaves the rest for the next attempt. Never throws. */
export const flush = async () => {
  if (!supabase || flushing) return;
  const queued = readQueue();
  if (queued.length === 0) return;

  flushing = true;
  try {
    const user = await currentUser();
    if (!user) return;

    const failed = [];
    for (const op of queued) {
      try {
        const { error } = await applyOp(user.id, op);
        if (error) failed.push(op);
      } catch {
        failed.push(op);
      }
    }
    writeQueue(failed);
  } catch {
    /* offline, paused project, expired token: the queue survives untouched */
  } finally {
    flushing = false;
  }
};

/* Rebuilds settings / logs / custom in the exact shapes src/App.jsx expects.
   Returns null when there is nothing to say, so the caller keeps local state. */
export const pull = async () => {
  if (!supabase) return null;
  try {
    const user = await currentUser();
    if (!user) return null;

    const [profile, workouts, plans] = await Promise.all([
      supabase.from("profiles").select("settings").eq("user_id", user.id).maybeSingle(),
      supabase.from("workouts").select("date, session_id, name, entries, elapsed").eq("user_id", user.id),
      supabase.from("plans").select("key, data").eq("user_id", user.id),
    ]);

    if (profile.error || workouts.error || plans.error) return null;

    const logs = {};
    for (const w of workouts.data ?? []) {
      logs[w.date] = { sessionId: w.session_id, name: w.name, entries: w.entries, elapsed: w.elapsed };
    }

    const custom = {};
    for (const p of plans.data ?? []) custom[p.key] = p.data;

    return { settings: profile.data?.settings ?? null, logs, custom };
  } catch {
    return null;
  }
};

/* One-time push of local history into a freshly created account. */
export const importLocal = ({ settings, logs, custom }) => {
  if (settings) queueSettings(settings);
  for (const [dateKey, entry] of Object.entries(logs ?? {})) queueWorkout(dateKey, entry);
  for (const [id, exercises] of Object.entries(custom ?? {})) queuePlan(id, exercises);
  return flush();
};

/* Drain on reconnect and on tab focus, the two moments signal tends to return. */
if (typeof window !== "undefined") {
  window.addEventListener("online", flush);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flush();
  });
}
