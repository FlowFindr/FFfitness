/* ---------------- auth ---------------- */
/* Thin wrapper so no component ever imports supabase. Every function resolves
   rather than throws: a logged-out or offline app is a normal state, not an
   error the user should see. */

import { supabase } from "./client";

export const authAvailable = () => supabase !== null;

export const currentUser = async () => {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
};

export const signUp = async (email, password, displayName) => {
  if (!supabase) return { user: null, error: "no backend configured" };
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName ?? null } },
    });
    return { user: data?.user ?? null, error: error?.message ?? null };
  } catch (e) {
    return { user: null, error: e?.message ?? "sign-up failed" };
  }
};

export const signIn = async (email, password) => {
  if (!supabase) return { user: null, error: "no backend configured" };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data?.user ?? null, error: error?.message ?? null };
  } catch (e) {
    return { user: null, error: e?.message ?? "sign-in failed" };
  }
};

export const signOut = async () => {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    /* already gone as far as the user is concerned */
  }
};

export const resetPassword = async (email) => {
  if (!supabase) return { error: "no backend configured" };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/index.html`,
    });
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e?.message ?? "reset failed" };
  }
};

/* Returns an unsubscribe function. */
export const onAuthChange = (fn) => {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => fn(session?.user ?? null));
  return () => data?.subscription?.unsubscribe();
};
