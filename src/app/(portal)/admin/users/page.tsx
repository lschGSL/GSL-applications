import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/admin/search-input";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { UsersTable } from "@/components/admin/users-table";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; invite?: string }>;
}) {
  const profile = await getProfile();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = params.q?.toLowerCase() ?? "";

  const supabase = await createClient();
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = query
    ? allUsers?.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.role.toLowerCase().includes(query)
      )
    : allUsers;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InviteUserDialog showDialog={params.invite === "true"} />
          <Badge variant="secondary">{users?.length ?? 0} users</Badge>
        </div>
      </div>

      <SearchInput placeholder="Search users by name, email, or role..." />

      <UsersTable users={users ?? []} currentUserId={profile.id} />
    </div>
  );
}
