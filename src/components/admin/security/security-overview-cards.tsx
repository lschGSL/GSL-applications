"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface Overview {
  activeSessions: number;
  failedLogins24h: number;
  suspiciousActivities: number;
  complianceScore: number;
  thresholds?: {
    FAILED_LOGINS_24H: number;
    SUSPICIOUS_ACTIVITIES: number;
    COMPLIANCE_SCORE_MIN: number;
  };
}

const REFRESH_MS = 30_000;

export function SecurityOverviewCards() {
  const { t } = useI18n();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/security/overview", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (active) setData(json);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const thresholds = data?.thresholds;
  const complianceOk =
    (data?.complianceScore ?? 0) >= (thresholds?.COMPLIANCE_SCORE_MIN ?? 85);
  const failedOk =
    (data?.failedLogins24h ?? 0) < (thresholds?.FAILED_LOGINS_24H ?? 50);
  const suspiciousOk =
    (data?.suspiciousActivities ?? 0) < (thresholds?.SUSPICIOUS_ACTIVITIES ?? 10);

  const cards = [
    {
      label: t("security.kpi.activeSessions"),
      value: data?.activeSessions ?? 0,
      icon: Users,
      color: "text-blue-600",
      ring: "ring-blue-500/10",
    },
    {
      label: t("security.kpi.failedLogins24h"),
      value: data?.failedLogins24h ?? 0,
      icon: AlertTriangle,
      color: failedOk ? "text-emerald-600" : "text-red-600",
      ring: failedOk ? "ring-emerald-500/10" : "ring-red-500/10",
    },
    {
      label: t("security.kpi.suspicious"),
      value: data?.suspiciousActivities ?? 0,
      icon: Shield,
      color: suspiciousOk ? "text-emerald-600" : "text-amber-600",
      ring: suspiciousOk ? "ring-emerald-500/10" : "ring-amber-500/10",
    },
    {
      label: t("security.kpi.compliance"),
      value: `${data?.complianceScore ?? 0}%`,
      icon: CheckCircle,
      color: complianceOk ? "text-emerald-600" : "text-amber-600",
      ring: complianceOk ? "ring-emerald-500/10" : "ring-amber-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className={`ring-1 ${card.ring} transition`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold tabular-nums ${loading ? "opacity-50" : ""}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
