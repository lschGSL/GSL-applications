"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MfaBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
            Secure your account with Two-Factor Authentication
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1">
            Protect your account by enabling 2FA. It only takes a minute and adds an extra layer of security.
          </p>
          <div className="mt-3">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950" asChild>
              <Link href="/settings/security">Enable 2FA now</Link>
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
