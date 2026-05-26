import { createClient, SupabaseClient } from '@supabase/supabase-js';

// WARNING: Hardcoding keys here exposes them to the browser! It's highly recommended to use .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _stubWarningLogged = false;

const createSafeClient = (url: string, key: string, options?: any) => {
  if (!url || !key) {
    if (!_stubWarningLogged) {
      _stubWarningLogged = true;
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        console.log(
          '%c[ShortifyAI] Supabase not configured — running in offline/demo mode. ' +
          'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable auth.',
          'color: #534AB7; font-weight: bold;'
        );
      }
    }
    return new Proxy({} as any, {
      get: (_target, prop) => {
        if (prop === 'auth') {
          return {
            signUp: async () => ({ data: null, error: new Error('supabase_not_configured') }),
            signInWithPassword: async () => ({ data: null, error: new Error('supabase_not_configured') }),
            signInWithOAuth: async () => ({ data: { url: null }, error: new Error('supabase_not_configured') }),
            signInWithOtp: async () => ({ data: null, error: new Error('supabase_not_configured') }),
            verifyOtp: async () => ({ data: null, error: new Error('supabase_not_configured') }),
            resetPasswordForEmail: async () => ({ data: null, error: new Error('supabase_not_configured') }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signOut: async () => ({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
          };
        }
        if (prop === 'from') {
          return () => ({
            insert: async () => ({ data: null, error: new Error('supabase_not_configured') }),
            select: () => ({ order: async () => ({ data: [], error: null }) }),
          });
        }
        return () => ({ data: null, error: new Error('supabase_not_configured') });
      },
    });
  }
  return createClient(url, key, options);
};

// Next.js HMR safe singleton pattern
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
  supabaseAdmin: SupabaseClient | undefined;
};

// Public client for the browser
export const supabase = globalForSupabase.supabase ?? createSafeClient(supabaseUrl, supabaseAnonKey);

// Admin client ONLY for the server
export const supabaseAdmin = typeof window === 'undefined' 
  ? (globalForSupabase.supabaseAdmin ?? createSafeClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }))
  : ({} as SupabaseClient); // Dummy object for the browser so it doesn't crash if accidentally imported

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
  if (typeof window === 'undefined') {
    globalForSupabase.supabaseAdmin = supabaseAdmin;
  }
}
