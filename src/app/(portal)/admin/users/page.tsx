import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/admin/search-input";
import { FilterBar } from "@/components/admin/filter-bar";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { UsersTable } from "@/components/admin/users-table";

const userFilters = [
  {
    key: "role",
    label: "Role",
    options: [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "member", label: "Member" },
      { value: "viewer", label: "Viewer" },
    ],
  },
  {
    key: "entity",
    label: "Entity",
    options: [
      { value: "gsl_fiduciaire", label: "Fiduciaire" },
      { value: "gsl_revision", label: "Révision" },
      { value: "both", label: "Both" },
      { value: "none", label: "None" },
    ],
  },
  {
    key: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; invite?: string; add?: string; role?: string; entity?: string; status?: string }>;
}) {
  const profile = await getProfile();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = params.q?.toLowerCase() ?? "";
  const roleFilter = params.role ?? "";
  const entityFilter = params.entity ?? "";
  const statusFilter = params.status ?? "";

  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const { data: allUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch pending invitations (users who haven't confirmed email)
  const pendingUserIds = new Set<string>();
  const { data: authUsers } = await serviceClient.auth.admin.listUsers();
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      if (!u.email_confirmed_at) {
        pendingUserIds.add(u.id);
      }
    }
  }

  // Text search
  let users = query
    ? allUsers?.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.role.toLowerCase().includes(query)
      )
    : allUsers;

  // Role filter
  if (roleFilter && users) {
    users = users.filter((u) => u.role === roleFilter);
  }

  // Entity filter
  if (entityFilter && users) {
    if (entityFilter === "none") {
      users = users.filter((u) => !u.entity);
    } else {
      users = users.filter((u) => u.entity === entityFilter);
    }
  }

  // Status filter
  if (statusFilter && users) {
    users = users.filter((u) =>
      statusFilter === "active" ? u.is_active : !u.is_active
    );
  }

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
          <AddUserDialog showDialog={params.add === "true"} />
          <InviteUserDialog showDialog={params.invite === "true"} />
          <Badge variant="secondary">{users?.length ?? 0} users</Badge>
        </div>
      </div>

      <div className="space-y-3">
        <SearchInput placeholder="Search users by name, email, or role..." />
        <FilterBar filters={userFilters} />
      </div>

      <UsersTable users={users ?? []} currentUserId={profile.id} pendingUserIds={pendingUserIds} />
    </div>
  );
}
