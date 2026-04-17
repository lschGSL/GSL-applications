"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Bell, CheckCircle, Filter } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type Severity = "low" | "medium" | "high" | "critical";

interface Alert {
  id: string;
  type: string;
  severity: Severity;
  title: string | null;
  description: string | null;
  timestamp: string;
  resolved: boolean;
  user: { name: string | null; email: string } | null;
  app: { name: string; slug: string } | null;
  ip: string | null;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  low: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const REFRESH_MS = 30_000;

function translateType(type: string, t: (k: string) => string): string {
  const key = `security.alerts.type.${type}`;
  const translated = t(key);
  return translated === key ? type.replace(/_/g, " ") : translated;
}

export function SecurityAlertsStream() {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (severityFilter !== "all") params.set("severity", severityFilter);
    if (unresolvedOnly) params.set("unresolved", "true");
    try {
      const res = await fetch(`/api/admin/security/alerts?${params}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setAlerts(json.alerts ?? []);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, unresolvedOnly]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const resolve = async (id: string, resolved: boolean) => {
    await fetch("/api/admin/security/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved }),
    });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {t("security.alerts.title")}
        </CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSeverityFilter(s);
                  setPage(1);
                }}
                className={`rounded-md px-2 py-1 text-xs transition ${
                  severityFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {t(`security.alerts.severity.${s}`)}
              </button>
            ))}
          </div>
          <label className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={unresolvedOnly}
              onChange={(e) => {
                setUnresolvedOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-input"
            />
            {t("security.alerts.unresolvedOnly")}
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {loading && alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("security.alerts.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => {
              const Icon =
                a.severity === "critical" || a.severity === "high"
                  ? AlertTriangle
                  : AlertCircle;
              return (
                <li
                  key={a.id}
                  className={`rounded-lg border p-3 ${
                    a.resolved ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={SEVERITY_COLORS[a.severity]} variant="secondary">
                            {t(`security.alerts.severity.${a.severity}`)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {translateType(a.type, t)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium">{a.title ?? a.type}</p>
                        {a.description && (
                          <p className="text-xs text-muted-foreground">{a.description}</p>
                        )}
                        {(a.user || a.app || a.ip) && (
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {a.user && <span>{a.user.email}</span>}
                            {a.app && <span>· {a.app.name}</span>}
                            {a.ip && <span className="font-mono">· {a.ip}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolve(a.id, !a.resolved)}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {a.resolved
                        ? t("security.alerts.reopen")
                        : t("security.alerts.markResolved")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("common.previous")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t("common.page")} {page} {t("common.of")} {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
