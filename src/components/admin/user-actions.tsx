"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Shield, ShieldCheck, UserCog, Eye, Ban, CheckCircle } from "lucide-react";
import type { Profile, UserRole } from "@/types/database";

const roles: { value: UserRole; label: string; icon: React.ElementType }[] = [
  { value: "admin", label: "Admin", icon: ShieldCheck },
  { value: "manager", label: "Manager", icon: Shield },
  { value: "member", label: "Member", icon: UserCog },
  { value: "viewer", label: "Viewer", icon: Eye },
];

export function UserActions({ user, currentUserId }: { user: Profile; currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isSelf = user.id === currentUserId;

  async function updateUser(updates: { role?: UserRole; is_active?: boolean }) {
    setLoading(true);
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
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="gap-1"
      >
        Actions <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border bg-popover p-2 shadow-lg">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">Change role</p>
            {roles.map((role) => {
              const Icon = role.icon;
              const isCurrentRole = user.role === role.value;
              return (
                <button
                  key={role.value}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                  disabled={isCurrentRole || isSelf}
                  onClick={() => updateUser({ role: role.value })}
                >
                  <Icon className="h-4 w-4" />
                  {role.label}
                  {isCurrentRole && <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>}
                </button>
              );
            })}

            <div className="my-1 border-t" />
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">Status</p>
            {user.is_active ? (
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent disabled:opacity-50"
                disabled={isSelf}
                onClick={() => updateUser({ is_active: false })}
              >
                <Ban className="h-4 w-4" />
                Deactivate
              </button>
            ) : (
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-green-600 hover:bg-accent"
                onClick={() => updateUser({ is_active: true })}
              >
                <CheckCircle className="h-4 w-4" />
                Activate
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
