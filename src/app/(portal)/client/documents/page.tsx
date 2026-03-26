import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { DocumentBrowser } from "@/components/documents/document-browser";
import { RequestList } from "@/components/documents/request-list";
import { Badge } from "@/components/ui/badge";

export default async function ClientDocumentsPage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "client") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const [foldersResult, docsResult, requestsResult, sigRequestsResult] = await Promise.all([
    supabase
      .from("document_folders")
      .select("*")
      .eq("client_id", profile.id)
      .order("name"),
    supabase
      .from("documents")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("document_requests")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("signature_requests")
      .select("*, documents:document_id(name)")
      .eq("signer_id", profile.id)
      .eq("status", "pending"),
  ]);

  const pendingRequests = requestsResult.data?.filter((r) => r.status === "pending") ?? [];
  const pendingSigRequests = sigRequestsResult.data ?? [];
  const docsToSign = [
    ...docsResult.data?.filter((d) => d.signature_required && !d.signed_at) ?? [],
    ...pendingSigRequests.map((sr: { document_id: string; documents: { name: string } | { name: string }[] | null }) => {
      const doc = Array.isArray(sr.documents) ? sr.documents[0] : sr.documents;
      return { id: sr.document_id, name: doc?.name || "Document" };
    }),
  ].filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Browse and upload your documents.
        </p>
      </div>

      {/* Documents to sign */}
      {docsToSign.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-400">Documents a signer</h2>
            <Badge variant="warning">{docsToSign.length}</Badge>
          </div>
          <div className="space-y-2">
            {docsToSign.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-md bg-background p-3 border">
                <span className="text-sm font-medium">{doc.name}</span>
                <Badge variant="warning" className="text-xs">Signature requise</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-3">
            Retrouvez ces documents ci-dessous pour les signer.
          </p>
        </div>
      )}

      {/* Pending requests section */}
      {(requestsResult.data?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Demandes de documents</h2>
            {pendingRequests.length > 0 && (
              <Badge variant="warning">{pendingRequests.length} en attente</Badge>
            )}
          </div>
          <RequestList
            requests={requestsResult.data ?? []}
            clientId={profile.id}
          />
        </div>
      )}

      <DocumentBrowser
        folders={foldersResult.data ?? []}
        documents={docsResult.data ?? []}
        clientId={profile.id}
      />
    </div>
  );
}
