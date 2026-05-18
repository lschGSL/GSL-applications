import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Formation } from "@/types/formations";

export const dynamic = "force-dynamic";

export default async function FormationsPage() {
  const supabase = await createClient();

  const { data: formations } = await supabase
    .from("formations")
    .select("*")
    .order("number", { ascending: true });

  const items = (formations ?? []) as Formation[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formations</h1>
          <p className="text-muted-foreground mt-1">
            Fiches de formation GSL accessibles à tous les collaborateurs.
          </p>
        </div>
        <Badge variant="secondary">{items.length} fiches</Badge>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Aucune fiche de formation pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((formation) => (
            <Link
              key={formation.id}
              href={`/formations/${formation.slug}`}
              className="group"
            >
              <Card className="h-full transition-all hover:border-[#67b9e8]/50 hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {formation.number}
                    </Badge>
                    {formation.duration_min != null && (
                      <Badge variant="secondary" className="gap-1 text-[11px]">
                        <Clock className="h-3 w-3" />~{formation.duration_min} min
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-lg font-semibold leading-snug group-hover:text-[#67b9e8]">
                    {formation.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-end border-t pt-3 text-xs text-muted-foreground">
                    <span>MAJ {formatDate(formation.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
