"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProcedureCategory } from "@/types/database";

type FormState = {
  slug: string;
  name: string;
  icon: string;
  sort_order: string;
  published: boolean;
  placeholder: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  icon: "",
  sort_order: "0",
  published: false,
  placeholder: "",
};

function toForm(c: ProcedureCategory): FormState {
  return {
    slug: c.slug,
    name: c.name,
    icon: c.icon ?? "",
    sort_order: String(c.sort_order),
    published: c.published,
    placeholder: c.placeholder ?? "",
  };
}

export function ProcedureCategoriesManager({
  initialCategories,
  countByCategory,
}: {
  initialCategories: ProcedureCategory[];
  countByCategory: Record<string, number>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  // null = aucun formulaire ouvert ; "new" = création ; sinon = id en édition.
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing("new");
    setForm(EMPTY_FORM);
    setError(null);
  }

  function openEdit(c: ProcedureCategory) {
    setEditing(c.id);
    setForm(toForm(c));
    setError(null);
  }

  function closeForm() {
    setEditing(null);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!form.slug.trim() || !form.name.trim()) {
      setError("Le slug et le nom sont obligatoires.");
      return;
    }
    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      icon: form.icon.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      published: form.published,
      placeholder: form.placeholder.trim() || null,
    };
    try {
      const res =
        editing === "new"
          ? await fetch("/api/admin/procedure-categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/admin/procedure-categories/${editing}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error || "Échec de l'enregistrement.");
        return;
      }
      closeForm();
      startTransition(() => router.refresh());
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: ProcedureCategory) {
    const count = countByCategory[c.id] ?? 0;
    // Guard côté client : la suppression d'une catégorie rattachée
    // est aussi refusée par l'API (les procédures ne sont jamais supprimées).
    if (count > 0) {
      alert(
        `Suppression impossible : ${count} procédure(s) sont rattachée(s) à « ${c.name} ». Détachez-les d'abord.`,
      );
      return;
    }
    if (!confirm(`Supprimer définitivement la catégorie « ${c.name} » ?`)) {
      return;
    }
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/admin/procedure-categories/${c.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        alert(j.error || "Échec de la suppression.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      alert("Erreur réseau.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Catégories de procédures</CardTitle>
        {editing === null && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle catégorie
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing !== null && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {editing === "new"
                  ? "Nouvelle catégorie"
                  : "Modifier la catégorie"}
              </p>
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Slug *</span>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="ex. dashboard-rentabilite"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Nom *</span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ex. Dashboard & rentabilité"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Icône (slug lucide)</span>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="ex. chart-bar"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Ordre</span>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: e.target.value })
                  }
                />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">
                  Placeholder (texte affiché si non publiée)
                </span>
                <Input
                  value={form.placeholder}
                  onChange={(e) =>
                    setForm({ ...form, placeholder: e.target.value })
                  }
                  placeholder="ex. Cette section accueillera prochainement…"
                />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) =>
                    setForm({ ...form, published: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <span>Catégorie publiée</span>
              </label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={closeForm} disabled={saving}>
                Annuler
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        )}

        {initialCategories.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Ordre</th>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Procédures</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialCategories.map((c) => {
                  const count = countByCategory[c.id] ?? 0;
                  const busy = busyId === c.id || isPending;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.sort_order}
                      </td>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.slug}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.published ? "success" : "warning"}>
                          {c.published ? "Publiée" : "Brouillon"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(c)}
                            disabled={busy}
                            title="Éditer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(c)}
                            disabled={busy}
                            title={
                              count > 0
                                ? "Catégorie rattachée à des procédures"
                                : "Supprimer"
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Aucune catégorie. Cliquez sur « Nouvelle catégorie » pour en créer une.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
