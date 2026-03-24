"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X,
  Shield,
  ShieldCheck,
  UserCog,
  Eye,
  Building,
  Ban,
  CheckCircle,
  Loader2,
  Mail,
  Calendar,
  Clock,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import type { Profile, UserRole, GslEntity } from "@/types/database";

const roles: { value: UserRole; label: string; icon: React.ElementType; color: string }[] = [
  { value: "admin", label: "Admin", icon: ShieldCheck, color: "bg-red-500/10 text-red-600 border-red-200" },
  { value: "manager", label: "Manager", icon: Shield, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { value: "member", label: "Member", icon: UserCog, color: "bg-gray-500/10 text-gray-600 border-gray-200" },
  { value: "viewer", label: "Viewer", icon: Eye, color: "bg-gray-500/10 text-gray-500 border-gray-200" },
];

const entities: { value: GslEntity | null; label: string; short: string }[] = [
  { value: null, label: "No entity assigned", short: "None" },
  { value: "gsl_fiduciaire", label: "GSL Fiduciaire", short: "Fiduciaire" },
  { value: "gsl_revision", label: "GSL Révision", short: "Révision" },
  { value: "both", label: "GSL Fiduciaire & GSL Révision", short: "Both" },
];

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
  const router = useRouter();
  const isSelf = user.id === currentUserId;

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

  const currentEntity = entities.find((e) => e.value === user.entity) ?? entities[0];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l bg-background shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">User Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
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
                {user.full_name || "No name"}
              </h3>
              <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-sm truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  variant={user.is_active ? "success" : "destructive"}
                  className="text-xs"
                >
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
                {isSelf && (
                  <Badge variant="outline" className="text-xs">You</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  Joined
                </div>
                <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  Last updated
                </div>
                <p className="text-sm font-medium">{formatDate(user.updated_at)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Role section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
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
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {role.label}
                    {isCurrentRole && (
                      <span className="ml-auto text-[10px] uppercase font-semibold opacity-60">Current</span>
                    )}
                  </button>
                );
              })}
            </div>
            {isSelf && (
              <p className="text-xs text-muted-foreground mt-2">You cannot change your own role.</p>
            )}
          </div>

          {/* Entity section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Entity
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
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Building className="h-4 w-4" />
                    )}
                    {entity.short}
                    {isCurrent && (
                      <span className="ml-auto text-[10px] uppercase font-semibold opacity-60">Current</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status section */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Account Status</h4>
            {user.is_active ? (
              <Button
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={isSelf || loading !== null}
                onClick={() => updateUser({ is_active: false }, "deactivate")}
              >
                {loading === "deactivate" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                Deactivate Account
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10"
                disabled={loading !== null}
                onClick={() => updateUser({ is_active: true }, "activate")}
              >
                {loading === "activate" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Activate Account
              </Button>
            )}
            {isSelf && (
              <p className="text-xs text-muted-foreground mt-2">You cannot deactivate your own account.</p>
            )}
          </div>

          {/* User ID for debug */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground font-mono">
              ID: {user.id}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
