"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  Users2,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { Profile } from "@/types/database";

const navigation = [
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.applications", href: "/apps", icon: LayoutGrid },
  { key: "nav.security", href: "/settings/security", icon: ShieldCheck },
];

const adminNavigation = [
  { key: "nav.userManagement", href: "/admin/users", icon: Users },
  { key: "nav.clientManagement", href: "/admin/clients", icon: Users2 },
  { key: "nav.appManagement", href: "/admin/apps", icon: Shield },
  { key: "nav.auditLog", href: "/admin/audit-log", icon: ScrollText },
  { key: "nav.authLogs", href: "/admin/auth-logs", icon: ShieldAlert },
  { key: "nav.analytics", href: "/admin/analytics", icon: BarChart3 },
  { key: "nav.settings", href: "/admin/settings", icon: Settings },
];

const clientNavigation = [
  { key: "nav.myDocuments", href: "/client/documents", icon: FileText },
  { key: "nav.security", href: "/settings/security", icon: ShieldCheck },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isAdmin = profile.role === "admin" || profile.role === "manager";
  const isClient = profile.role === "client";
  const navItems = isClient ? clientNavigation : navigation;

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
          {t("nav.main")}
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {t("nav.administration")}
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.key)}
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
