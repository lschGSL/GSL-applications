import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { ProcedureForm } from "@/components/admin/procedure-form";
import type { Procedure } from "@/types/procedures";

export const dynamic = "force-dynamic";

export default async function EditProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("procedures")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const procedure = data as Procedure;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/procedures">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux procédures
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Édition&nbsp;: {procedure.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          Numéro {procedure.number} • Statut actuel&nbsp;: {procedure.status}
        </p>
      </div>

      <ProcedureForm mode="edit" initial={procedure} />
    </div>
  );
}
