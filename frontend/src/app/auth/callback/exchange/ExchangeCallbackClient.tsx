"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function ExchangeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#534AB7] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Completing sign in...</p>
      </div>
    </div>
  );
}

export interface ExchangeCallbackClientProps {
  code?: string;
  type?: string;
}

export default function ExchangeCallbackClient({ code, type }: ExchangeCallbackClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      router.replace("/login");
      return;
    }

    const exchangeCode = async () => {
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Code exchange failed:", exchangeError.message);
          setError(exchangeError.message);
          setTimeout(() => router.replace("/login"), 3000);
          return;
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
        if (projectRef) {
          const cookieName = `sb-${projectRef}-auth-token`;
          const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
          document.cookie = `${cookieName}=true; expires=${expires}; path=/; SameSite=Lax`;
        }

        await new Promise((r) => setTimeout(r, 200));

        if (type === "recovery") {
          router.replace("/login");
        } else {
          router.replace("/dashboard");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        console.error("Exchange error:", err);
        setError(message);
        setTimeout(() => router.replace("/login"), 3000);
      }
    };

    exchangeCode();
  }, [code, type, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-2">Authentication Error</p>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <ExchangeLoading />;
}
