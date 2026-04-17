import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const host = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const baseUrl = host.replace("/supabase", "");

  const [overview, compliance, appHealth] = await Promise.all([
    fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/admin/security/overview`, {
      headers: { cookie: "" },
    }).catch(() => null),
    null,
    null,
  ]);

  // Fallback: query data directly from DB (server-side) for PDF rendering reliability.
  const now = new Date();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [totalUsersResult, mfaResult, failedAuthResult, suspiciousResult, appsResult] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("audit_logs")
        .select("user_id")
        .eq("action", "mfa_enroll"),
      supabase
        .from("security_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "failed_auth")
        .gte("created_at", last30d),
      supabase
        .from("security_events")
        .select("id", { count: "exact", head: true })
        .in("event_type", ["suspicious_access", "new_device"])
        .gte("created_at", last30d),
      supabase.from("applications").select("name, slug, security_status, last_security_scan"),
    ]);

  const totalUsers = totalUsersResult.count ?? 0;
  const mfaUsers = new Set((mfaResult.data ?? []).map((r) => r.user_id)).size;
  const mfaRate = totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Rapport de conformité CSSF - GSL Portal</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
  h1 { border-bottom: 3px solid #1e40af; padding-bottom: 8px; }
  h2 { color: #1e40af; margin-top: 32px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  .kpi { display: inline-block; margin-right: 32px; padding: 12px 20px; background: #f9fafb; border-radius: 8px; }
  .kpi-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
  .kpi-value { font-size: 24px; font-weight: 700; color: #1e40af; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
  .status-protected { color: #059669; font-weight: 600; }
  .status-public { color: #dc2626; font-weight: 600; }
  .status-misconfigured { color: #d97706; font-weight: 600; }
  .status-unknown { color: #6b7280; }
</style>
</head>
<body>
  <h1>Rapport de conformité CSSF</h1>
  <p><strong>GSL Portal</strong> — Portail interne sécurisé</p>
  <p>Période couverte : 30 derniers jours · Généré le ${now.toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
  <p>Généré par : ${profile.full_name ?? profile.email} (${profile.role})</p>

  <h2>1. Indicateurs clés (30 jours)</h2>
  <div>
    <div class="kpi">
      <div class="kpi-label">Utilisateurs actifs</div>
      <div class="kpi-value">${totalUsers}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Adoption MFA</div>
      <div class="kpi-value">${mfaRate}%</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Échecs d'authentification</div>
      <div class="kpi-value">${failedAuthResult.count ?? 0}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Activités suspectes</div>
      <div class="kpi-value">${suspiciousResult.count ?? 0}</div>
    </div>
  </div>

  <h2>2. Statut des applications</h2>
  <table>
    <thead>
      <tr>
        <th>Application</th>
        <th>Slug</th>
        <th>Statut sécurité</th>
        <th>Dernier scan</th>
      </tr>
    </thead>
    <tbody>
      ${(appsResult.data ?? [])
        .map(
          (a) => `
        <tr>
          <td>${escapeHtml(a.name)}</td>
          <td><code>${escapeHtml(a.slug)}</code></td>
          <td class="status-${a.security_status}">${a.security_status ?? "unknown"}</td>
          <td>${a.last_security_scan ? new Date(a.last_security_scan).toLocaleDateString("fr-FR") : "—"}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>3. Mesures de sécurité en place</h2>
  <ul>
    <li>Authentification à deux facteurs (TOTP) disponible pour tous les utilisateurs</li>
    <li>Politique de mots de passe : minimum 12 caractères, majuscule, chiffre et caractère spécial</li>
    <li>Timeout de session après 30 minutes d'inactivité</li>
    <li>Rate limiting : 5 tentatives de connexion / 15 min</li>
    <li>Row-Level Security activée sur toutes les tables Supabase</li>
    <li>Journal d'audit complet (actions utilisateurs, IP, user-agent)</li>
    <li>Monitoring en temps réel des sessions actives et événements de sécurité</li>
  </ul>

  <h2>4. Déclaration de conformité</h2>
  <p>Ce rapport atteste que le portail GSL met en œuvre les contrôles de sécurité
  requis par la circulaire CSSF en matière de gestion des accès, de traçabilité et
  de protection des données pour une entité du secteur financier luxembourgeois.</p>

  <div class="footer">
    <p>Rapport généré automatiquement par le Security Dashboard GSL Portal.</p>
    <p>${baseUrl || "GSL Portal"} · ${now.toISOString()}</p>
  </div>
</body>
</html>`;

  void overview;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="cssf-compliance-${now.toISOString().split("T")[0]}.html"`,
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
