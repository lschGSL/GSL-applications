"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  X, Mail, Calendar, FolderPlus, Loader2,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { DocumentBrowser } from "@/components/documents/document-browser";
import { useI18n } from "@/lib/i18n/context";
import type { Profile, DocumentFolder, Document as DocType } from "@/types/database";

export function ClientDetailPanel({
  client,
  onClose,
}: {
  client: Profile;
  onClose: () => void;
}) {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderLoading, setFolderLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [fRes, dRes] = await Promise.all([
        fetch(`/api/documents/folders?client_id=${client.id}`),
        fetch(`/api/documents?client_id=${client.id}`),
      ]);
      if (fRes.ok) setFolders(await fRes.json());
      if (dRes.ok) setDocuments(await dRes.json());
      setLoading(false);
    }
    load();
  }, [client.id]);

  async function createFolder(formData: FormData) {
    setFolderLoading(true);
    const name = formData.get("folder_name") as string;
    const type = formData.get("folder_type") as string;
    const year = formData.get("folder_year") as string;

    await fetch("/api/documents/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        client_id: client.id,
        type: type || null,
        exercise_year: year ? parseInt(year) : null,
      }),
    });

    // Reload
    const res = await fetch(`/api/documents/folders?client_id=${client.id}`);
    if (res.ok) setFolders(await res.json());
    setFolderLoading(false);
    setShowCreateFolder(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto border-l bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">Client Documents</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {client.avatar_url && <AvatarImage src={client.avatar_url} />}
              <AvatarFallback className="text-lg">
                {getInitials(client.full_name || client.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{client.full_name || t("common.noName")}</h3>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-sm truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={client.is_active ? "success" : "destructive"} className="text-xs">
                  {client.is_active ? t("common.active") : t("common.inactive")}
                </Badge>
                {client.entity && (
                  <Badge variant="outline" className="text-xs">
                    {client.entity === "gsl_fiduciaire" ? t("entity.fiduciaire") : client.entity === "gsl_revision" ? t("entity.revision") : t("entity.both")}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(client.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Create folder */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateFolder(!showCreateFolder)}>
              <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
              {t("documents.createFolder")}
            </Button>
          </div>

          {showCreateFolder && (
            <Card>
              <CardContent className="p-4">
                <form action={createFolder} className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[150px] space-y-1">
                    <label className="text-xs font-medium">{t("documents.folderName")}</label>
                    <Input name="folder_name" placeholder="Bilan 2025" required />
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-xs font-medium">Type</label>
                    <select name="folder_type" className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                      <option value="">—</option>
                      <option value="bilan">Bilan</option>
                      <option value="tva">TVA</option>
                      <option value="salaires">Salaires</option>
                      <option value="general">General</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-xs font-medium">{t("documents.exerciseYear")}</label>
                    <Input name="folder_year" type="number" placeholder="2025" />
                  </div>
                  <Button size="sm" type="submit" disabled={folderLoading}>
                    {folderLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    {t("common.create")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Document browser */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DocumentBrowser
              folders={folders}
              documents={documents}
              clientId={client.id}
              isAdmin
            />
          )}
        </div>
      </div>
    </>
  );
}
