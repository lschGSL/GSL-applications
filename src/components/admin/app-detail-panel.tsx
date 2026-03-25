"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  X, LayoutGrid, ExternalLink, Globe, Building, Calendar, Clock,
  Archive, CheckCircle, Trash2, Loader2, Pencil, Link as LinkIcon, FileText, ImageIcon,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { Application } from "@/types/database";

export function AppDetailPanel({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const visibilityOptions = [
    { value: "internal", label: t("admin.apps.internal") },
    { value: "external", label: t("admin.apps.external") },
    { value: "both", label: t("entity.both") },
  ];

  const entityOptions = [
    { value: "", label: t("admin.apps.allEntities") },
    { value: "gsl_fiduciaire", label: t("entity.gslFiduciaire") },
    { value: "gsl_revision", label: t("entity.gslRevision") },
    { value: "both", label: t("entity.both") },
  ];

  async function updateApp(updates: Record<string, unknown>, key: string) {
    setLoading(key);
    setError(null);
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("admin.apps.failedUpdate"));
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleEditSubmit(formData: FormData) {
    setLoading("edit");
    setError(null);
    const updates = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      url: formData.get("url") as string,
      description: (formData.get("description") as string) || null,
      icon_url: (formData.get("icon_url") as string) || null,
      visibility: formData.get("visibility") as string,
      entity: (formData.get("entity") as string) || null,
    };
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("admin.apps.failedUpdate"));
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(null);
    }
  }

  async function deleteApp() {
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("admin.apps.failedDelete"));
        return;
      }
      router.refresh();
      onClose();
    } finally {
      setLoading(null);
    }
  }

  const entityLabel = app.entity === "gsl_fiduciaire" ? t("entity.gslFiduciaire") : app.entity === "gsl_revision" ? t("entity.gslRevision") : app.entity === "both" ? t("entity.both") : t("admin.apps.allEntities");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">{t("admin.apps.appDetails")}</h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {t("common.edit")}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {editing ? (
            <form action={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.apps.name")} *</label>
                <Input name="name" defaultValue={app.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.apps.slug")} *</label>
                <Input name="slug" defaultValue={app.slug} required pattern="[a-z0-9-]+" />
                <p className="text-xs text-muted-foreground">{t("admin.apps.slugHint")}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.apps.url")} *</label>
                <Input name="url" type="url" defaultValue={app.url} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.apps.description")}</label>
                <Input name="description" defaultValue={app.description || ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.apps.iconUrl")}</label>
                <Input name="icon_url" type="url" defaultValue={app.icon_url || ""} placeholder="https://example.com/icon.png" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.apps.visibility")}</label>
                <select name="visibility" defaultValue={app.visibility} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="internal">{t("admin.apps.internal")}</option>
                  <option value="external">{t("admin.apps.external")}</option>
                  <option value="both">{t("entity.both")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.users.entity")}</label>
                <select name="entity" defaultValue={app.entity || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">{t("admin.apps.allEntities")}</option>
                  <option value="gsl_fiduciaire">{t("entity.gslFiduciaire")}</option>
                  <option value="gsl_revision">{t("entity.gslRevision")}</option>
                  <option value="both">{t("entity.both")}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setEditing(false); setError(null); }}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" className="flex-1" disabled={loading === "edit"}>
                  {loading === "edit" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("admin.apps.saveChanges")}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
                  {app.icon_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={app.icon_url} alt="" className="h-16 w-16 object-cover rounded-xl" />
                  ) : (
                    <LayoutGrid className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold truncate">{app.name}</h3>
                  <p className="text-sm font-mono text-muted-foreground">{app.slug}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={app.is_active ? "success" : "destructive"}>
                      {app.is_active ? t("common.active") : t("common.inactive")}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">{app.visibility}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("admin.apps.url")}</p>
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1 truncate">
                      {app.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
                {app.description && (
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{t("admin.apps.description")}</p>
                      <p className="text-sm">{app.description}</p>
                    </div>
                  </div>
                )}
                {app.icon_url && (
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <ImageIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">{t("admin.apps.icon")}</p>
                      <p className="text-sm truncate text-muted-foreground">{app.icon_url}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Globe className="h-3 w-3" />{t("admin.apps.visibility")}</div><p className="text-sm font-medium capitalize">{app.visibility}</p></CardContent></Card>
                <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Building className="h-3 w-3" />{t("admin.users.entity")}</div><p className="text-sm font-medium">{entityLabel}</p></CardContent></Card>
                <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Calendar className="h-3 w-3" />{t("admin.apps.created")}</div><p className="text-sm font-medium">{formatDate(app.created_at)}</p></CardContent></Card>
                <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Clock className="h-3 w-3" />{t("admin.apps.lastUpdated")}</div><p className="text-sm font-medium">{formatDate(app.updated_at)}</p></CardContent></Card>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Globe className="h-4 w-4" />{t("admin.apps.visibility")}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {visibilityOptions.map((opt) => {
                    const isCurrent = app.visibility === opt.value;
                    const isLoading = loading === `vis-${opt.value}`;
                    return (
                      <button key={opt.value} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${isCurrent ? "bg-primary/5 border-primary/30 font-medium text-primary ring-1 ring-primary/20" : "border-border hover:bg-accent disabled:opacity-40"}`} disabled={isCurrent || loading !== null} onClick={() => updateApp({ visibility: opt.value }, `vis-${opt.value}`)}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building className="h-4 w-4" />{t("admin.users.entity")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {entityOptions.map((opt) => {
                    const isCurrent = (app.entity || "") === opt.value;
                    const isLoading = loading === `entity-${opt.value}`;
                    return (
                      <button key={opt.value} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-all ${isCurrent ? "bg-primary/5 border-primary/30 font-medium text-primary ring-1 ring-primary/20" : "border-border hover:bg-accent disabled:opacity-40"}`} disabled={isCurrent || loading !== null} onClick={() => updateApp({ entity: opt.value || null }, `entity-${opt.value}`)}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building className="h-4 w-4" />}
                        {opt.label}
                        {isCurrent && <span className="ml-auto text-[10px] uppercase font-semibold opacity-60">{t("common.current")}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">{t("common.status")}</h4>
                {app.is_active ? (
                  <Button variant="outline" className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10" disabled={loading !== null} onClick={() => updateApp({ is_active: false }, "archive")}>
                    {loading === "archive" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                    {t("admin.apps.archiveApp")}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10" disabled={loading !== null} onClick={() => updateApp({ is_active: true }, "reactivate")}>
                    {loading === "reactivate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {t("admin.apps.reactivateApp")}
                  </Button>
                )}
              </div>

              <div className="pt-2 border-t">
                <h4 className="text-sm font-semibold text-destructive mb-3">{t("admin.apps.dangerZone")}</h4>
                {showDeleteConfirm ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                    <p className="text-sm">{t("admin.apps.deleteConfirm", { name: app.name })}</p>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDeleteConfirm(false)} disabled={loading === "delete"}>
                        {t("common.cancel")}
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={deleteApp} disabled={loading === "delete"}>
                        {loading === "delete" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("admin.apps.deleteApp")}
                  </Button>
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground font-mono">ID: {app.id}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
