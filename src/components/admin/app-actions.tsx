"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  CheckCircle,
} from "lucide-react";
import type { Application } from "@/types/database";
import { EditAppDialog } from "./edit-app-dialog";

export function AppActions({ app }: { app: Application }) {
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  async function updateApp(updates: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update application");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteApp() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete application");
      }
      router.refresh();
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>

          {app.is_active ? (
            <DropdownMenuItem
              className="text-amber-600"
              onClick={() => updateApp({ is_active: false })}
            >
              <Archive className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-green-600"
              onClick={() => updateApp({ is_active: true })}
            >
              <CheckCircle className="h-4 w-4" />
              Reactivate
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showEdit && (
        <EditAppDialog app={app} onClose={() => setShowEdit(false)} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Delete Application</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{app.name}</strong>? This
              will also remove all access records. This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteApp}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
