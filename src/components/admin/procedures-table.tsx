"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, EyeOff, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/procedures/category-badge";
import { formatDate } from "@/lib/utils";
import type { Procedure, ProcedureStatus } from "@/types/procedures";

const STATUS_VARIANTS: Record<ProcedureStatus, { label: string; variant: "default" | "secondary" | "outline" | "warning" | "success" }> = {
  draft: { label: "Brouillon", variant: "warning" },
  published: { label: "Publiée", variant: "success" },
  archived: { label: "Archivée", variant: "secondary" },
};

export function ProceduresTable({ procedures }: { procedures: Procedure[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function togglePublish(p: Procedure) {
    setBusyId(p.id);
    const nextStatus: ProcedureStatus =
      p.status === "published" ? "draft" : "published";
    try {
      await fetch(`/api/admin/procedures/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: Procedure) {
    if (!confirm(`Supprimer définitivement « ${p.title} » ?`)) return;
    setBusyId(p.id);
    try {
      await fetch(`/api/admin/procedures/${p.id}`, { method: "DELETE" });
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  if (procedures.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Aucune procédure pour le moment. Cliquez sur « Nouvelle procédure » pour en créer une.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Numéro</th>
            <th className="px-4 py-3 font-medium">Titre</th>
            <th className="px-4 py-3 font-medium">Catégorie</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Version</th>
            <th className="px-4 py-3 font-medium">MAJ</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {procedures.map((p) => {
            const status = STATUS_VARIANTS[p.status];
            const busy = busyId === p.id || isPending;
            return (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{p.number}</td>
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">
                  <CategoryBadge category={p.category} />
                </td>
                <td className="px-4 py-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.version}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(p.updated_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublish(p)}
                      disabled={busy}
                      title={p.status === "published" ? "Dépublier" : "Publier"}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : p.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" asChild title="Éditer">
                      <Link href={`/admin/procedures/${p.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(p)}
                      disabled={busy}
                      title="Supprimer"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
