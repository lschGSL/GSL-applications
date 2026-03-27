"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Folder, FileText, Download, Upload, Trash2, CheckCircle, XCircle,
  Loader2, ChevronRight, ArrowLeft, FileSpreadsheet, Image, PenLine, ShieldCheck, Send,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DocumentStatusBadge } from "./document-status-badge";
import { UploadDialog } from "./upload-dialog";
import { SignDialog } from "./sign-dialog";
import { SendForSignatureDialog } from "./send-for-signature-dialog";
import { useI18n } from "@/lib/i18n/context";
import type { Document, DocumentFolder, DocumentStatus, FolderType } from "@/types/database";

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-blue-500" />;
  return <FileText className="h-5 w-5 text-muted-foreground" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const folderTypeColors: Record<FolderType, string> = {
  bilan: "bg-blue-500/10 text-blue-600",
  tva: "bg-purple-500/10 text-purple-600",
  salaires: "bg-amber-500/10 text-amber-600",
  general: "bg-gray-500/10 text-gray-600",
  other: "bg-gray-500/10 text-gray-500",
};

export function DocumentBrowser({
  folders,
  documents,
  clientId,
  isAdmin = false,
}: {
  folders: DocumentFolder[];
  documents: Document[];
  clientId: string;
  isAdmin?: boolean;
}) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [signingDoc, setSigningDoc] = useState<{ id: string; name: string } | null>(null);
  const [sendForSigDoc, setSendForSigDoc] = useState<{ id: string; name: string; clientId: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  // Build breadcrumb path
  const breadcrumbs: DocumentFolder[] = [];
  let crumbId = currentFolderId;
  while (crumbId) {
    const folder = folders.find((f) => f.id === crumbId);
    if (!folder) break;
    breadcrumbs.unshift(folder);
    crumbId = folder.parent_id;
  }

  // Filter folders/docs for current level
  const currentFolders = folders.filter((f) => f.parent_id === currentFolderId);
  const currentDocs = documents.filter((d) => d.folder_id === currentFolderId);

  // Count docs per folder
  function countDocsInFolder(folderId: string): number {
    const directDocs = documents.filter((d) => d.folder_id === folderId).length;
    const subFolders = folders.filter((f) => f.parent_id === folderId);
    return directDocs + subFolders.reduce((acc, sf) => acc + countDocsInFolder(sf.id), 0);
  }

  async function updateDocStatus(docId: string, status: DocumentStatus) {
    setActionLoading(docId);
    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function requestSignature(docId: string) {
    setActionLoading(docId);
    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_required: true }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteDoc(docId: string) {
    setActionLoading(docId);
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            onClick={() => setCurrentFolderId(null)}
          >
            {t("documents.allFiles")}
          </button>
          {breadcrumbs.map((bc) => (
            <span key={bc.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setCurrentFolderId(bc.id)}
              >
                {bc.name}
              </button>
            </span>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {t("documents.upload")}
        </Button>
      </div>

      {/* Back button */}
      {currentFolderId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const parent = folders.find((f) => f.id === currentFolderId);
            setCurrentFolderId(parent?.parent_id ?? null);
          }}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {t("common.previous")}
        </Button>
      )}

      {/* Folders */}
      {currentFolders.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currentFolders.map((folder) => (
            <Card
              key={folder.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => setCurrentFolderId(folder.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Folder className="h-8 w-8 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{folder.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {folder.type && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${folderTypeColors[folder.type]}`}>
                          {folder.type.toUpperCase()}
                        </span>
                      )}
                      {folder.exercise_year && (
                        <span className="text-xs text-muted-foreground">{folder.exercise_year}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {countDocsInFolder(folder.id)} docs
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents table */}
      {currentDocs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("documents.title")}
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common.status")}
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.apps.created")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.mime_type)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <DocumentStatusBadge status={doc.status as DocumentStatus} />
                        {doc.signed_at && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <ShieldCheck className="h-3 w-3 text-green-600" />
                            {t("signatures.signed")}
                          </Badge>
                        )}
                        {doc.signature_required && !doc.signed_at && (
                          <Badge variant="warning" className="text-xs gap-1">
                            <PenLine className="h-3 w-3" />
                            {t("signatures.signatureRequired")}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/documents/${doc.id}/download`, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!doc.signed_at && doc.signature_required && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                            onClick={() => setSigningDoc({ id: doc.id, name: doc.name })}
                            title={t("signatures.sign")}
                          >
                            <PenLine className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && actionLoading !== doc.id && (
                          <>
                            {!doc.signed_at && (
                              <Button variant="ghost" size="sm" className="text-amber-600" title={t("signatures.sendForSignature")} onClick={() => setSendForSigDoc({ id: doc.id, name: doc.name, clientId: doc.client_id })}>
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {doc.status !== "approved" && (
                              <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateDocStatus(doc.id, "approved")}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {doc.status !== "rejected" && (
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateDocStatus(doc.id, "rejected")}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDoc(doc.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {actionLoading === doc.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : currentFolders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t("documents.noDocuments")}</p>
          </CardContent>
        </Card>
      ) : null}

      {showUpload && (
        <UploadDialog
          clientId={clientId}
          folderId={currentFolderId}
          onClose={() => setShowUpload(false)}
        />
      )}

      {signingDoc && (
        <SignDialog
          documentId={signingDoc.id}
          documentName={signingDoc.name}
          onClose={() => setSigningDoc(null)}
        />
      )}

      {sendForSigDoc && (
        <SendForSignatureDialog
          documentId={sendForSigDoc.id}
          documentName={sendForSigDoc.name}
          clientId={sendForSigDoc.clientId}
          onClose={() => setSendForSigDoc(null)}
        />
      )}
    </div>
  );
}
