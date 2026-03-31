import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/admin/search-input";
import { FilterBar } from "@/components/admin/filter-bar";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { UsersTable } from "@/components/admin/users-table";
import { Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";

const userFilters = [
  {
    key: "role",
    label: "Role",
    options: [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "member", label: "Member" },
      { value: "viewer", label: "Viewer" },
      { value: "client", label: "Client" },
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
      { value: "pending", label: "Pending" },
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

  // Fetch profiles
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch ALL auth users to find orphans and pending
  const pendingUserIds = new Set<string>();
  const orphanUserIds = new Set<string>();
  const profileIds = new Set((profilesData ?? []).map((p) => p.id));

  const { data: authUsers } = await serviceClient.auth.admin.listUsers();

  const orphanProfiles: Profile[] = [];

  if (authUsers?.users) {
    for (const u of authUsers.users) {
      if (!u.email_confirmed_at) {
        pendingUserIds.add(u.id);
      }
      // Orphaned: exists in auth but not in profiles
      if (!profileIds.has(u.id)) {
        orphanUserIds.add(u.id);
        const meta = (u.user_metadata || {}) as Record<string, unknown>;
        orphanProfiles.push({
          id: u.id,
          email: u.email || "unknown",
          full_name: (meta.full_name as string) || null,
          avatar_url: null,
          role: (meta.role as string) || "member",
          entity: (meta.entity as string) || null,
          is_active: true,
          created_at: u.created_at,
          updated_at: u.created_at,
        } as Profile);
      }
    }
  }

  // Merge profiles + orphans
  const allUsers = [...(profilesData ?? []), ...orphanProfiles];

  // Text search
  let users = query
    ? allUsers.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.role.toLowerCase().includes(query)
      )
    : allUsers;

  // Role filter
  if (roleFilter) {
    users = users.filter((u) => u.role === roleFilter);
  }

  // Entity filter
  if (entityFilter) {
    if (entityFilter === "none") {
      users = users.filter((u) => !u.entity);
    } else {
      users = users.filter((u) => u.entity === entityFilter);
    }
  }

  // Status filter
  if (statusFilter) {
    if (statusFilter === "pending") {
      users = users.filter((u) => pendingUserIds.has(u.id));
    } else if (statusFilter === "active") {
      users = users.filter((u) => u.is_active && !pendingUserIds.has(u.id));
    } else {
      users = users.filter((u) => !u.is_active);
    }
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users/import">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Link>
          </Button>
          <AddUserDialog showDialog={params.add === "true"} />
          <InviteUserDialog showDialog={params.invite === "true"} />
          <Badge variant="secondary">{users.length} users</Badge>
        </div>
      </div>

      <div className="space-y-3">
        <SearchInput placeholder="Search users by name, email, or role..." />
        <FilterBar filters={userFilters} />
      </div>

      <UsersTable
        users={users}
        currentUserId={profile.id}
        pendingUserIds={pendingUserIds}
        orphanUserIds={orphanUserIds}
      />
    </div>
  );
}
