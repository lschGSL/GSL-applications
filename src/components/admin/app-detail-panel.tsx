"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  LayoutGrid,
  ExternalLink,
  Globe,
  Building,
  Calendar,
  Clock,
  Archive,
  CheckCircle,
  Trash2,
  Loader2,
  Pencil,
  Link as LinkIcon,
  Tag,
  FileText,
  ImageIcon,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Application, GslEntity } from "@/types/database";

const visibilityOptions = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
  { value: "both", label: "Both" },
];

const entityOptions: { value: string; label: string }[] = [
  { value: "", label: "All entities" },
  { value: "gsl_fiduciaire", label: "GSL Fiduciaire" },
  { value: "gsl_revision", label: "GSL Révision" },
  { value: "both", label: "Both" },
];

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
        setError(data.error || "Failed to update");
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
        setError(data.error || "Failed to update");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error");
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
        setError(data.error || "Failed to delete");
        return;
      }
      router.refresh();
      onClose();
    } finally {
      setLoading(null);
    }
  }

  const entityLabel = app.entity === "gsl_fiduciaire" ? "GSL Fiduciaire" : app.entity === "gsl_revision" ? "GSL Révision" : app.entity === "both" ? "Both entities" : "All entities";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l bg-background shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">Application Details</h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {editing ? (
            /* ===== EDIT MODE ===== */
            <form action={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input name="name" defaultValue={app.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug *</label>
                <Input name="slug" defaultValue={app.slug} required pattern="[a-z0-9-]+" />
                <p className="text-xs text-muted-foreground">Unique identifier (lowercase, hyphens only)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL *</label>
                <Input name="url" type="url" defaultValue={app.url} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input name="description" defaultValue={app.description || ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon URL</label>
                <Input name="icon_url" type="url" defaultValue={app.icon_url || ""} placeholder="https://example.com/icon.png" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <select
                  name="visibility"
                  defaultValue={app.visibility}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Entity</label>
                <select
                  name="entity"
                  defaultValue={app.entity || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">All entities</option>
                  <option value="gsl_fiduciaire">GSL Fiduciaire</option>
                  <option value="gsl_revision">GSL Révision</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setEditing(false); setError(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading === "edit"}>
                  {loading === "edit" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            /* ===== VIEW MODE ===== */
            <>
              {/* App header */}
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
                      {app.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">{app.visibility}</Badge>
                  </div>
                </div>
              </div>

              {/* Info fields */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">URL</p>
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      {app.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {app.description && (
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                      <p className="text-sm">{app.description}</p>
                    </div>
                  </div>
                )}

                {app.icon_url && (
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <ImageIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Icon</p>
                      <p className="text-sm truncate text-muted-foreground">{app.icon_url}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Properties */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Globe className="h-3 w-3" />
                      Visibility
                    </div>
                    <p className="text-sm font-medium capitalize">{app.visibility}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Building className="h-3 w-3" />
                      Entity
                    </div>
                    <p className="text-sm font-medium">{entityLabel}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3" />
                      Created
                    </div>
                    <p className="text-sm font-medium">{formatDate(app.created_at)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      Last updated
                    </div>
                    <p className="text-sm font-medium">{formatDate(app.updated_at)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Visibility selector */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Visibility
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {visibilityOptions.map((opt) => {
                    const isCurrent = app.visibility === opt.value;
                    const isLoading = loading === `vis-${opt.value}`;
                    return (
                      <button
                        key={opt.value}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                          isCurrent
                            ? "bg-primary/5 border-primary/30 font-medium text-primary ring-1 ring-primary/20"
                            : "border-border hover:bg-accent disabled:opacity-40"
                        }`}
                        disabled={isCurrent || loading !== null}
                        onClick={() => updateApp({ visibility: opt.value }, `vis-${opt.value}`)}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Entity selector */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Entity
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {entityOptions.map((opt) => {
                    const isCurrent = (app.entity || "") === opt.value;
                    const isLoading = loading === `entity-${opt.value}`;
                    return (
                      <button
                        key={opt.value}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                          isCurrent
                            ? "bg-primary/5 border-primary/30 font-medium text-primary ring-1 ring-primary/20"
                            : "border-border hover:bg-accent disabled:opacity-40"
                        }`}
                        disabled={isCurrent || loading !== null}
                        onClick={() => updateApp({ entity: opt.value || null }, `entity-${opt.value}`)}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Building className="h-4 w-4" />
                        )}
                        {opt.label}
                        {isCurrent && (
                          <span className="ml-auto text-[10px] uppercase font-semibold opacity-60">Current</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Status</h4>
                {app.is_active ? (
                  <Button
                    variant="outline"
                    className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                    disabled={loading !== null}
                    onClick={() => updateApp({ is_active: false }, "archive")}
                  >
                    {loading === "archive" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="mr-2 h-4 w-4" />
                    )}
                    Archive Application
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10"
                    disabled={loading !== null}
                    onClick={() => updateApp({ is_active: true }, "reactivate")}
                  >
                    {loading === "reactivate" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Reactivate Application
                  </Button>
                )}
              </div>

              {/* Danger zone */}
              <div className="pt-2 border-t">
                <h4 className="text-sm font-semibold text-destructive mb-3">Danger Zone</h4>
                {showDeleteConfirm ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                    <p className="text-sm">
                      Delete <strong>{app.name}</strong>? This will also remove all access records. This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={loading === "delete"}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={deleteApp}
                        disabled={loading === "delete"}
                      >
                        {loading === "delete" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Application
                  </Button>
                )}
              </div>

              {/* ID */}
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
