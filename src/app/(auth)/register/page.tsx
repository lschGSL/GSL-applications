"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { signUp } from "@/lib/auth/actions";
import { PasswordStrength } from "@/components/security/password-strength";
import { validatePassword } from "@/lib/password";
import { useI18n } from "@/lib/i18n/context";

interface InviteData {
  email: string;
  role: string;
  entity: string | null;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    }>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { t } = useI18n();

  useEffect(() => {
    if (!inviteToken) return;

    fetch(`/api/invitations/validate?token=${encodeURIComponent(inviteToken)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          setInviteError(data.error || t("auth.invalidInvitation"));
          return;
        }
        const data = await res.json();
        setInvite(data);
      })
      .catch(() => setInviteError(t("auth.failedValidateInvite")));
  }, [inviteToken, t]);

  async function handleSubmit(formData: FormData) {
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

    if (invite && inviteToken) {
      formData.set("email", invite.email);
      formData.set("invite_token", inviteToken);
    }

    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const entityLabel = invite?.entity === "gsl_fiduciaire" ? t("entity.gslFiduciaire") : invite?.entity === "gsl_revision" ? t("entity.gslRevision") : invite?.entity === "both" ? t("entity.both") : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {invite ? t("auth.acceptInvitation") : t("auth.createAccount")}
        </CardTitle>
        <CardDescription>
          {invite ? t("auth.invitedToJoin") : t("auth.joinPortal")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inviteError && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {inviteError}
          </div>
        )}
        {invite && (
          <div className="mb-4 rounded-lg bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <span className="font-medium">{invite.email}</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="capitalize">{invite.role}</Badge>
              {entityLabel && <Badge variant="outline">{entityLabel}</Badge>}
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">
              {t("auth.fullName")}
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder={t("auth.namePlaceholder")}
              required
              autoComplete="name"
            />
          </div>
          {!invite && (
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t("auth.email")}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                required
                autoComplete="email"
              />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t("auth.password")}
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("auth.minChars")}
              required
              autoComplete="new-password"
              minLength={12}
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
              autoComplete="new-password"
              minLength={12}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !!inviteError}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {invite ? t("auth.acceptAndCreate") : t("auth.signUp")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t("auth.signIn")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
