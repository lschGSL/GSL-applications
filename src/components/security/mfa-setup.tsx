"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  enrollMFA,
  verifyAndActivateMFA,
  unenrollMFA,
} from "@/lib/auth/mfa-actions";

interface MFAFactor {
  id: string;
  friendlyName: string | null | undefined;
  createdAt: string;
}

interface MFASetupProps {
  enrolled: boolean;
  factors: MFAFactor[];
}

export function MFASetup({ enrolled, factors }: MFASetupProps) {
  const [step, setStep] = useState<"idle" | "enroll" | "verify">("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [currentFactors, setCurrentFactors] = useState(factors);
  const [copied, setCopied] = useState(false);

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    const result = await enrollMFA();
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setQrCode(result.qrCode!);
    setSecret(result.secret!);
    setFactorId(result.factorId!);
    setStep("enroll");
    setLoading(false);
  }

  async function handleVerify() {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await verifyAndActivateMFA(factorId!, code);
    if (result.error) {
      setError(result.error);
      setCode("");
      setLoading(false);
      return;
    }

    setIsEnrolled(true);
    setCurrentFactors([
      ...currentFactors,
      { id: factorId!, friendlyName: "GSL Portal TOTP", createdAt: new Date().toISOString() },
    ]);
    setStep("idle");
    setQrCode(null);
    setSecret(null);
    setCode("");
    setLoading(false);
  }

  async function handleUnenroll(id: string) {
    setLoading(true);
    setError(null);

    const result = await unenrollMFA(id);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const remaining = currentFactors.filter((f) => f.id !== id);
    setCurrentFactors(remaining);
    setIsEnrolled(remaining.length > 0);
    setLoading(false);
  }

  async function copySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* MFA Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account using a TOTP
                  authenticator app.
                </CardDescription>
              </div>
            </div>
            <Badge variant={isEnrolled ? "success" : "outline"}>
              {isEnrolled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Enrolled factors list */}
          {isEnrolled && currentFactors.length > 0 && step === "idle" && (
            <div className="space-y-3">
              {currentFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">
                        {factor.friendlyName || "Authenticator App"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added{" "}
                        {new Date(factor.createdAt).toLocaleDateString("fr-LU")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnenroll(factor.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldOff className="mr-1 h-3 w-3" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Enable button */}
          {!isEnrolled && step === "idle" && (
            <Button onClick={handleEnroll} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable 2FA
            </Button>
          )}

          {/* Enrollment step: show QR code */}
          {step === "enroll" && qrCode && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="mb-3 text-sm font-medium">
                  1. Scan this QR code with your authenticator app (Google
                  Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center rounded-lg bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCode}
                    alt="QR Code for TOTP setup"
                    className="h-48 w-48"
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="mb-2 text-sm font-medium">
                  Or enter this secret key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-background px-3 py-2 text-xs font-mono break-all">
                    {secret}
                  </code>
                  <Button variant="outline" size="sm" onClick={copySecret}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="mb-3 text-sm font-medium">
                  2. Enter the 6-digit verification code from your app
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="max-w-32 text-center font-mono text-lg"
                  />
                  <Button onClick={handleVerify} disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify & Activate
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setStep("idle");
                  setQrCode(null);
                  setSecret(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              Use a strong, unique password of at least 12 characters
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              Enable two-factor authentication for maximum security
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              Store your authenticator recovery codes in a safe place
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              Never share your credentials or 2FA codes with anyone
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
