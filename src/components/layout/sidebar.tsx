"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const isAdmin = profile.role === "admin" || profile.role === "manager";

  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar-background lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gsl-logo.png"
          alt="GSL"
          className="h-7 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Main
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
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

      {/* User info at bottom */}
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
  );
}
