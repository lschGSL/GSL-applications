"use client";

import { useI18n } from "@/lib/i18n/context";
import { locales, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useState } from "react";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const current = locales.find((l) => l.value === locale);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
        title="Language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current?.flag}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-40 rounded-lg border bg-popover p-1 shadow-lg">
            {locales.map((l) => (
              <button
                key={l.value}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent ${
                  locale === l.value ? "bg-accent font-medium" : ""
                }`}
                onClick={() => {
                  setLocale(l.value as Locale);
                  setOpen(false);
                }}
              >
                <span>{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
