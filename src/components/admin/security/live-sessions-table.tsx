"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Globe, UserX } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface LiveSession {
  id: string;
  user: { id: string; name: string | null; email: string | null; avatar: string | null };
  app: { name: string; slug: string; icon: string | null } | null;
  ip: string | null;
  location: {
    country?: string | null;
    city?: string | null;
    flag_emoji?: string | null;
  } | null;
  duration: string;
  startedAt: string;
  lastActivity: string;
  isLive: boolean;
}

const REFRESH_MS = 15_000;

export function LiveSessionsTable() {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/security/live-sessions", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setSessions(json.sessions ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const terminate = async (session: LiveSession) => {
    if (!confirm(t("security.sessions.confirmTerminate"))) return;
    setTerminating(session.id);
    try {
      const res = await fetch("/api/admin/security/terminate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, userId: session.user.id, appSlug: session.app?.slug ?? null }),
      });
      if (res.ok) await load();
    } finally {
      setTerminating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t("security.sessions.title")}
          <Badge variant="secondary" className="ml-auto">
            {sessions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("security.sessions.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">{t("security.sessions.user")}</th>
                  <th className="pb-2 font-medium">{t("security.sessions.app")}</th>
                  <th className="pb-2 font-medium">{t("security.sessions.ip")}</th>
                  <th className="pb-2 font-medium">{t("security.sessions.location")}</th>
                  <th className="pb-2 font-medium">{t("security.sessions.duration")}</th>
                  <th className="pb-2 font-medium text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {s.isLive && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                          </span>
                        )}
                        <div>
                          <div className="font-medium">{s.user.name ?? s.user.email ?? "—"}</div>
                          {s.user.name && s.user.email && (
                            <div className="text-xs text-muted-foreground">{s.user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {s.app ? (
                        <Badge variant="outline">{s.app.name}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("security.sessions.portal")}</Badge>
                      )}
                    </td>
                    <td className="py-3 font-mono text-xs">{s.ip ?? "—"}</td>
                    <td className="py-3">
                      {s.location ? (
                        <span className="flex items-center gap-1 text-xs">
                          {s.location.flag_emoji && <span>{s.location.flag_emoji}</span>}
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {s.location.city ? `${s.location.city}, ` : ""}
                          {s.location.country ?? "—"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 tabular-nums">{s.duration}</td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => terminate(s)}
                        disabled={terminating === s.id}
                      >
                        <UserX className="mr-1 h-3 w-3" />
                        {t("security.sessions.terminate")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
