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

  const [foldersResult, docsResult, requestsResult] = await Promise.all([
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
  ]);

  const pendingRequests = requestsResult.data?.filter((r) => r.status === "pending") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Browse and upload your documents.
        </p>
      </div>

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
