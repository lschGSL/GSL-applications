"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function InviteUserDialog({ showDialog }: { showDialog: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const entity = formData.get("entity") as string;

    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, entity: entity || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("common.networkError"));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/users");
        router.refresh();
      }, 1500);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" asChild>
        <Link href="/admin/users?invite=true">
          <UserPlus className="mr-2 h-4 w-4" /> {t("admin.users.inviteUser")}
        </Link>
      </Button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("admin.users.inviteTitle")}</CardTitle>
              <Button type="button" variant="ghost" size="icon" asChild>
                <Link href="/admin/users">
                  <X className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
                  {t("admin.users.inviteSent")}
                </div>
              )}
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="invite-email" className="text-sm font-medium">{t("auth.email")} *</label>
                  <Input id="invite-email" name="email" type="email" placeholder="jean@gsl.lu" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="invite-role" className="text-sm font-medium">{t("admin.users.role")}</label>
                  <select
                    id="invite-role" name="role" defaultValue="member"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="admin">{t("roles.admin")}</option>
                    <option value="manager">{t("roles.manager")}</option>
                    <option value="member">{t("roles.member")}</option>
                    <option value="viewer">{t("roles.viewer")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="invite-entity" className="text-sm font-medium">{t("admin.users.entity")}</label>
                  <select
                    id="invite-entity" name="entity" defaultValue=""
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">{t("admin.users.noEntity")}</option>
                    <option value="gsl_fiduciaire">{t("entity.gslFiduciaire")}</option>
                    <option value="gsl_revision">{t("entity.gslRevision")}</option>
                    <option value="both">{t("entity.both")}</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link href="/admin/users">{t("common.cancel")}</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || success}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("admin.users.sendInvitation")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
