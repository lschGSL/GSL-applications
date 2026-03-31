"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";
import { PasswordStrength } from "@/components/security/password-strength";
import { validatePassword } from "@/lib/password";
import { useI18n } from "@/lib/i18n/context";

export default function WelcomePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Extract name from metadata
      const meta = user.user_metadata || {};
      setUserName(meta.full_name || null);

      setChecking(false);
    }
    checkSession();
  }, [router]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const pw = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    const validation = validatePassword(pw);
    if (!validation.valid) {
      setError(validation.errors.join(". "));
      setLoading(false);
      return;
    }

    if (pw !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: updateError } = await supabase.auth.updateUser({ password: pw });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  if (checking) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const title = userName
    ? t("welcome.titleWithName", { name: userName })
    : t("welcome.title");

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gsl-logo.png" alt="GSL" className="h-10 w-auto mx-auto" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{t("welcome.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg bg-primary/5 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            {t("welcome.securityHint")}
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t("welcome.choosePassword")}
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("auth.minChars")}
              required
              minLength={12}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrength password={password} />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm_password" className="text-sm font-medium">
              {t("auth.confirmPassword")}
            </label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder={t("auth.repeatPassword")}
              required
              minLength={12}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("welcome.activateAccount")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
