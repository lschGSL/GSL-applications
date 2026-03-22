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
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={() => window.open(fullUrl, "_blank", "noopener,noreferrer")}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base flex items-center gap-1.5">
              {name}
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
            <p className="text-[10px] text-red-500 mt-1 break-all">DEBUG URL: &quot;{url}&quot; → &quot;{fullUrl}&quot;</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
