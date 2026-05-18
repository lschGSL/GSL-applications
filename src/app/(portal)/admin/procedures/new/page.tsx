import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { ProcedureForm } from "@/components/admin/procedure-form";

export const dynamic = "force-dynamic";

export default async function NewProcedurePage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/procedures">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux procédures
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouvelle procédure</h1>
        <p className="text-muted-foreground mt-1">
          Créez une procédure interne. Vous pouvez la publier immédiatement ou la conserver en brouillon.
        </p>
      </div>

      <ProcedureForm mode="create" />
    </div>
  );
}
