"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";

export function AddAppDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const url = formData.get("url") as string;
    const description = formData.get("description") as string;
    const visibility = formData.get("visibility") as string;

    try {
      const res = await fetch("/api/admin/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, url, description, visibility }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create application");
        setLoading(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Application
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Register Application</CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={() => { setOpen(false); setError(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="app-name" className="text-sm font-medium">Name *</label>
                  <Input
                    id="app-name"
                    name="name"
                    placeholder="My Application"
                    required
                    onChange={(e) => {
                      const slugInput = document.getElementById("app-slug") as HTMLInputElement;
                      if (slugInput && !slugInput.dataset.manual) {
                        slugInput.value = generateSlug(e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-slug" className="text-sm font-medium">Slug *</label>
                  <Input
                    id="app-slug"
                    name="slug"
                    placeholder="my-application"
                    required
                    pattern="[a-z0-9-]+"
                    onKeyDown={(e) => {
                      (e.target as HTMLInputElement).dataset.manual = "true";
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier (lowercase, hyphens only)</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-url" className="text-sm font-medium">URL *</label>
                  <Input
                    id="app-url"
                    name="url"
                    type="url"
                    placeholder="https://app.gsl.lu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-description" className="text-sm font-medium">Description</label>
                  <Input
                    id="app-description"
                    name="description"
                    placeholder="Brief description of the application"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="app-visibility" className="text-sm font-medium">Visibility</label>
                  <select
                    id="app-visibility"
                    name="visibility"
                    defaultValue="internal"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); setError(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register App
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
