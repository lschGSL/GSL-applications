"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";
import { PasswordStrength } from "@/components/security/password-strength";
import { validatePassword } from "@/lib/password";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const pw = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    const validation = validatePassword(pw);
    if (!validation.valid) {
      setError(validation.errors.join(". "));
      setLoading(false);
      return;
    }

    if (pw !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: updateError } = await supabase.auth.updateUser({ password: pw });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/login?message=Password updated successfully");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set new password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 12 characters"
              required
              minLength={12}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrength password={password} />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm password
            </label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="Repeat your password"
              required
              minLength={12}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
