"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { forgotPassword } from "@/lib/auth/actions";
import { useI18n } from "@/lib/i18n/context";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const { t } = useI18n();

  useEffect(() => {
    if (!success) return;
    setCanResend(false);
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [success]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const emailValue = formData.get("email") as string;
    setEmail(emailValue);
    const result = await forgotPassword(formData);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(true);
    setLoading(false);
  }

  async function handleResend() {
    setLoading(true);
    setCanResend(false);
    setCountdown(30);
    const formData = new FormData();
    formData.set("email", email);
    const result = await forgotPassword(formData);
    if (result?.error) setError(result.error);
    setLoading(false);

    // Restart countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Mask email: j***@gsl.lu
  const maskedEmail = email
    ? email.replace(/^(.{1})(.*)(@.*)$/, (_, first, middle, domain) => first + "*".repeat(Math.min(middle.length, 5)) + domain)
    : "";

  return (
    <Card className="w-full max-w-md border-border shadow-xl">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gsl-logo.png" alt="GSL" className="h-10 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-semibold">{t("forgotPassword.title")}</h1>
          {!success && (
            <p className="text-sm text-muted-foreground mt-1">{t("forgotPassword.subtitle")}</p>
          )}
          <div className="border-b mt-4" />
        </div>

        {success ? (
          <div className="text-center py-4">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t("forgotPassword.sentTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("forgotPassword.sentDesc", { email: maskedEmail })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{t("forgotPassword.validFor")}</p>

            <div className="mt-6 space-y-3">
              {canResend ? (
                <Button variant="ghost" size="sm" className="text-sm" onClick={handleResend} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("forgotPassword.resend")}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">{t("forgotPassword.resendIn", { seconds: String(countdown) })}</p>
              )}

              <div>
                <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="mr-1 h-4 w-4" /> {t("login.backToLogin")}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("login.emailLabel")}</label>
                <Input name="email" type="email" placeholder={t("auth.emailPlaceholder")} required autoComplete="email" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("forgotPassword.sendLink")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-1 h-4 w-4" /> {t("login.backToLogin")}
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
