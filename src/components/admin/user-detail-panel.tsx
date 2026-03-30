"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X, Shield, ShieldCheck, UserCog, Eye, Building, Ban, CheckCircle, Loader2,
  Mail, Calendar, Clock, Trash2, KeyRound, Activity,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { Profile, UserRole, GslEntity } from "@/types/database";

export function UserDetailPanel({
  user,
  currentUserId,
  onClose,
}: {
  user: Profile;
  currentUserId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [authInfo, setAuthInfo] = useState<{
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    created_at: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const isSelf = user.id === currentUserId;
  const { t } = useI18n();

  // Fetch auth metadata
  useEffect(() => {
    async function loadAuth() {
      const res = await fetch("/api/admin/users/list");
      if (res.ok) {
        const users = await res.json();
        const found = users.find((u: { id: string }) => u.id === user.id);
        if (found?.auth) setAuthInfo(found.auth);
      }
    }
    loadAuth();
  }, [user.id]);

  const roles: { value: UserRole; label: string; icon: React.ElementType; color: string }[] = [
    { value: "admin", label: t("roles.admin"), icon: ShieldCheck, color: "bg-red-500/10 text-red-600 border-red-200" },
    { value: "manager", label: t("roles.manager"), icon: Shield, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
    { value: "member", label: t("roles.member"), icon: UserCog, color: "bg-gray-500/10 text-gray-600 border-gray-200" },
    { value: "viewer", label: t("roles.viewer"), icon: Eye, color: "bg-gray-500/10 text-gray-500 border-gray-200" },
  ];

  const entities: { value: GslEntity | null; label: string; short: string }[] = [
    { value: null, label: t("admin.users.noEntityAssigned"), short: t("common.none") },
    { value: "gsl_fiduciaire", label: t("entity.gslFiduciaire"), short: t("entity.fiduciaire") },
    { value: "gsl_revision", label: t("entity.gslRevision"), short: t("entity.revision") },
    { value: "both", label: t("entity.gslBoth"), short: t("entity.both") },
  ];

  async function updateUser(updates: { role?: UserRole; is_active?: boolean; entity?: GslEntity | null }, key: string) {
    setLoading(key);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update user");
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function deleteUser() {
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
        return;
      }
      router.refresh();
      onClose();
    } finally {
      setLoading(null);
    }
  }

  async function resendInvitation() {
    setLoading("resend");
    try {
      const res = await fetch(`/api/admin/users/${user.id}/resend-invitation`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to resend invitation");
        return;
      }
      setToast(t("admin.users.invitationResent", { email: user.email }));
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(null);
    }
  }

  async function forceResetPassword() {
    setLoading("reset");
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to send reset email");
        return;
      }
      setToast(t("admin.users.resetSent", { email: user.email }));
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(null);
    }
  }

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return t("admin.users.neverConnected");
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  }

  const isPending = authInfo && !authInfo.email_confirmed_at;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">{t("admin.users.userDetails")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Toast */}
          {toast && (
            <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600 font-medium">
              {toast}
            </div>
          )}

          {/* Profile header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="text-lg">
                {getInitials(user.full_name || user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold truncate">
                {user.full_name || t("common.noName")}
              </h3>
              <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-sm truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {isPending ? (
                  <Badge variant="warning" className="text-xs">{t("admin.users.pendingInvitation")}</Badge>
                ) : (
                  <Badge variant={user.is_active ? "success" : "destructive"} className="text-xs">
                    {user.is_active ? t("common.active") : t("common.inactive")}
                  </Badge>
                )}
                {isSelf && <Badge variant="outline" className="text-xs">{t("common.you")}</Badge>}
              </div>
            </div>
          </div>

          {/* Auth Inspector */}
          {authInfo && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t("admin.users.accountHealth")}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("admin.users.lastLogin")}</p>
                    <p className="text-sm font-medium">
                      {authInfo.last_sign_in_at
                        ? `${timeAgo(authInfo.last_sign_in_at)} — ${formatDate(authInfo.last_sign_in_at)}`
                        : t("admin.users.neverConnected")}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("admin.users.emailConfirmed")}</p>
                    <p className="text-sm font-medium">
                      {authInfo.email_confirmed_at ? (
                        <span className="text-green-600">{formatDate(authInfo.email_confirmed_at)}</span>
                      ) : (
                        <span className="text-amber-600">{t("common.no")}</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  {t("admin.users.joined")}
                </div>
                <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  {t("admin.users.lastUpdated")}
                </div>
                <p className="text-sm font-medium">{formatDate(user.updated_at)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Role section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("admin.users.role")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const isCurrentRole = user.role === role.value;
                const isLoading = loading === `role-${role.value}`;
                return (
                  <button
                    key={role.value}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                      isCurrentRole
                        ? `${role.color} border-current font-medium ring-1 ring-current/20`
                        : "border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                    disabled={isCurrentRole || isSelf || loading !== null}
                    onClick={() => updateUser({ role: role.value }, `role-${role.value}`)}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                    {role.label}
                    {isCurrentRole && (
                      <span className="ml-auto text-[10px] uppercase font-semibold opacity-60">{t("common.current")}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {isSelf && (
              <p className="text-xs text-muted-foreground mt-2">{t("admin.users.cannotChangeOwnRole")}</p>
            )}
          </div>

          {/* Entity section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t("admin.users.entity")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {entities.map((entity) => {
                const isCurrent = user.entity === entity.value;
                const isLoading = loading === `entity-${entity.value}`;
                return (
                  <button
                    key={entity.value ?? "none"}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                      isCurrent
                        ? "bg-primary/5 border-primary/30 font-medium text-primary ring-1 ring-primary/20"
                        : "border-border hover:bg-accent disabled:opacity-40"
                    }`}
                    disabled={isCurrent || loading !== null}
                    onClick={() => updateUser({ entity: entity.value }, `entity-${entity.value}`)}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building className="h-4 w-4" />}
                    {entity.short}
                    {isCurrent && (
                      <span className="ml-auto text-[10px] uppercase font-semibold opacity-60">{t("common.current")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t("admin.users.accountStatus")}</h4>
            {user.is_active ? (
              <Button
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={isSelf || loading !== null}
                onClick={() => updateUser({ is_active: false }, "deactivate")}
              >
                {loading === "deactivate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                {t("admin.users.deactivateAccount")}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10"
                disabled={loading !== null}
                onClick={() => updateUser({ is_active: true }, "activate")}
              >
                {loading === "activate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                {t("admin.users.activateAccount")}
              </Button>
            )}
            {isSelf && (
              <p className="text-xs text-muted-foreground mt-2">{t("admin.users.cannotDeactivateOwn")}</p>
            )}
          </div>

          {/* Admin Actions */}
          {!isSelf && (
            <div>
              <h4 className="text-sm font-semibold mb-3">{t("admin.users.adminActions")}</h4>
              <div className="space-y-2">
                {/* Resend invitation — only if email not confirmed */}
                {isPending && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={loading !== null}
                    onClick={resendInvitation}
                  >
                    {loading === "resend" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    {t("admin.users.resendInvitation")}
                  </Button>
                )}

                {/* Force password reset */}
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={loading !== null}
                  onClick={forceResetPassword}
                >
                  {loading === "reset" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  {t("admin.users.forceResetPassword")}
                </Button>
              </div>
            </div>
          )}

          {/* Danger Zone — Delete */}
          {!isSelf && (
            <div className="pt-2 border-t">
              <h4 className="text-sm font-semibold text-destructive mb-3">{t("admin.users.dangerZone")}</h4>
              {showDeleteConfirm ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm">
                    {t("admin.users.deleteConfirm", { name: user.full_name || user.email })}
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDeleteConfirm(false)} disabled={loading === "delete"}>
                      {t("common.cancel")}
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={deleteUser} disabled={loading === "delete"}>
                      {loading === "delete" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      {t("common.delete")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("admin.users.deleteUser")}
                </Button>
              )}
            </div>
          )}

          {/* User ID */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground font-mono">ID: {user.id}</p>
          </div>
        </div>
      </div>
    </>
  );
}
