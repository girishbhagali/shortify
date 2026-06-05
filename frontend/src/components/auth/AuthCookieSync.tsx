"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * AuthCookieSync — Syncs Supabase auth state to cookies.
 *
 * The Supabase JS client stores sessions in localStorage,
 * but Next.js middleware can only read cookies. This component
 * bridges the gap by setting/clearing a cookie whenever the
 * auth state changes.
 */
export default function AuthCookieSync() {
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

    if (!projectRef) return;

    const cookieName = `sb-${projectRef}-auth-token`;

    const setCookie = (name: string, value: string, days: number) => {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
    };

    const deleteCookie = (name: string) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    };

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCookie(cookieName, "true", 365);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session) {
            setCookie(cookieName, "true", 365);
          }
        } else if (event === "SIGNED_OUT") {
          deleteCookie(cookieName);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
