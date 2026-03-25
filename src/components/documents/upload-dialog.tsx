"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, Loader2, FileUp, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const ALLOWED_EXTENSIONS = [".pdf", ".xlsx", ".xls", ".png", ".jpg", ".jpeg"];

export function UploadDialog({
  clientId,
  folderId,
  onClose,
}: {
  clientId: string;
  folderId?: string | null;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useI18n();

  function handleFile(f: File) {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(t("documents.allowedTypes") + ": PDF, Excel, PNG, JPEG");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError(t("documents.maxSize"));
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
    if (folderId) formData.set("folder_id", folderId);

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

      setSuccess(true);
      router.refresh();
      setTimeout(onClose, 1000);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("documents.uploadDocument")}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {success ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="text-sm font-medium text-green-600">Upload successful!</p>
            </div>
          ) : (
            <>
              <div
                className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept={ALLOWED_EXTENSIONS.join(",")}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">{t("documents.dragDrop")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("documents.allowedTypes")}</p>
                <p className="text-xs text-muted-foreground">{t("documents.maxSize")}</p>
              </div>

              {file && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Upload className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                  <Button size="sm" onClick={() => { setFile(null); setError(null); }} variant="ghost">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button className="flex-1" disabled={!file || loading} onClick={handleUpload}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("documents.upload")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
