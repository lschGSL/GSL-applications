"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldAlert, TrendingUp, TrendingDown, Users, CheckCircle, XCircle,
  LogOut, Key, RefreshCw, Mail, Trash2, Shield, AlertTriangle,
  Download, Search, X, ChevronLeft, ChevronRight, Loader2, Clock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

type AuthEvent = {
  id: string;
  time: string;
  type: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  ip: string | null;
  details: string | null;
  status: "success" | "failure" | "info";
  source: "app" | "auth";
};

type Metrics = {
  totalEvents: number;
  successCount: number;
  failureCount: number;
  uniqueUsers: number;
  prevTotal: number;
};

type AlertItem = {
  type: string;
  message: string;
  userId?: string;
  severity: "warning" | "danger";
};

const EVENT_TYPES = [
  { value: "sign_in", label: "Sign in", icon: CheckCircle, color: "text-green-600" },
  { value: "sign_in_failed", label: "Failed", icon: XCircle, color: "text-red-600" },
  { value: "sign_out", label: "Sign out", icon: LogOut, color: "text-gray-500" },
  { value: "password_recovery", label: "Recovery", icon: Key, color: "text-blue-600" },
  { value: "token_refreshed", label: "Token", icon: RefreshCw, color: "text-gray-400" },
  { value: "user_invited", label: "Invited", icon: Mail, color: "text-amber-600" },
  { value: "user_deleted", label: "Deleted", icon: Trash2, color: "text-red-800" },
  { value: "mfa_challenge", label: "MFA", icon: Shield, color: "text-purple-600" },
  { value: "force_reset_password", label: "Reset", icon: Key, color: "text-orange-600" },
];

const PERIODS = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

function getEventIcon(type: string) {
  const found = EVENT_TYPES.find((e) => e.value === type);
  if (found) {
    const Icon = found.icon;
    return <Icon className={`h-4 w-4 ${found.color}`} />;
  }
  return <Clock className="h-4 w-4 text-gray-400" />;
}

function getEventBadge(type: string) {
  const colorMap: Record<string, "success" | "destructive" | "warning" | "secondary" | "default" | "outline"> = {
    sign_in: "success",
    sign_in_failed: "destructive",
    sign_out: "secondary",
    password_recovery: "default",
    token_refreshed: "outline",
    user_invited: "warning",
    user_deleted: "destructive",
    mfa_challenge: "default",
    mfa_success: "success",
    mfa_failed: "destructive",
    force_reset_password: "warning",
  };
  return colorMap[type] || "outline";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function AuthLogsPage() {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [hourlyData, setHourlyData] = useState<{ hour: string; success: number; failure: number }[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [period, setPeriod] = useState("24h");
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { t } = useI18n();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("period", period);
    params.set("page", String(page));
    if (search) params.set("q", search);
    if (selectedTypes.size > 0) params.set("type", Array.from(selectedTypes).join(","));
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/auth-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setMetrics(data.metrics);
        setHourlyData(data.hourlyData);
        setAlerts(data.alerts);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      }
    } finally {
      setLoading(false);
    }
  }, [period, search, selectedTypes, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleType(type: string) {
    const next = new Set(selectedTypes);
    if (next.has(type)) next.delete(type); else next.add(type);
    setSelectedTypes(next);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setSelectedTypes(new Set());
    setStatusFilter("");
    setPeriod("24h");
    setPage(1);
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/auth-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `auth-logs-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  const trendPercent = metrics && metrics.prevTotal > 0
    ? Math.round(((metrics.totalEvents - metrics.prevTotal) / metrics.prevTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("authLogs.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("authLogs.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={exporting}>
            {exporting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
            {t("authLogs.exportCSV")}
          </Button>
          <Badge variant="secondary">{totalItems} events</Badge>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                alert.severity === "danger"
                  ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
                  : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50"
              }`}
            >
              <AlertTriangle className={`h-4 w-4 shrink-0 ${alert.severity === "danger" ? "text-red-600" : "text-amber-600"}`} />
              <p className={`text-sm font-medium ${alert.severity === "danger" ? "text-red-800 dark:text-red-400" : "text-amber-800 dark:text-amber-400"}`}>
                {alert.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("authLogs.totalEvents")}</CardTitle>
              {trendPercent >= 0
                ? <TrendingUp className="h-4 w-4 text-muted-foreground" />
                : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalEvents}</div>
              {trendPercent !== 0 && (
                <p className={`text-xs mt-1 ${trendPercent > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {trendPercent > 0 ? "+" : ""}{trendPercent}% vs prev
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("authLogs.successfulLogins")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.successCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("authLogs.failedAttempts")}</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{metrics.failureCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("authLogs.activeUsers")}</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.uniqueUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Chart */}
      {hourlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("authLogs.activityChart")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="success" name={t("authLogs.success")} fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="failure" name={t("authLogs.failures")} fill="#dc2626" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("authLogs.searchPlaceholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>

          {/* Period */}
          <div className="flex items-center gap-1">
            {PERIODS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => { setPeriod(p.value); setPage(1); }}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <Button variant={!statusFilter ? "default" : "ghost"} size="sm" className="h-8 px-2.5 text-xs" onClick={() => { setStatusFilter(""); setPage(1); }}>
              {t("common.all")}
            </Button>
            <Button variant={statusFilter === "success" ? "default" : "ghost"} size="sm" className="h-8 px-2.5 text-xs" onClick={() => { setStatusFilter("success"); setPage(1); }}>
              {t("authLogs.success")}
            </Button>
            <Button variant={statusFilter === "failure" ? "default" : "ghost"} size="sm" className="h-8 px-2.5 text-xs" onClick={() => { setStatusFilter("failure"); setPage(1); }}>
              {t("authLogs.failures")}
            </Button>
          </div>

          {(search || selectedTypes.size > 0 || statusFilter || period !== "24h") && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetFilters}>
              <X className="mr-1 h-3 w-3" /> {t("authLogs.resetFilters")}
            </Button>
          )}
        </div>

        {/* Event type pills */}
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((et) => {
            const isSelected = selectedTypes.has(et.value);
            return (
              <button
                key={et.value}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                    : "border-border hover:bg-accent text-muted-foreground"
                }`}
                onClick={() => toggleType(et.value)}
              >
                <et.icon className={`h-3 w-3 ${isSelected ? "text-primary" : et.color}`} />
                {et.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Timeline */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{t("authLogs.noEvents")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("authLogs.time")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("authLogs.user")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("authLogs.event")}</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("authLogs.details")}</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          <span title={new Date(event.time).toLocaleString("fr-FR")}>{timeAgo(event.time)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{event.user_name || event.user_email || "—"}</p>
                            {event.user_name && event.user_email && (
                              <p className="text-xs text-muted-foreground truncate">{event.user_email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <Badge variant={getEventBadge(event.type)} className="text-xs capitalize">
                              {event.type.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                          {event.details || "—"}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-muted-foreground font-mono">
                          {event.ip || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {(page - 1) * 50 + 1}-{Math.min(page * 50, totalItems)} {t("authLogs.of")} {totalItems}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="mr-1 h-4 w-4" /> {t("common.previous")}
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      {t("common.next")} <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
