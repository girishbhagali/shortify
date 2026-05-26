"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = [
    { label: "At least 8 characters", test: password.length >= 8 },
    { label: "One uppercase letter", test: /[A-Z]/.test(password) },
    { label: "One number", test: /[0-9]/.test(password) },
    { label: "One special character", test: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.test).length;
  const labels = ["", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = ["", "#DC2626", "#F59E0B", "#10B981", "#534AB7"];
  const bgColors = ["", "#FEE2E2", "#FEF3C7", "#D1FAE5", "#EDE9FE"];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2.5 pt-2"
    >
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: score >= level ? colors[score] : "#E5E7EB",
              }}
            />
          ))}
        </div>
        <p
          className="text-[11px] font-semibold transition-colors"
          style={{ color: colors[score] }}
        >
          {labels[score]}
        </p>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        {checks.map((check, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-[11px] transition-colors"
            style={{ color: check.test ? "#10B981" : "#9CA3AF" }}
          >
            {check.test ? (
              <Check className="w-3 h-3" strokeWidth={3} />
            ) : (
              <X className="w-3 h-3" strokeWidth={3} />
            )}
            <span className={check.test ? "font-medium" : ""}>{check.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
