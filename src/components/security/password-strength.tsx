"use client";

import { validatePassword, getPasswordStrength } from "@/lib/password";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { errors } = validatePassword(password);
  const { score, label } = getPasswordStrength(password);

  const strengthColors = [
    "bg-destructive",
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  const rules = [
    { label: "At least 12 characters", test: password.length >= 12 },
    { label: "One uppercase letter", test: /[A-Z]/.test(password) },
    { label: "One lowercase letter", test: /[a-z]/.test(password) },
    { label: "One number", test: /[0-9]/.test(password) },
    { label: "One special character", test: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < score ? strengthColors[score - 1] : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Strength: <span className="font-medium">{label}</span>
        </p>
      </div>

      {/* Rules checklist */}
      <ul className="space-y-1">
        {rules.map((rule) => (
          <li key={rule.label} className="flex items-center gap-2 text-xs">
            {rule.test ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                rule.test
                  ? "text-green-600"
                  : "text-muted-foreground"
              )}
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
