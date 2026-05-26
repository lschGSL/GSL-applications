import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Exact allowlist of production origins authorised as SSO / post-login redirect
// targets. No wildcards: every new app must be added explicitly to this list.
const ALLOWED_REDIRECT_ORIGINS = [
  "https://apps.gsl.lu",
  "https://bank.gsl.lu",
  "https://news.gsl.lu",
  "https://gsl-applications.vercel.app",
  "https://gsl-bank-extractor.vercel.app",
  "https://gsl-agent-fiscal.vercel.app",
];

export function isAllowedRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (process.env.NODE_ENV === "development") {
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return true;
      }
    }

    if (parsed.protocol !== "https:") return false;
    return ALLOWED_REDIRECT_ORIGINS.includes(parsed.origin);
  } catch {
    return false;
  }
}

export function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}
