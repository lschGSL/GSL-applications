import { redirect } from "next/navigation";
import Link from "next/link";
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
      description: "Two-factor authentication, password policies, and session management.",
      status: "Active",
      href: "/settings/security",
    },
    {
      icon: Key,
      title: "API Keys",
      description: "Manage API keys for external integrations and service accounts.",
      status: "Coming Soon",
      href: null,
    },
    {
      icon: Globe,
      title: "Domain",
      description: "Custom domain configuration and SSL certificate management.",
      status: "Via Vercel",
      href: null,
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure email notifications for security events and user management.",
      status: "Coming Soon",
      href: null,
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
        {settings.map((setting) => {
          const content = (
            <Card key={setting.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <setting.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{setting.title}</CardTitle>
                  </div>
                  <Badge variant={setting.status === "Active" ? "success" : "outline"}>
                    {setting.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{setting.description}</CardDescription>
              </CardContent>
            </Card>
          );

          if (setting.href) {
            return (
              <Link key={setting.title} href={setting.href} className="block">
                {content}
              </Link>
            );
          }

          return <div key={setting.title}>{content}</div>;
        })}
      </div>
    </div>
  );
}
