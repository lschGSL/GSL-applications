"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut } from "@/lib/auth/actions";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Show warning 2 minutes before

export function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const warningRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const countdownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const lastActivityRef = useRef(Date.now());

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(Math.ceil(WARNING_BEFORE_MS / 1000));
      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);

    timeoutRef.current = setTimeout(() => {
      signOut();
    }, SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];

    // Throttle to avoid excessive resets
    let throttled = false;
    function handleActivity() {
      if (throttled) return;
      throttled = true;
      setTimeout(() => {
        throttled = false;
      }, 10_000);
      resetTimers();
    }

    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimers]);

  if (!showWarning) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl border bg-background p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Session Expiring</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your session will expire in{" "}
          <span className="font-mono font-semibold text-destructive">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>{" "}
          due to inactivity.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={resetTimers}
            className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Stay Connected
          </button>
          <form action={signOut} className="flex-1">
            <button
              type="submit"
              className="w-full rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
