import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/actions";
import { getMFAStatus } from "@/lib/auth/mfa-actions";
import { MFASetup } from "@/components/security/mfa-setup";

export default async function SecuritySettingsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const mfaStatus = await getMFAStatus();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account security settings.
        </p>
      </div>

      <MFASetup
        enrolled={mfaStatus.enrolled}
        factors={mfaStatus.factors}
      />
    </div>
  );
}
