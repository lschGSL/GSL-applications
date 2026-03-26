"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Send, CheckCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export function SendForSignatureDialog({
  documentId,
  documentName,
  clientId,
  onClose,
}: {
  documentId: string;
  documentName: string;
  clientId: string;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([clientId]));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    async function loadUsers() {
      const res = await fetch("/api/admin/users/list");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
      setFetching(false);
    }
    loadUsers();
  }, []);

  function toggleUser(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  async function handleSend() {
    if (selectedIds.size === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/signature-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signer_ids: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("common.networkError"));
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(onClose, 1500);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {t("signatures.sendForSignature")}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
          {success ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="text-sm font-medium text-green-600">{t("signatures.requestsSent")}</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("documents.title")}</p>
                <p className="text-sm font-medium">{documentName}</p>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("signatures.searchSigners")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[40vh]">
                {fetching ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedIds.has(user.id);
                    return (
                      <button
                        key={user.id}
                        className={`flex items-center gap-3 w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                          isSelected
                            ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                            : "border-border hover:bg-accent"
                        }`}
                        onClick={() => toggleUser(user.id)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                          {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 capitalize">{user.role}</Badge>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t shrink-0">
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size} {t("signatures.signersSelected")}
                </span>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button disabled={selectedIds.size === 0 || loading} onClick={handleSend}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("signatures.sendForSignature")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
