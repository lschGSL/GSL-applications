"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ArrowUp,
  ArrowDown,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DomainBadge } from "@/components/domains/domain-badge";
import { DOMAIN_COLORS } from "@/lib/domains";
import type { Domain, DomainColor } from "@/types/database";

type FormState = {
  name: string;
  slug: string;
  color: DomainColor;
  icon: string;
  sort_order: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  color: "gray",
  icon: "",
  sort_order: "0",
  is_active: true,
};

function toForm(d: Domain): FormState {
  return {
    name: d.name,
    slug: d.slug,
    color: d.color,
    icon: d.icon ?? "",
    sort_order: String(d.sort_order),
    is_active: d.is_active,
  };
}

export function DomainsManager({ initialDomains }: { initialDomains: Domain[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // null | "new" | id
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing("new");
    setForm({ ...EMPTY_FORM, sort_order: String(initialDomains.length + 1) });
    setError(null);
  }

  function openEdit(d: Domain) {
    setEditing(d.id);
    setForm(toForm(d));
    setError(null);
  }

  function closeForm() {
    setEditing(null);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Le nom et le slug sont obligatoires.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      color: form.color,
      icon: form.icon.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    try {
      const res =
        editing === "new"
          ? await fetch("/api/admin/domains", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/admin/domains/${editing}`, {
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

  async function patchSilent(id: string, patch: Record<string, unknown>, errorPrefix: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/domains/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`${errorPrefix} : ${j.error || "échec."}`);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      alert(`${errorPrefix} : erreur réseau.`);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(d: Domain) {
    await patchSilent(
      d.id,
      { is_active: !d.is_active },
      d.is_active ? "Archivage impossible" : "Réactivation impossible",
    );
  }

  // Swap sort_order entre deux domaines voisins.
  async function move(d: Domain, direction: "up" | "down") {
    const sorted = [...initialDomains].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((x) => x.id === d.id);
    const target = direction === "up" ? sorted[idx - 1] : sorted[idx + 1];
    if (!target) return;
    setBusyId(d.id);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/domains/${d.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: target.sort_order }),
        }),
        fetch(`/api/admin/domains/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: d.sort_order }),
        }),
      ]);
      if (!r1.ok || !r2.ok) {
        alert("Réordonnancement échoué.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      alert("Réordonnancement : erreur réseau.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(d: Domain) {
    const total = d.total_count ?? 0;
    if (total > 0) {
      alert(
        `Suppression impossible : ${total} élément(s) rattaché(s) à « ${d.name} ». Archivez-le ou détachez-les d'abord.`,
      );
      return;
    }
    if (!confirm(`Supprimer définitivement le domaine « ${d.name} » ?`)) return;
    setBusyId(d.id);
    try {
      const res = await fetch(`/api/admin/domains/${d.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        alert(j.error || "Suppression échouée.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      alert("Erreur réseau.");
    } finally {
      setBusyId(null);
    }
  }

  const sortedDomains = [...initialDomains].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Domaines</CardTitle>
        {editing === null && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau domaine
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing !== null && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {editing === "new" ? "Nouveau domaine" : "Modifier le domaine"}
              </p>
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Nom *</span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ex. Odoo"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Slug *</span>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="ex. odoo"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Couleur</span>
                <select
                  value={form.color}
                  onChange={(e) =>
                    setForm({ ...form, color: e.target.value as DomainColor })
                  }
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DOMAIN_COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Icône (slug)</span>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="ex. database"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Ordre</span>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span>Domaine actif</span>
              </label>
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Aperçu :</span>
                <div className="mt-1">
                  <DomainBadge domain={{ name: form.name || "Nom du domaine", color: form.color }} />
                </div>
              </div>
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

        {sortedDomains.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Ordre</th>
                  <th className="px-4 py-3 font-medium">Domaine</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedDomains.map((d, idx) => {
                  const busy = busyId === d.id || isPending;
                  const p = d.procedure_count ?? 0;
                  const dec = d.decision_count ?? 0;
                  const f = d.formation_count ?? 0;
                  const total = d.total_count ?? p + dec + f;
                  return (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-3 py-3 text-muted-foreground">
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={busy || idx === 0}
                            onClick={() => move(d, "up")}
                            title="Monter"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={busy || idx === sortedDomains.length - 1}
                            onClick={() => move(d, "down")}
                            title="Descendre"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <span className="ml-1 text-xs">{d.sort_order}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <DomainBadge domain={d} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {d.slug}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={d.is_active ? "success" : "secondary"}>
                          {d.is_active ? "Actif" : "Archivé"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span title={`${p} procédure(s), ${dec} décision(s), ${f} formation(s)`}>
                          {total} ({p}/{dec}/{f})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(d)}
                            disabled={busy}
                            title="Éditer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(d)}
                            disabled={busy}
                            title={d.is_active ? "Archiver" : "Réactiver"}
                          >
                            {d.is_active ? (
                              <Archive className="h-4 w-4" />
                            ) : (
                              <ArchiveRestore className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(d)}
                            disabled={busy}
                            title={
                              total > 0
                                ? "Domaine rattaché à des éléments"
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
            Aucun domaine. Cliquez sur « Nouveau domaine » pour en créer un.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
