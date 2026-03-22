"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Pencil,
  Trash2,
  Archive,
  CheckCircle,
  Power,
} from "lucide-react";
import type { Application } from "@/types/database";
import { EditAppDialog } from "./edit-app-dialog";

export function AppActions({ app }: { app: Application }) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
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
      setOpen(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          disabled={loading}
          className="gap-1"
        >
          Actions <ChevronDown className="h-3 w-3" />
        </Button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border bg-popover p-2 shadow-lg">
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => {
                  setOpen(false);
                  setShowEdit(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>

              {app.is_active ? (
                <button
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-amber-600 hover:bg-accent"
                  onClick={() => updateApp({ is_active: false })}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
              ) : (
                <button
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-green-600 hover:bg-accent"
                  onClick={() => updateApp({ is_active: true })}
                >
                  <CheckCircle className="h-4 w-4" />
                  Reactivate
                </button>
              )}

              <div className="my-1 border-t" />

              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                onClick={() => {
                  setOpen(false);
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

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
