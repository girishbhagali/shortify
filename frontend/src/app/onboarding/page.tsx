"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, PartyPopper, Sparkles } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const STEP_1_OPTIONS = [
  { emoji: "🎬", label: "YouTuber" },
  { emoji: "📸", label: "Instagram Creator" },
  { emoji: "🎵", label: "TikToker" },
  { emoji: "💼", label: "Business/Brand" },
  { emoji: "🛠", label: "Developer" },
  { emoji: "🎓", label: "Student" },
];

const STEP_2_OPTIONS = [
  { emoji: "📺", label: "YouTube → Shorts" },
  { emoji: "🎙", label: "Podcast clips" },
  { emoji: "📚", label: "Course content" },
  { emoji: "🛍", label: "Product videos" },
  { emoji: "🎉", label: "Event highlights" },
  { emoji: "✨", label: "Other" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [useCase, setUseCase] = useState("");

  const handleFinish = (takeTour: boolean) => {
    // Save preferences
    if (typeof window !== "undefined") {
      localStorage.setItem("shortify_onboarding", JSON.stringify({ role, useCase }));
      localStorage.setItem("shortify_onboarding_done", "true");
    }
    toast.success("Welcome to ShortifyAI! 🎉");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative">
      <Toaster position="top-center" />

      {/* Subtle bg */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#F3F1FF_0%,_white_60%)] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                s === step ? "w-10 bg-[#534AB7]" : s < step ? "w-6 bg-[#534AB7]/40" : "w-6 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── Step 1 ─── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-14 h-14 bg-[#F3F1FF] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-7 h-7 text-[#534AB7]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
              <p className="text-sm text-gray-500 mb-8">What best describes you?</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {STEP_1_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setRole(opt.label)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 text-sm font-medium transition-all active:scale-[0.97] ${
                      role === opt.label
                        ? "border-[#534AB7] bg-[#F3F1FF] text-[#534AB7]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!role}
                className="mx-auto flex items-center gap-2 py-3 px-8 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #534AB7, #0284C7)" }}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ─── Step 2 ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-14 h-14 bg-[#E0F2FE] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What will you mainly create?</h2>
              <p className="text-sm text-gray-500 mb-8">Choose your primary content type</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {STEP_2_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setUseCase(opt.label)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 text-sm font-medium transition-all active:scale-[0.97] ${
                      useCase === opt.label
                        ? "border-[#0284C7] bg-[#E0F2FE] text-[#0284C7]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="py-3 px-6 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!useCase}
                  className="flex items-center gap-2 py-3 px-8 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #534AB7, #0284C7)" }}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3 — All Set ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                className="text-7xl mb-6"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">You&apos;re all set!</h2>
              <p className="text-sm text-gray-500 mb-2">
                Welcome to ShortifyAI,{" "}
                <span className="font-semibold text-[#534AB7]">{role}</span>!
              </p>
              <p className="text-sm text-gray-400 mb-10">
                We&apos;ve personalized your experience for{" "}
                <span className="font-semibold text-gray-600">{useCase}</span> content.
              </p>

              <div className="space-y-3 max-w-xs mx-auto">
                <button
                  onClick={() => handleFinish(true)}
                  className="w-full py-3 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#534AB7]/20"
                  style={{ background: "linear-gradient(135deg, #534AB7, #0284C7)" }}
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>Take 2-min Tour</span>
                </button>
                <button
                  onClick={() => handleFinish(false)}
                  className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all active:scale-[0.98]"
                >
                  Skip, go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
