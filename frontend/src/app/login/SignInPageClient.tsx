"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Play, Send
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { signInWithEmail, resetPassword } from "@/lib/auth";
import AuthBrandingPanel from "@/components/auth/AuthBrandingPanel";
import GoogleButton from "@/components/auth/GoogleButton";
import EmailOTPInput from "@/components/auth/EmailOTPInput";

function resolveRedirectPath(redirectTo?: string): string {
  if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }
  return "/dashboard";
}

export interface SignInPageClientProps {
  authError?: string;
  redirectTo?: string;
}

export default function SignInPageClient({ authError, redirectTo }: SignInPageClientProps) {
  const router = useRouter();
  const afterLoginPath = resolveRedirectPath(redirectTo);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successState, setSuccessState] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (authError) {
      setErrorMsg(`Google sign-in failed: ${authError}`);
      toast.error("Google sign-in failed. Try email login instead.");
    }
  }, [authError]);

  const navigateAfterLogin = () => {
    router.push(afterLoginPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("wrong")) {
          setErrorMsg("Wrong password. Check your credentials or reset below.");
        } else if (error.message.toLowerCase().includes("many")) {
          setErrorMsg("Too many tries. Wait 5 minutes before trying again.");
        } else {
          throw error;
        }
        return;
      }

      setSuccessState(true);
      const userName = data?.user?.user_metadata?.full_name || "there";
      toast.success(`Welcome back, ${userName}! 🎉`);
      setTimeout(navigateAfterLogin, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);

    try {
      const { error } = await resetPassword(resetEmail);

      if (error && error.message === "supabase_not_configured") {
        setResetSent(true);
        setResetLoading(false);
        return;
      }

      if (error) throw error;
      setResetSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleEmailSuccess = () => {
    toast.success("Welcome back! 🎉");
    setTimeout(navigateAfterLogin, 1200);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Toaster position="top-center" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center"
        >
          {resetSent ? (
            <>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl mb-6"
              >
                ✉️
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox!</h2>
              <p className="text-sm text-gray-500 mb-1">We sent a reset link to</p>
              <p className="text-sm font-semibold text-[#534AB7] mb-4">{resetEmail}</p>
              <p className="text-xs text-gray-400 mb-8">
                Didn&apos;t receive it? Check spam or resend
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setResetSent(false);
                    handleResetPassword({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  className="w-full py-2.5 border-2 border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white rounded-xl text-sm font-semibold transition-all"
                >
                  Resend Email
                </button>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setResetEmail("");
                  }}
                  className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-[#F3F1FF] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-7 h-7 text-[#534AB7]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we&apos;ll send you a reset link
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-0.5 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10 transition-all">
                  <Mail className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm py-2.5 outline-none text-gray-800 placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #534AB7, #0284C7)" }}
                >
                  {resetLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                ← Back to Sign In
              </button>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      <Toaster position="top-center" />
      <AuthBrandingPanel />
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#534AB7] via-[#0284C7] to-[#534AB7]" />
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[#534AB7] rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">ShortifyAI</span>
            </Link>
          </div>
          <div className="text-right mb-6 text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-[#534AB7] hover:underline">
              Sign up
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Welcome back 👋</h2>
            <p className="text-sm text-gray-500 mb-7">Sign in to your ShortifyAI account</p>
            <GoogleButton />
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="signin-email" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Email Address
                </label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-0.5 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10 transition-all">
                  <Mail className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    placeholder="girish@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    suppressHydrationWarning
                    className="flex-1 bg-transparent border-none text-sm py-2.5 outline-none text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="signin-password" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(email);
                    }}
                    suppressHydrationWarning
                    className={`text-[11px] font-semibold transition-colors ${
                      errorMsg ? "text-[#DC2626] animate-pulse" : "text-[#534AB7] hover:text-[#534AB7]/80"
                    }`}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-0.5 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10 transition-all">
                  <Lock className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    suppressHydrationWarning
                    className="flex-1 bg-transparent border-none text-sm py-2.5 outline-none text-gray-800 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    suppressHydrationWarning
                    className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="submit"
                disabled={loading || successState}
                suppressHydrationWarning
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 ${
                  successState
                    ? "bg-green-500 text-white shadow-green-500/20"
                    : "text-white shadow-[#534AB7]/20"
                }`}
                style={!successState ? { background: "linear-gradient(135deg, #534AB7, #0284C7)" } : undefined}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : successState ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Success!</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">or use email pin</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <EmailOTPInput title="Sign in with Email OTP" onSuccess={handleEmailSuccess} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
