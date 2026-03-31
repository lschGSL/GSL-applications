"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown, LayoutGrid, Loader2, ExternalLink, CheckSquare, Square,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { UserDetailPanel } from "@/components/admin/user-detail-panel";
import { useI18n } from "@/lib/i18n/context";
import type { Profile } from "@/types/database";

const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  manager: "default",
  member: "secondary",
  viewer: "outline",
};

type AppInfo = { id: string; name: string; icon_url: string | null; slug: string };

export function UsersTable({
  users,
  currentUserId,
  pendingUserIds = new Set(),
  orphanUserIds = new Set(),
}: {
  users: Profile[];
  currentUserId: string;
  pendingUserIds?: Set<string>;
  orphanUserIds?: Set<string>;
}) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [userAccess, setUserAccess] = useState<Set<string>>(new Set());
  const [loadingApps, setLoadingApps] = useState(false);
  const [togglingApp, setTogglingApp] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { t } = useI18n();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch apps + access when a row is expanded
  useEffect(() => {
    if (!expandedUserId) return;

    async function load() {
      setLoadingApps(true);
      const [appsRes, accessRes] = await Promise.all([
        fetch("/api/admin/apps"),
        fetch(`/api/admin/access?user_id=${expandedUserId}`),
      ]);
      if (appsRes.ok) setApps(await appsRes.json());
      if (accessRes.ok) {
        const ids = await accessRes.json();
        setUserAccess(new Set(ids));
      }
      setLoadingApps(false);
    }
    load();
  }, [expandedUserId]);

  async function toggleAccess(appId: string, appName: string, grant: boolean) {
    setTogglingApp(appId);
    // Optimistic update
    setUserAccess((prev) => {
      const next = new Set(prev);
      if (grant) next.add(appId); else next.delete(appId);
      return next;
    });

    try {
      const res = await fetch("/api/admin/access", {
        method: grant ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: expandedUserId, app_id: appId }),
      });
      if (!res.ok) {
        // Rollback
        setUserAccess((prev) => {
          const next = new Set(prev);
          if (grant) next.delete(appId); else next.add(appId);
          return next;
        });
      } else {
        showToast(grant
          ? t("admin.users.accessGrantedTo", { app: appName })
          : t("admin.users.accessRevokedFrom", { app: appName })
        );
      }
    } finally {
      setTogglingApp(null);
    }
  }

  async function toggleAll(grant: boolean) {
    setTogglingApp("all");
    try {
      for (const app of apps) {
        const has = userAccess.has(app.id);
        if (grant && !has) {
          await fetch("/api/admin/access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: expandedUserId, app_id: app.id }),
          });
        } else if (!grant && has) {
          await fetch("/api/admin/access", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: expandedUserId, app_id: app.id }),
          });
        }
      }
      setUserAccess(grant ? new Set(apps.map((a) => a.id)) : new Set());
      showToast(grant ? t("admin.users.allAccessGranted") : t("admin.users.allAccessRevoked"));
    } finally {
      setTogglingApp(null);
    }
  }

  function handleRowClick(user: Profile) {
    setExpandedUserId((prev) => (prev === user.id ? null : user.id));
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-card border shadow-lg px-4 py-3 text-sm font-medium animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.user")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.role")}
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.entity")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common.status")}
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.joined")}
                  </th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isExpanded = expandedUserId === user.id;
                  return (
                    <UserRow
                      key={user.id}
                      user={user}
                      isExpanded={isExpanded}
                      pendingUserIds={pendingUserIds}
                      orphanUserIds={orphanUserIds}
                      apps={apps}
                      userAccess={userAccess}
                      loadingApps={loadingApps}
                      togglingApp={togglingApp}
                      t={t}
                      onRowClick={() => handleRowClick(user)}
                      onToggleAccess={toggleAccess}
                      onToggleAll={toggleAll}
                      onOpenProfile={() => setSelectedUser(user)}
                    />
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      {t("admin.users.noUsers")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          currentUserId={currentUserId}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}

function UserRow({
  user,
  isExpanded,
  pendingUserIds,
  orphanUserIds,
  apps,
  userAccess,
  loadingApps,
  togglingApp,
  t,
  onRowClick,
  onToggleAccess,
  onToggleAll,
  onOpenProfile,
}: {
  user: Profile;
  isExpanded: boolean;
  pendingUserIds: Set<string>;
  orphanUserIds: Set<string>;
  apps: AppInfo[];
  userAccess: Set<string>;
  loadingApps: boolean;
  togglingApp: string | null;
  t: (key: string, params?: Record<string, string>) => string;
  onRowClick: () => void;
  onToggleAccess: (appId: string, appName: string, grant: boolean) => void;
  onToggleAll: (grant: boolean) => void;
  onOpenProfile: () => void;
}) {
  return (
    <>
      <tr
        className={`transition-colors cursor-pointer ${isExpanded ? "bg-muted/50" : "hover:bg-muted/30"}`}
        onClick={onRowClick}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="text-xs">
                {getInitials(user.full_name || user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user.full_name || t("common.noName")}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <Badge variant={roleColors[user.role] ?? "secondary"} className="capitalize">
            {t(`roles.${user.role}`)}
          </Badge>
        </td>
        <td className="hidden md:table-cell px-6 py-4">
          {user.entity ? (
            <Badge variant="outline" className="text-xs">
              {user.entity === "gsl_fiduciaire" ? t("entity.fiduciaire") : user.entity === "gsl_revision" ? t("entity.revision") : t("entity.both")}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {orphanUserIds.has(user.id) && (
              <Badge variant="destructive" className="text-[10px]">{t("admin.users.missingProfile")}</Badge>
            )}
            {pendingUserIds.has(user.id) ? (
              <Badge variant="warning">{t("admin.users.pendingInvitation")}</Badge>
            ) : (
              <Badge variant={user.is_active ? "success" : "destructive"}>
                {user.is_active ? t("common.active") : t("common.inactive")}
              </Badge>
            )}
          </div>
        </td>
        <td className="hidden lg:table-cell px-6 py-4 text-sm text-muted-foreground">
          {formatDate(user.created_at)}
        </td>
        <td className="px-3 py-4">
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </td>
      </tr>

      {/* Expanded accordion row */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-card border-b px-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">{t("admin.users.appAccess")}</p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={togglingApp !== null} onClick={() => onToggleAll(true)}>
                    <CheckSquare className="mr-1 h-3 w-3" /> {t("admin.users.grantAll")}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={togglingApp !== null} onClick={() => onToggleAll(false)}>
                    <Square className="mr-1 h-3 w-3" /> {t("admin.users.revokeAll")}
                  </Button>
                  <span className="text-border">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary"
                    onClick={(e) => { e.stopPropagation(); onOpenProfile(); }}
                  >
                    {t("admin.users.viewFullProfile")} <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>

              {loadingApps ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {apps.map((app) => {
                    const hasAccess = userAccess.has(app.id);
                    const isToggling = togglingApp === app.id || togglingApp === "all";
                    return (
                      <button
                        key={app.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all hover:bg-accent ${
                          hasAccess ? "bg-green-500/5 border-green-500/20" : ""
                        }`}
                        disabled={isToggling}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleAccess(app.id, app.name, !hasAccess);
                        }}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 overflow-hidden">
                          {app.icon_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={app.icon_url} alt="" className="h-7 w-7 object-cover rounded-md" />
                          ) : (
                            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                        <span className="text-sm flex-1 truncate">{app.name}</span>
                        {isToggling ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                        ) : (
                          <div className={`h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                            hasAccess ? "bg-primary border-primary" : "border-muted-foreground/30"
                          }`}>
                            {hasAccess && (
                              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
