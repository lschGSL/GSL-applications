"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
} from "lucide-react";
import type { Profile } from "@/types/database";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Applications", href: "/apps", icon: LayoutGrid },
  { name: "Security", href: "/settings/security", icon: ShieldCheck },
];

const adminNavigation = [
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "App Management", href: "/admin/apps", icon: Shield },
  { name: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function MobileSidebar({ profile, open, onClose }: { profile: Profile; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const isAdmin = profile.role === "admin" || profile.role === "manager";

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-sidebar-background flex lg:hidden">
        {/* Logo & Close */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gsl-logo.png" alt="GSL" className="h-7 w-auto" />
          <button onClick={onClose} className="rounded-md p-1 hover:bg-sidebar-accent">
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Main
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Administration
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
              {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {profile.full_name || profile.email}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                {profile.role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
