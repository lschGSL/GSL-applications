"use client";

import Image from "next/image";
import { LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth/actions";
import type { Profile } from "@/types/database";

export function TopNav({ profile }: { profile: Profile }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <Image
          src="/gsl-logo.png"
          alt="GSL"
          width={100}
          height={32}
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
  );
}
