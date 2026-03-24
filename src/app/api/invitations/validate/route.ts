import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Validate an invitation token (public, no auth required)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, email, role, entity, expires_at, accepted_at")
    .eq("token", token)
    .single();

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.accepted_at) {
    return NextResponse.json({ error: "Invitation already used" }, { status: 400 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
  }

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    entity: invitation.entity,
  });
}
