"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";
import { PasswordStrength } from "@/components/security/password-strength";
import { validatePassword } from "@/lib/password";
import { useI18n } from "@/lib/i18n/context";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    async function getEmail() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    }
    getEmail();
  }, []);

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

    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <Card className="w-full max-w-md border-border shadow-xl">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gsl-logo.png" alt="GSL" className="h-10 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-semibold">{t("resetPassword.title")}</h1>
          <div className="border-b mt-4" />
        </div>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t("resetPassword.successTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("resetPassword.successDesc")}</p>
          </div>
        ) : (
          <>
            {userEmail && (
              <div className="mb-4 space-y-2">
                <label className="text-sm font-medium">{t("login.emailLabel")}</label>
                <Input value={userEmail} readOnly className="bg-muted" />
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
                {error.includes("expired") && (
                  <Link href="/forgot-password" className="block mt-2 text-primary hover:underline text-xs">
                    {t("resetPassword.requestNewLink")}
                  </Link>
                )}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("resetPassword.newPassword")}</label>
                <Input
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
                <label className="text-sm font-medium">{t("resetPassword.confirmNew")}</label>
                <Input name="confirm_password" type="password" placeholder={t("auth.repeatPassword")} required minLength={12} autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("resetPassword.saveButton")}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
