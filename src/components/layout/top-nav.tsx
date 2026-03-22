"use client";

import { LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { signOut } from "@/lib/auth/actions";
import { useState } from "react";
import type { Profile } from "@/types/database";

export function TopNav({ profile }: { profile: Profile }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <MobileSidebar profile={profile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gsl-logo.png"
            alt="GSL"
            className="h-6 w-auto lg:hidden"
          />
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {profile.full_name || profile.email}
            </span>
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </header>
    </>
  );
}
