"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { UserDetailPanel } from "@/components/admin/user-detail-panel";
import { useI18n } from "@/lib/i18n/context";
import type { Profile } from "@/types/database";

const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  manager: "default",
  member: "secondary",
  viewer: "outline",
};

export function UsersTable({
  users,
  currentUserId,
  pendingUserIds = new Set(),
  orphanUserIds = new Set(),
}: {
  users: Profile[];
  currentUserId: string;
  pendingUserIds?: Set<string>;
  orphanUserIds?: Set<string>;
}) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const { t } = useI18n();

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.user")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.role")}
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.entity")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common.status")}
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.joined")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                          <AvatarFallback className="text-xs">
                            {getInitials(user.full_name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {user.full_name || t("common.noName")}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={roleColors[user.role] ?? "secondary"} className="capitalize">
                        {t(`roles.${user.role}`)}
                      </Badge>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      {user.entity ? (
                        <Badge variant="outline" className="text-xs">
                          {user.entity === "gsl_fiduciaire" ? t("entity.fiduciaire") : user.entity === "gsl_revision" ? t("entity.revision") : t("entity.both")}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {orphanUserIds.has(user.id) && (
                          <Badge variant="destructive" className="text-[10px]" title={t("admin.users.missingProfileHint")}>
                            {t("admin.users.missingProfile")}
                          </Badge>
                        )}
                        {pendingUserIds.has(user.id) ? (
                          <Badge variant="warning" title={t("admin.users.pendingInvitationHint")}>
                            {t("admin.users.pendingInvitation")}
                          </Badge>
                        ) : (
                          <Badge variant={user.is_active ? "success" : "destructive"}>
                            {user.is_active ? t("common.active") : t("common.inactive")}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      {t("admin.users.noUsers")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          currentUserId={currentUserId}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
