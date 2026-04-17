"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ShieldCheck, ShieldAlert, HelpCircle, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type Status = "protected" | "public" | "misconfigured" | "unknown";

interface AppHealth {
  id: string;
  name: string;
  slug: string;
  url: string;
  icon: string | null;
  securityStatus: Status;
  lastSecurityScan: string | null;
  activeUsers: number;
  errorCount24h: number;
  errorRate: number;
  isActive: boolean;
}

const STATUS_META: Record<Status, { icon: typeof ShieldCheck; color: string; bg: string }> = {
  protected: {
    icon: ShieldCheck,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  public: {
    icon: XCircle,
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  misconfigured: {
    icon: ShieldAlert,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800/40",
  },
};

export function AppHealthMatrix() {
  const { t } = useI18n();
  const [apps, setApps] = useState<AppHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/security/app-health", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setApps(json.applications ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const scan = async (app: AppHealth) => {
    setScanning(app.id);
    try {
      await fetch("/api/admin/security/scan-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: app.id, url: app.url }),
      });
      await load();
    } finally {
      setScanning(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          {t("security.apps.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("security.apps.empty")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => {
              const meta = STATUS_META[app.securityStatus];
              const StatusIcon = meta.icon;
              return (
                <div
                  key={app.id}
                  className="rounded-lg border p-4 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {app.icon && (
                        <img src={app.icon} alt="" className="h-8 w-8 rounded" />
                      )}
                      <div>
                        <h3 className="font-medium text-sm">{app.name}</h3>
                        <p className="text-xs text-muted-foreground">{app.slug}</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${meta.bg} ${meta.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {t(`security.apps.status.${app.securityStatus}`)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{t("security.apps.activeUsers")}</p>
                      <p className="font-semibold tabular-nums">{app.activeUsers}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("security.apps.errors24h")}</p>
                      <p className="font-semibold tabular-nums">{app.errorCount24h}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("security.apps.errorRate")}</p>
                      <p className="font-semibold tabular-nums">{app.errorRate}%</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {app.lastSecurityScan
                        ? new Date(app.lastSecurityScan).toLocaleDateString()
                        : t("security.apps.neverScanned")}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => scan(app)}
                      disabled={scanning === app.id}
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      {scanning === app.id ? t("security.apps.scanning") : t("security.apps.scanNow")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
