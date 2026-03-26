import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all logs with user info
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select(`
      *,
      profiles:user_id (email, full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build CSV
  const headers_row = ["Date", "User", "Email", "Action", "Resource Type", "Resource ID", "IP Address", "User Agent", "Details"];
  const rows = (logs ?? []).map((log: Record<string, unknown>) => {
    const profiles = log.profiles as { email?: string; full_name?: string } | null;
    return [
      log.created_at as string,
      profiles?.full_name || "System",
      profiles?.email || "",
      log.action as string,
      log.resource_type as string,
      (log.resource_id as string) || "",
      (log.ip_address as string) || "",
      ((log.user_agent as string) || "").replace(/,/g, " "),
      log.details ? JSON.stringify(log.details).replace(/,/g, ";") : "",
    ];
  });

  const csv = [headers_row, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
