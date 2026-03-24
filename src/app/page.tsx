import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Shield, Users, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  // Supabase sends auth codes to / when redirect URLs are not whitelisted.
  // Forward to /auth/callback so the code is properly exchanged.
  if (params.code) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
    redirect(`/auth/callback?${qs.toString()}`);
  }
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - matching gsl.lu navigation style */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gsl-logo.png"
              alt="GSL"
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your applications,
            <br />
            <span className="text-primary">one portal.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            GSL Portal provides centralized access to all company applications
            with enterprise-grade security, role-based access control,
            and comprehensive audit logging.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 pb-24">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Enterprise Security</h3>
              <p className="mt-2 text-muted-foreground">
                Multi-factor authentication, row-level security,
                encrypted connections, and security headers by default.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">User Management</h3>
              <p className="mt-2 text-muted-foreground">
                Role-based access control with per-application permissions.
                Full audit trail of all user actions.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <LayoutGrid className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">App Hub</h3>
              <p className="mt-2 text-muted-foreground">
                Centralized dashboard to access all internal and external
                applications. One login, all your tools.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - matching gsl.lu light footer style */}
      <footer className="border-t-4 border-t-primary bg-[#f7f7f7] text-gsl-gray">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Logo & Social */}
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gsl-logo.png"
                alt="GSL"
                className="h-12 w-auto mb-2"
              />
              <p className="text-sm text-gsl-gray/60 mb-6">
                fiduciaire | révision | management
              </p>
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/GSLGroup" target="_blank" rel="noopener noreferrer" className="text-gsl-gray/50 hover:text-gsl-gray transition-colors" aria-label="Facebook">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/gsl-group-luxembourg" target="_blank" rel="noopener noreferrer" className="text-gsl-gray/50 hover:text-gsl-gray transition-colors" aria-label="LinkedIn">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.instagram.com/gsl_group_luxembourg" target="_blank" rel="noopener noreferrer" className="text-gsl-gray/50 hover:text-gsl-gray transition-colors" aria-label="Instagram">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:info@gsl.lu" className="hover:text-primary transition-colors">info@gsl.lu</a>
                </li>
                <li>T.: +352 26 17 34 1</li>
                <li className="mt-4">1 Bd du Jazz, L-4370 Esch-sur-Alzette</li>
                <li>Esch-sur-Alzette, Luxembourg</li>
              </ul>
            </div>

            {/* Nav Links Col 1 */}
            <div>
              <ul className="space-y-2 text-sm">
                <li><a href="https://www.gsl.lu" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Fiduciaire</a></li>
                <li><a href="https://www.gsl.lu" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Révision</a></li>
                <li><a href="https://www.gsl.lu" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Management</a></li>
                <li><a href="https://www.gsl.lu" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">À propos de nous</a></li>
              </ul>
            </div>

            {/* Nav Links Col 2 */}
            <div>
              <ul className="space-y-2 text-sm">
                <li><a href="https://www.gsl.lu" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Actualités</a></li>
                <li><a href="https://www.gsl.lu" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Contact</a></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Portal</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-300 py-4">
          <div className="container mx-auto px-4 text-center text-xs text-gsl-gray/50">
            Tous droits réservés &copy; {new Date().getFullYear()} GSL Luxembourg
          </div>
        </div>
      </footer>
    </div>
  );
}
