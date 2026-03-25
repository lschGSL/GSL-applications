"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function AddAppDialog({ showDialog }: { showDialog: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const url = formData.get("url") as string;
    const description = formData.get("description") as string;
    const icon_url = formData.get("icon_url") as string;
    const visibility = formData.get("visibility") as string;
    const entity = formData.get("entity") as string;

    try {
      const res = await fetch("/api/admin/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, url, description, icon_url: icon_url || null, visibility, entity: entity || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("admin.apps.failedCreate"));
        setLoading(false);
        return;
      }

      router.push("/admin/apps");
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" asChild>
        <Link href="/admin/apps?add=true">
          <Plus className="mr-2 h-4 w-4" /> {t("admin.apps.addApp")}
        </Link>
      </Button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("admin.apps.registerApp")}</CardTitle>
              <Button type="button" variant="ghost" size="icon" asChild>
                <Link href="/admin/apps">
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
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="app-name" className="text-sm font-medium">{t("admin.apps.name")} *</label>
                  <Input
                    id="app-name" name="name" placeholder="My Application" required
                    onChange={(e) => {
                      const slugInput = document.getElementById("app-slug") as HTMLInputElement;
                      if (slugInput && !slugInput.dataset.manual) {
                        slugInput.value = generateSlug(e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-slug" className="text-sm font-medium">{t("admin.apps.slug")} *</label>
                  <Input
                    id="app-slug" name="slug" placeholder="my-application" required pattern="[a-z0-9-]+"
                    onKeyDown={(e) => { (e.target as HTMLInputElement).dataset.manual = "true"; }}
                  />
                  <p className="text-xs text-muted-foreground">{t("admin.apps.slugHint")}</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-url" className="text-sm font-medium">{t("admin.apps.url")} *</label>
                  <Input id="app-url" name="url" type="url" placeholder="https://app.gsl.lu" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-description" className="text-sm font-medium">{t("admin.apps.description")}</label>
                  <Input id="app-description" name="description" placeholder={t("admin.apps.descPlaceholder")} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-icon-url" className="text-sm font-medium">{t("admin.apps.iconUrl")}</label>
                  <Input id="app-icon-url" name="icon_url" type="url" placeholder="https://example.com/icon.png" />
                  <p className="text-xs text-muted-foreground">{t("admin.apps.iconHint")}</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-visibility" className="text-sm font-medium">{t("admin.apps.visibility")}</label>
                  <select
                    id="app-visibility" name="visibility" defaultValue="internal"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="internal">{t("admin.apps.internal")}</option>
                    <option value="external">{t("admin.apps.external")}</option>
                    <option value="both">{t("entity.both")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-entity" className="text-sm font-medium">{t("admin.users.entity")}</label>
                  <select
                    id="app-entity" name="entity" defaultValue=""
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">{t("admin.apps.allEntities")}</option>
                    <option value="gsl_fiduciaire">{t("entity.gslFiduciaire")}</option>
                    <option value="gsl_revision">{t("entity.gslRevision")}</option>
                    <option value="both">{t("entity.both")}</option>
                  </select>
                  <p className="text-xs text-muted-foreground">{t("admin.apps.entityHint")}</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link href="/admin/apps">{t("common.cancel")}</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("admin.apps.registerApp")}
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
