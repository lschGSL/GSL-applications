"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, ExternalLink } from "lucide-react";

export function AppCard({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  const fullUrl = url && url.trim() ? (url.startsWith("http") ? url : `https://${url}`) : "";

  const handleClick = () => {
    if (fullUrl) {
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow h-full ${fullUrl ? "cursor-pointer" : "cursor-default opacity-75"}`}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base flex items-center gap-1.5">
              {name}
              {fullUrl && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
            {!fullUrl && (
              <p className="text-xs text-muted-foreground mt-1">URL not configured</p>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
