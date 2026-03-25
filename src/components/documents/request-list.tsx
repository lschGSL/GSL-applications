"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileUp, Clock, CheckCircle, XCircle, Upload, Loader2, AlertCircle, Ban,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { UploadDialog } from "./upload-dialog";
import { useI18n } from "@/lib/i18n/context";
import type { DocumentRequest, RequestStatus } from "@/types/database";

const statusConfig: Record<RequestStatus, { icon: React.ElementType; color: string; variant: "warning" | "default" | "success" | "destructive" | "secondary" }> = {
  pending: { icon: Clock, color: "text-amber-600", variant: "warning" },
  uploaded: { icon: FileUp, color: "text-blue-600", variant: "default" },
  approved: { icon: CheckCircle, color: "text-green-600", variant: "success" },
  rejected: { icon: XCircle, color: "text-red-600", variant: "destructive" },
  cancelled: { icon: Ban, color: "text-gray-500", variant: "secondary" },
};

export function RequestList({
  requests,
  clientId,
  isAdmin = false,
}: {
  requests: DocumentRequest[];
  clientId: string;
  isAdmin?: boolean;
}) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  async function handleUploadComplete(requestId: string, documentId: string) {
    // Link document to request
    await fetch(`/api/documents/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: documentId }),
    });
    setUploadingFor(null);
    router.refresh();
  }

  async function updateRequestStatus(requestId: string, status: RequestStatus) {
    setActionLoading(requestId);
    try {
      await fetch(`/api/documents/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">{t("requests.noRequests")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const config = statusConfig[req.status];
        const StatusIcon = config.icon;
        const isOverdue = req.due_date && new Date(req.due_date) < new Date() && req.status === "pending";

        return (
          <Card key={req.id} className={isOverdue ? "border-red-300 dark:border-red-800" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{req.title}</p>
                      {req.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                      )}
                    </div>
                    <Badge variant={config.variant} className="shrink-0 capitalize">
                      {t(`requests.status.${req.status}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(req.created_at)}</span>
                    {req.due_date && (
                      <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                        {t("requests.dueDate")}: {new Date(req.due_date).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>

                  {/* Client: upload button for pending requests */}
                  {!isAdmin && req.status === "pending" && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUploadingFor(req.id)}
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        {t("requests.uploadResponse")}
                      </Button>
                    </div>
                  )}

                  {/* Admin: approve/reject uploaded requests */}
                  {isAdmin && req.status === "uploaded" && actionLoading !== req.id && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300"
                        onClick={() => updateRequestStatus(req.id, "approved")}
                      >
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                        {t("documents.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30"
                        onClick={() => updateRequestStatus(req.id, "rejected")}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        {t("documents.reject")}
                      </Button>
                    </div>
                  )}

                  {/* Admin: cancel pending requests */}
                  {isAdmin && req.status === "pending" && actionLoading !== req.id && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => updateRequestStatus(req.id, "cancelled")}
                      >
                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                        {t("requests.cancel")}
                      </Button>
                    </div>
                  )}

                  {actionLoading === req.id && (
                    <div className="mt-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {uploadingFor && (
        <UploadForRequestDialog
          clientId={clientId}
          requestId={uploadingFor}
          onComplete={handleUploadComplete}
          onClose={() => setUploadingFor(null)}
        />
      )}
    </div>
  );
}

// Upload dialog that links the uploaded doc to a request
function UploadForRequestDialog({
  clientId,
  requestId,
  onComplete,
  onClose,
}: {
  clientId: string;
  requestId: string;
  onComplete: (requestId: string, documentId: string) => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const inputRef = useState<HTMLInputElement | null>(null);

  const ALLOWED_EXTENSIONS = [".pdf", ".xlsx", ".xls", ".png", ".jpg", ".jpeg"];

  function handleFile(f: File) {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(t("documents.allowedTypes") + ": PDF, Excel, PNG, JPEG");
      return;
    }
    setError(null);
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("client_id", clientId);
    formData.set("name", file.name);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }

      const doc = await res.json();
      onComplete(requestId, doc.id);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">{t("requests.uploadResponse")}</h3>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div
            className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ALLOWED_EXTENSIONS.join(",");
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) handleFile(f);
              };
              input.click();
            }}
          >
            <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm">{file ? file.name : t("documents.dragDrop")}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1" disabled={!file || loading} onClick={handleUpload}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("documents.upload")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
