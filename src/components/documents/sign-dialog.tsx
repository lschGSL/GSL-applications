"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2, ShieldCheck, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function SignDialog({
  documentId,
  documentName,
  onClose,
}: {
  documentId: string;
  documentName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleSign(formData: FormData) {
    setLoading(true);
    setError(null);

    const password = formData.get("password") as string;

    try {
      const res = await fetch(`/api/documents/${documentId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("common.networkError"));
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(onClose, 1500);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("signatures.signDocument")}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="text-sm font-medium text-green-600">{t("signatures.signed")}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-lg bg-primary/5 p-4">
                <p className="text-sm">
                  {t("signatures.confirmText")}
                </p>
                <p className="text-sm font-medium mt-2">{documentName}</p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <form action={handleSign} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("signatures.enterPassword")}</label>
                  <Input
                    name="password"
                    type="password"
                    placeholder={t("auth.enterPassword")}
                    required
                    autoComplete="current-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("signatures.passwordHint")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("signatures.sign")}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
