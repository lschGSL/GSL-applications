import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create workbook
  const wb = XLSX.utils.book_new();

  const data = [
    ["full_name", "email", "role", "entity"],
    ["Jean Dupont", "jean.dupont@gsl.lu", "member", "gsl_fiduciaire"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Style header row (column widths)
  ws["!cols"] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
  ];

  // Add cell comments with valid values
  ws["C1"] = { ...ws["C1"], c: [{ a: "GSL Portal", t: "Valid values: admin, manager, member, viewer, client" }] };
  ws["D1"] = { ...ws["D1"], c: [{ a: "GSL Portal", t: "Valid values: gsl_fiduciaire, gsl_revision, both, (empty for all)" }] };

  XLSX.utils.book_append_sheet(wb, ws, "Users");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=gsl-import-users-template.xlsx",
    },
  });
}
