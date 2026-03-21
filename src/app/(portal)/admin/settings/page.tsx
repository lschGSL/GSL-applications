import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Globe, Bell } from "lucide-react";

export default async function SettingsPage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const settings = [
    {
      icon: Shield,
      title: "Security",
      description: "Configure authentication methods, password policies, and MFA settings.",
      status: "MFA Available",
    },
    {
      icon: Key,
      title: "API Keys",
      description: "Manage API keys for external integrations and service accounts.",
      status: "Coming Soon",
    },
    {
      icon: Globe,
      title: "Domain",
      description: "Custom domain configuration and SSL certificate management.",
      status: "Via Vercel",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure email notifications for security events and user management.",
      status: "Coming Soon",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Portal configuration and security settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settings.map((setting) => (
          <Card key={setting.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <setting.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{setting.title}</CardTitle>
                </div>
                <Badge variant="outline">{setting.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{setting.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
