import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// List signatures for a document
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: signatures } = await supabase
    .from("document_signatures")
    .select(`
      *,
      profiles:signed_by (full_name, email)
    `)
    .eq("document_id", id)
    .order("signed_at", { ascending: false });

  return NextResponse.json(signatures ?? []);
}
