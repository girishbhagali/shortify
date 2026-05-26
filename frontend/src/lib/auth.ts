import { supabase } from './supabase';

// ─── Google OAuth ────────────────────────────────
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    },
  });
  return { data, error };
}

// ─── Phone OTP ───────────────────────────────────
export async function signInWithPhone(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  return { data, error };
}

export async function verifyPhoneOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  return { data, error };
}

// ─── Email OTP ───────────────────────────────────
export async function signInWithEmailOtp(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  return { data, error };
}

export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  return { data, error };
}

// ─── Email + Password ────────────────────────────
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });
  return { data, error };
}

// ─── Password Reset ─────────────────────────────
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?type=recovery`,
  });
  return { data, error };
}

// ─── Session ─────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
