"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { signIn, signUp } from "@/lib/auth/actions";
import { PasswordStrength } from "@/components/security/password-strength";
import { validatePassword } from "@/lib/password";
import { useI18n } from "@/lib/i18n/context";

export default function LoginPage() {
  return (
    <Suspense>
      <AuthCard />
    </Suspense>
  );
}

function AuthCard() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const redirect = searchParams.get("redirect");
  const [view, setView] = useState<"login" | "signup" | "pending">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const { t } = useI18n();

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError(null);
    if (redirect) formData.set("redirect", redirect);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.redirectTo) {
      window.location.href = result.redirectTo;
    }
  }

  async function handleSignup(formData: FormData) {
    setLoading(true);
    setError(null);

    const pw = formData.get("password") as string;
    const confirm = formData.get("confirm_password") as string;

    if (pw !== confirm) {
      setError(t("auth.passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    const validation = validatePassword(pw);
    if (!validation.valid) {
      setError(validation.errors.join(". "));
      setLoading(false);
      return;
    }

    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setView("pending");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-xl">
      <CardContent className="p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gsl-logo.png" alt="GSL" className="h-10 w-auto mx-auto mb-4" />

          {view === "pending" ? null : (
            <>
              <h1 className="text-2xl font-semibold text-foreground">
                {view === "login" ? t("login.title") : t("login.signupTitle")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {view === "login" ? t("login.subtitle") : t("login.signupSubtitle")}
              </p>
              <div className="border-b mt-4" />
            </>
          )}
        </div>

        {/* Messages */}
        {message && view === "login" && (
          <div className="mb-4 rounded-lg bg-primary/10 p-3 text-sm text-primary">{message}</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* === PENDING VIEW === */}
        {view === "pending" && (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t("login.pendingTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("login.pendingDesc")}</p>
            <Button
              variant="ghost"
              className="mt-6 text-sm"
              onClick={() => { setView("login"); setError(null); }}
            >
              {t("login.backToLogin")}
            </Button>
          </div>
        )}

        {/* === LOGIN VIEW === */}
        {view === "login" && (
          <>
            <form action={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">{t("login.emailLabel")}</label>
                <Input id="email" name="email" type="email" placeholder={t("auth.emailPlaceholder")} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">{t("login.passwordLabel")}</label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    {t("login.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.enterPassword")}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("login.signInButton")}
              </Button>
            </form>

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("login.or")}</span>
              </div>
            </div>

            {/* Signup CTA */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">{t("login.firstVisit")}</p>
              <Button variant="outline" className="w-full" onClick={() => { setView("signup"); setError(null); setPassword(""); }}>
                {t("login.createAccount")}
              </Button>
            </div>
          </>
        )}

        {/* === SIGNUP VIEW === */}
        {view === "signup" && (
          <>
            <form action={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.fullNameLabel")}</label>
                <Input name="full_name" placeholder={t("auth.namePlaceholder")} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.emailLabel")}</label>
                <Input name="email" type="email" placeholder={t("auth.emailPlaceholder")} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.passwordLabel")}</label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.minChars")}
                    required
                    minLength={12}
                    autoComplete="new-password"
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.confirmPasswordLabel")}</label>
                <Input name="confirm_password" type="password" placeholder={t("auth.repeatPassword")} required minLength={12} autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("login.createMyAccount")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => { setView("login"); setError(null); setPassword(""); }}
              >
                ← {t("login.alreadyHaveAccount")}
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
