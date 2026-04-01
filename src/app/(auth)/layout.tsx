"use client";

import { LanguageSelector } from "@/components/layout/language-selector";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#141617]">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
      <footer className="flex items-center justify-center pb-6">
        <LanguageSelector />
      </footer>
    </div>
  );
}
