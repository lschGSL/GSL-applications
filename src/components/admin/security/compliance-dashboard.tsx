"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertCircle, Users, Clock, ScrollText } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface Compliance {
  userAccessReviews: { reviewed: number; overdue: number; total: number };
  mfaAdoptionRate: number;
  sessionCompliance: {
    avgLengthMinutes: number;
    timeoutCompliantRate: number;
    totalSessions: number;
  };
  auditLogCoverage: number;
  thresholds: { COMPLIANCE_SCORE_MIN: number };
}

function ProgressBar({
  value,
  threshold,
}: {
  value: number;
  threshold: number;
}) {
  const ok = value >= threshold;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full transition-all ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export function ComplianceDashboard() {
  const { t } = useI18n();
  const [data, setData] = useState<Compliance | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/security/compliance", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json) setData(json); })
      .finally(() => setLoading(false));
  }, []);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/security/compliance-report", { method: "POST" });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cssf-compliance-${new Date().toISOString().split("T")[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("security.compliance.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </CardContent>
      </Card>
    );
  }

  const mfaOk = data.mfaAdoptionRate >= 80;
  const sessionOk = data.sessionCompliance.timeoutCompliantRate >= 90;
  const reviewOk = data.userAccessReviews.overdue === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            {t("security.compliance.title")}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("security.compliance.subtitle")}
          </p>
        </div>
        <Button size="sm" onClick={generatePdf} disabled={generating}>
          <FileText className="mr-1 h-3 w-3" />
          {generating ? t("common.loading") : t("security.compliance.generateReport")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MFA adoption */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {t("security.compliance.mfaAdoption")}
            </span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-semibold">{data.mfaAdoptionRate}%</span>
              {mfaOk ? (
                <CheckCircle className="h-3 w-3 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-amber-600" />
              )}
            </div>
          </div>
          <div className="mt-1">
            <ProgressBar value={data.mfaAdoptionRate} threshold={80} />
          </div>
        </div>

        {/* Session compliance */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t("security.compliance.sessionCompliance")}
            </span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-semibold">
                {data.sessionCompliance.timeoutCompliantRate}%
              </span>
              {sessionOk ? (
                <CheckCircle className="h-3 w-3 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-amber-600" />
              )}
            </div>
          </div>
          <div className="mt-1">
            <ProgressBar
              value={data.sessionCompliance.timeoutCompliantRate}
              threshold={90}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("security.compliance.avgSession")}:{" "}
            {data.sessionCompliance.avgLengthMinutes} min ·{" "}
            {data.sessionCompliance.totalSessions} {t("security.compliance.sessions")}
          </p>
        </div>

        {/* Access reviews */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              {t("security.compliance.accessReviews")}
            </span>
            <Badge variant={reviewOk ? "secondary" : "destructive"}>
              {data.userAccessReviews.reviewed}/{data.userAccessReviews.total}
            </Badge>
          </div>
          {data.userAccessReviews.overdue > 0 && (
            <p className="mt-1 text-xs text-amber-600">
              {data.userAccessReviews.overdue} {t("security.compliance.overdue")}
            </p>
          )}
        </div>

        {/* Audit coverage */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              {t("security.compliance.auditCoverage")}
            </span>
            <span className="tabular-nums font-semibold">{data.auditLogCoverage}%</span>
          </div>
          <div className="mt-1">
            <ProgressBar value={data.auditLogCoverage} threshold={100} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
