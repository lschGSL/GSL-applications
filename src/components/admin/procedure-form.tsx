"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  PROCEDURE_CATEGORIES,
  PROCEDURE_CATEGORY_LABELS,
  PROCEDURE_STATUSES,
  type Procedure,
  type ProcedureCategory,
  type ProcedureStatus,
} from "@/types/procedures";
import { ProcedureMarkdown } from "@/components/procedures/procedure-markdown";

const STATUS_LABELS: Record<ProcedureStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
  archived: "Archivée",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface ProcedureFormProps {
  mode: "create" | "edit";
  initial?: Procedure;
}

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProcedureForm({ mode, initial }: ProcedureFormProps) {
  const router = useRouter();
  const slugRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [category, setCategory] = useState<ProcedureCategory>(
    initial?.category ?? "portal",
  );
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [version, setVersion] = useState(initial?.version ?? "1.0");
  const [owner, setOwner] = useState(initial?.owner ?? "");
  const [status, setStatus] = useState<ProcedureStatus>(
    initial?.status ?? "draft",
  );

  const [view, setView] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugManual = useMemo(() => slug !== slugify(title), [slug, title]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManual || slug.length === 0) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      number: number.trim(),
      slug: slug.trim(),
      title: title.trim(),
      category,
      summary: summary.trim() || null,
      content,
      version: version.trim() || "1.0",
      owner: owner.trim() || null,
      status,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/procedures"
          : `/api/admin/procedures/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Échec de l'enregistrement");
        setLoading(false);
        return;
      }

      router.push("/admin/procedures");
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="proc-number" className="text-sm font-medium">
            Numéro *
          </label>
          <Input
            id="proc-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="PRO-DAH-001"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="proc-version" className="text-sm font-medium">
            Version
          </label>
          <Input
            id="proc-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="proc-title" className="text-sm font-medium">
          Titre *
        </label>
        <Input
          id="proc-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Accès au Dashboard Rentabilité GSL"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="proc-slug" className="text-sm font-medium">
          Slug *
        </label>
        <Input
          id="proc-slug"
          ref={slugRef}
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          placeholder="pro-dah-001"
          pattern="[a-z0-9-]+"
          required
        />
        <p className="text-xs text-muted-foreground">
          Identifiant URL (généré automatiquement depuis le titre, éditable).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="proc-category" className="text-sm font-medium">
            Catégorie *
          </label>
          <select
            id="proc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProcedureCategory)}
            className={SELECT_CLASS}
            required
          >
            {PROCEDURE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PROCEDURE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="proc-status" className="text-sm font-medium">
            Statut *
          </label>
          <select
            id="proc-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProcedureStatus)}
            className={SELECT_CLASS}
            required
          >
            {PROCEDURE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="proc-owner" className="text-sm font-medium">
          Propriétaire
        </label>
        <Input
          id="proc-owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Luc Schmitt"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="proc-summary" className="text-sm font-medium">
          Résumé
        </label>
        <textarea
          id="proc-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          placeholder="Description courte affichée dans la liste des procédures."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="proc-content" className="text-sm font-medium">
            Contenu (Markdown)
          </label>
          <div className="inline-flex rounded-md border bg-muted p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setView("edit")}
              className={`rounded px-3 py-1 transition-colors ${
                view === "edit"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Éditer
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={`rounded px-3 py-1 transition-colors ${
                view === "preview"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Aperçu
            </button>
          </div>
        </div>

        {view === "edit" ? (
          <textarea
            id="proc-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ minHeight: 400 }}
            placeholder="## 1. Objectif&#10;..."
          />
        ) : (
          <Card>
            <CardContent className="py-6" style={{ minHeight: 400 }}>
              {content.trim().length > 0 ? (
                <ProcedureMarkdown content={content} />
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Aperçu vide — saisissez du contenu Markdown.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/procedures">Annuler</Link>
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Créer la procédure" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
