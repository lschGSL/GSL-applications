"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { DocumentFolder } from "@/types/database";

export function CreateRequestDialog({
  clientId,
  folders,
  onClose,
}: {
  clientId: string;
  folders: DocumentFolder[];
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const folder_id = formData.get("folder_id") as string;
    const due_date = formData.get("due_date") as string;

    try {
      const res = await fetch("/api/documents/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          title,
          description: description || null,
          folder_id: folder_id || null,
          due_date: due_date || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create request");
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(onClose, 1000);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("requests.createRequest")}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {success ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <Send className="h-10 w-10 text-green-600" />
              <p className="text-sm font-medium text-green-600">{t("requests.sent")}</p>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("requests.documentTitle")} *</label>
                <Input name="title" placeholder={t("requests.titlePlaceholder")} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.apps.description")}</label>
                <Input name="description" placeholder={t("requests.descPlaceholder")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("documents.folders")}</label>
                <select
                  name="folder_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">—</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}{f.exercise_year ? ` (${f.exercise_year})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("requests.dueDate")}</label>
                <Input name="due_date" type="date" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("requests.send")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
