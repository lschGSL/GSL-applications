import type { GeoLocation } from "@/types/database";

export const SECURITY_THRESHOLDS = {
  FAILED_LOGINS_24H: 50,
  SUSPICIOUS_ACTIVITIES: 10,
  SESSION_DURATION_MAX_HOURS: 8,
  ERROR_RATE_MAX: 5,
  COMPLIANCE_SCORE_MIN: 85,
  ACTIVE_SESSION_WINDOW_MIN: 30,
} as const;

const FLAG_EMOJIS: Record<string, string> = {
  LU: "🇱🇺", FR: "🇫🇷", BE: "🇧🇪", DE: "🇩🇪", CH: "🇨🇭",
  GB: "🇬🇧", US: "🇺🇸", NL: "🇳🇱", IT: "🇮🇹", ES: "🇪🇸",
  PT: "🇵🇹", PL: "🇵🇱", IE: "🇮🇪", AT: "🇦🇹", CA: "🇨🇦",
};

export function flagForCountry(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  if (FLAG_EMOJIS[upper]) return FLAG_EMOJIS[upper];
  if (upper.length === 2) {
    const codePoints = [...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  }
  return null;
}

const geoCache = new Map<string, { data: GeoLocation; ts: number }>();
const GEO_TTL_MS = 24 * 60 * 60 * 1000;

export async function geoLookup(ip: string | null | undefined): Promise<GeoLocation | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.ts < GEO_TTL_MS) return cached.data;

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "GSL-Portal-Security/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
    const geo: GeoLocation = {
      country: json.country_name ?? null,
      country_code: json.country_code ?? null,
      city: json.city ?? null,
      region: json.region ?? null,
      lat: json.latitude ?? null,
      lng: json.longitude ?? null,
      flag_emoji: flagForCountry(json.country_code),
    };
    geoCache.set(ip, { data: geo, ts: Date.now() });
    return geo;
  } catch {
    return null;
  }
}

export function formatDuration(fromIso: string, toIso?: string): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const ms = Math.max(0, to - from);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function clientIpFromHeaders(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? null;
}

export async function scanAppSecurity(url: string): Promise<{
  status: "protected" | "public" | "misconfigured";
  httpStatus: number;
  redirectsToAuth: boolean;
  latencyMs: number;
}> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - started;
    const httpStatus = res.status;
    const location = res.headers.get("location") ?? "";
    const redirectsToAuth = /login|signin|auth|sso/i.test(location);

    if (httpStatus >= 300 && httpStatus < 400 && redirectsToAuth) {
      return { status: "protected", httpStatus, redirectsToAuth: true, latencyMs: latency };
    }
    if (httpStatus === 200) {
      return { status: "public", httpStatus, redirectsToAuth: false, latencyMs: latency };
    }
    if (httpStatus === 401 || httpStatus === 403) {
      return { status: "protected", httpStatus, redirectsToAuth: false, latencyMs: latency };
    }
    return {
      status: "misconfigured",
      httpStatus,
      redirectsToAuth,
      latencyMs: latency,
    };
  } catch {
    return {
      status: "misconfigured",
      httpStatus: 0,
      redirectsToAuth: false,
      latencyMs: Date.now() - started,
    };
  }
}
