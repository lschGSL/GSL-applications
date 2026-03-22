import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex h-16 items-center justify-between px-6 border-b">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/gsl-logo.png"
            alt="GSL"
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
