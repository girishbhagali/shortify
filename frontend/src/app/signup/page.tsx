"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Play
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { signUpWithEmail } from "@/lib/auth";
import AuthBrandingPanel from "@/components/auth/AuthBrandingPanel";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordStrength from "@/components/auth/PasswordStrength";
import EmailOTPInput from "@/components/auth/EmailOTPInput";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  // Validation
  const nameValid = name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const formReady = nameValid && emailValid && passwordValid && passwordsMatch && agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReady) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await signUpWithEmail(name, email, password);



      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          setErrorMsg("Email already in use. Try signing in instead.");
        } else {
          throw error;
        }
        return;
      }

      setShowVerifyEmail(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSuccess = () => {
    toast.success("Email verified! Redirecting...", { icon: "🎉" });
    setTimeout(() => router.push("/onboarding"), 1200);
  };

  // ─── Verify Email Screen ──────────────────────
  if (showVerifyEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Toaster position="top-center" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl mb-6"
          >
            ✉️
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
          <p className="text-sm text-gray-500 mb-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-semibold text-[#534AB7] mb-6">{email}</p>
          <p className="text-xs text-gray-400 mb-8">
            Click the link in the email to activate your account
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                toast.success("Verification email resent!");
              }}
              className="w-full py-2.5 border-2 border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              Resend verification email
            </button>
            <button
              onClick={() => {
                setShowVerifyEmail(false);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Change email address
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main Sign Up Page ────────────────────────
  return (
    <div className="min-h-screen flex bg-white">
      <Toaster position="top-center" />

      {/* Left — Branding Panel */}
      <AuthBrandingPanel />

      {/* Right — Form Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto relative">
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#534AB7] via-[#0284C7] to-[#534AB7]" />

        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[#534AB7] rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">ShortifyAI</span>
            </Link>
          </div>

          {/* Top toggle */}
          <div className="text-right mb-6 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#534AB7] hover:underline">
              Sign in
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Create your account</h2>
            <p className="text-sm text-gray-500 mb-7">Start free, no credit card needed</p>

            {/* Google Button */}
            <GoogleButton />

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Full Name
                </label>
                <div className={`flex items-center bg-gray-50 border rounded-xl px-3.5 py-0.5 transition-all ${
                  name && !nameValid ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10"
                }`}>
                  <User className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder="Girish Bhagli"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    suppressHydrationWarning
                    className="flex-1 bg-transparent border-none text-sm py-2.5 outline-none text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                {name && !nameValid && (
                  <p className="text-[11px] text-red-500 font-medium">Min 2 characters, letters only</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Email Address
                </label>
                <div className={`flex items-center bg-gray-50 border rounded-xl px-3.5 py-0.5 transition-all ${
                  email && !emailValid ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10"
                }`}>
                  <Mail className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="girish@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    suppressHydrationWarning
                    className="flex-1 bg-transparent border-none text-sm py-2.5 outline-none text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                {email && !emailValid && (
                  <p className="text-[11px] text-red-500 font-medium">Enter a valid email address</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Password
                </label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-0.5 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10 transition-all">
                  <Lock className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create a password"
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
                <AnimatePresence>
                  {password && <PasswordStrength password={password} />}
                </AnimatePresence>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="signup-confirm" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Confirm Password
                </label>
                <div className={`flex items-center bg-gray-50 border rounded-xl px-3.5 py-0.5 transition-all ${
                  confirmPassword && !passwordsMatch ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10"
                }`}>
                  <Lock className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                  <input
                    id="signup-confirm"
                    type="password"
                    required
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    suppressHydrationWarning
                    className="flex-1 bg-transparent border-none text-sm py-2.5 outline-none text-gray-800 placeholder:text-gray-400"
                  />
                  {confirmPassword && (
                    <div className="ml-2">
                      {passwordsMatch ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4.5 h-4.5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-red-500 font-medium">Passwords do not match</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#534AB7] focus:ring-[#534AB7]/20 accent-[#534AB7] cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <a href="#" target="_blank" className="text-[#534AB7] hover:underline font-semibold">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" target="_blank" className="text-[#534AB7] hover:underline font-semibold">Privacy Policy</a>
                </label>
              </div>

              {/* Error */}
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !formReady}
                suppressHydrationWarning
                className="w-full py-3 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#534AB7]/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #534AB7, #0284C7)" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider — Email OTP */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">or use email pin</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <EmailOTPInput title="Sign up with Email OTP" onSuccess={handleEmailSuccess} />

          </motion.div>
        </div>
      </div>
    </div>
  );
}
