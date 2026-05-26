"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface OTPBoxesProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: boolean;
}

export default function OTPBoxes({ length = 6, onComplete, error = false }: OTPBoxesProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Shake animation on error
  const [shake, setShake] = useState(false);
  useEffect(() => {
    if (error) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }, [error]);

  const handleChange = (index: number, value: string) => {
    // Handle paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, length).split("");
      const newValues = [...values];
      digits.forEach((d, i) => {
        if (index + i < length) newValues[index + i] = d;
      });
      setValues(newValues);
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      if (newValues.every((v) => v !== "")) {
        onComplete(newValues.join(""));
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== "")) {
      onComplete(newValues.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      const newValues = [...values];
      newValues[index - 1] = "";
      setValues(newValues);
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <motion.div
      className="flex gap-2 sm:gap-3 justify-center"
      animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          value={val}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
            ${error ? "border-red-400 bg-red-50 text-red-600" : val ? "border-[#534AB7] bg-[#F3F1FF]" : "border-gray-200 bg-white"}
            focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/20
          `}
        />
      ))}
    </motion.div>
  );
}
