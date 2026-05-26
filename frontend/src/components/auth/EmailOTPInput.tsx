"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, MessageCircle } from "lucide-react";
import OTPBoxes from "./OTPBoxes";
import { signInWithEmailOtp, verifyEmailOtp } from "@/lib/auth";

interface EmailOTPInputProps {
  title?: string;
  onSuccess: () => void;
}

export default function EmailOTPInput({
  title = "Sign in with Email OTP",
  onSuccess,
}: EmailOTPInputProps) {
  const [email, setEmail] = useState("");
  
  const [otpSent, setOtpSent]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!email || !email.includes("@")) {
      setErrorMsg("Enter a valid email address");
      return;
    }
    setSending(true);
    setErrorMsg("");

    try {
      const { error } = await signInWithEmailOtp(email);
      if (error) throw error;
      setOtpSent(true);
      setCountdown(60);
    } catch (err: any) {
      console.error("Email OTP Error:", err);
      setErrorMsg(err.message || "Could not send OTP. Try again later.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setVerifying(true);
    setOtpError(false);
    setErrorMsg("");

    try {
      const { error } = await verifyEmailOtp(email, otp);
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      console.error("Email OTP Verification Error:", err);
      setOtpError(true);
      setErrorMsg("Invalid or expired OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setOtpError(false);
    setErrorMsg("");
    handleSendOTP();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <MessageCircle className="w-4 h-4 text-emerald-500" />
        <span>{title}</span>
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
          Free
        </span>
      </div>

      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10 transition-all min-h-[44px]">
        <Mail className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          suppressHydrationWarning
          className="flex-1 bg-transparent border-none text-sm py-3 outline-none text-gray-800 placeholder:text-gray-400"
          disabled={otpSent}
        />
      </div>

      {!otpSent ? (
        <button
          type="button"
          onClick={handleSendOTP}
          disabled={sending || !email.includes("@")}
          suppressHydrationWarning
          className="w-full py-3 border-2 border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] min-h-[44px]"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Send Email OTP</span>
            </>
          )}
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Mail className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                OTP sent to{" "}
                <span className="font-semibold text-gray-700">{email}</span>
                <span className="text-emerald-500 ml-1">✓</span>
              </span>
              <button
                type="button"
                onClick={() => { setOtpSent(false); }}
                className="text-[#534AB7] font-semibold hover:underline ml-1"
              >
                Change
              </button>
            </div>

            <OTPBoxes onComplete={handleVerifyOTP} error={otpError} />

            {verifying && (
              <div className="flex items-center justify-center gap-2 text-sm text-[#534AB7]">
                <div className="w-4 h-4 border-2 border-[#534AB7]/30 border-t-[#534AB7] rounded-full animate-spin" />
                <span className="font-medium">Verifying...</span>
              </div>
            )}

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-xs text-gray-400">
                  Resend OTP in{" "}
                  <span className="font-semibold text-gray-600">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-xs text-[#534AB7] font-semibold hover:underline"
                >
                  Resend Email OTP
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-500 font-medium text-center"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
