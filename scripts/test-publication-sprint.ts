/**
 * Tests du sprint publication 26/05 — Partie 2.
 *
 * Vérifie : disponibilité HTTP des routes de contenu, branding GSL,
 * absence de page 404, liens internes morts, et CRUD admin des
 * catégories de procédures.
 *
 * Usage :
 *   npx tsx scripts/test-publication-sprint.ts [baseUrl]
 *
 * Variables d'environnement optionnelles :
 *   BASE_URL              URL de base (défaut: http://localhost:3000)
 *   TEST_ADMIN_EMAIL      email d'un compte admin (pour les tests authentifiés)
 *   TEST_ADMIN_PASSWORD   mot de passe associé
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Remarque : les routes du groupe (portal) sont protégées. Sans
 * session authentifiée, le middleware redirige vers /login — le test
 * le détecte et le signale explicitement.
 */

const BASE_URL = process.argv[2] || process.env.BASE_URL || "http://localhost:3000";

const ROUTES = [
  "/procedures",
  "/procedures/acces-dashboard-rentabilite",
  "/procedures/pr-itc-notification",
  "/procedures/modifier-stages-taches",
  "/procedures/so-verrouillage",
  "/procedures/cron-recap-budget",
  "/procedures/tag-projets-a-allouer",
  "/decisions",
  "/decisions/so-closure-convention",
  "/decisions/parametrage-listes-distribution-mails",
  "/decisions/cron-budget-v4-anomalies",
  "/decisions/tag-projets-a-allouer",
  "/formations",
  "/formations/f-proj-01-convention-nommage-projets",
  "/formations/f-proj-02-champ-nom-court-short-name",
  "/formations/f-proj-03-tags-so-annee-date",
  "/formations/f-proj-04-etapes-projet-standardisees",
  "/formations/f-proj-05-dashboards-controle-budget",
  "/formations/f-proj-06-conventions-nommage-branches-commits",
];

type RouteResult = {
  route: string;
  status: number;
  redirectedToLogin: boolean;
  brandingOk: boolean;
  notFound: boolean;
  ok: boolean;
};

const internalLinkRe = /href="(\/(?:procedures|decisions|formations)[^"#]*)"/g;

async function probe(path: string): Promise<RouteResult> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const finalUrl = res.url || url;
    const redirectedToLogin = /\/login/.test(finalUrl);
    const brandingOk = /GSL/i.test(body);
    const notFound = /page not found|404|introuvable/i.test(body) && !redirectedToLogin;
    // Une route est considérée OK si elle répond 200 et n'affiche pas de 404.
    // Une redirection vers /login (auth requise) est signalée mais non bloquante.
    const ok = res.status === 200 && !notFound;
    return { route: path, status: res.status, redirectedToLogin, brandingOk, notFound, ok };
  } catch (err) {
    console.error(`  ✗ ${path} — erreur réseau: ${(err as Error).message}`);
    return { route: path, status: 0, redirectedToLogin: false, brandingOk: false, notFound: false, ok: false };
  }
}

async function crawlInternalLinks(): Promise<{ checked: number; dead: string[] }> {
  const seen = new Set<string>();
  const dead: string[] = [];
  for (const route of ROUTES) {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: "follow" });
    const body = await res.text();
    let m: RegExpExecArray | null;
    while ((m = internalLinkRe.exec(body)) !== null) {
      seen.add(m[1]);
    }
  }
  for (const link of seen) {
    const res = await fetch(`${BASE_URL}${link}`, { redirect: "follow" });
    if (res.status !== 200) dead.push(`${link} (${res.status})`);
  }
  return { checked: seen.size, dead };
}

async function testAdminCrud(): Promise<string> {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!email || !password || !supabaseUrl || !anonKey) {
    return "IGNORÉ — TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD / clés Supabase non fournis";
  }

  // Authentification Supabase pour obtenir un access token.
  const authRes = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!authRes.ok) return `ERREUR — authentification échouée (${authRes.status})`;
  const { access_token } = (await authRes.json()) as { access_token: string };

  const headers = {
    "Content-Type": "application/json",
    Cookie: "",
    Authorization: `Bearer ${access_token}`,
  };

  // Création d'une catégorie de test.
  const createRes = await fetch(`${BASE_URL}/api/admin/procedure-categories`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      slug: `test-sprint-${Date.now()}`,
      name: "Catégorie de test (sprint)",
      sort_order: 99,
      published: false,
    }),
  });
  if (createRes.status !== 201) return `ERREUR — POST a renvoyé ${createRes.status}`;
  const created = (await createRes.json()) as { id: string };

  // Suppression de la catégorie de test.
  const delRes = await fetch(
    `${BASE_URL}/api/admin/procedure-categories/${created.id}`,
    { method: "DELETE", headers },
  );
  if (delRes.status !== 200) return `ERREUR — DELETE a renvoyé ${delRes.status}`;

  return "OK — POST 201 + DELETE 200";
}

async function main() {
  console.log(`\n=== Tests sprint publication 26/05 — base: ${BASE_URL} ===\n`);

  console.log("1. Disponibilité HTTP des routes");
  const results: RouteResult[] = [];
  for (const route of ROUTES) {
    const r = await probe(route);
    results.push(r);
    const flag = r.ok ? "✓" : "✗";
    const auth = r.redirectedToLogin ? " [redirigé /login — auth requise]" : "";
    console.log(`  ${flag} ${route} — HTTP ${r.status}${auth}`);
  }
  const okCount = results.filter((r) => r.ok).length;
  const loginCount = results.filter((r) => r.redirectedToLogin).length;
  console.log(`\n  Routes HTTP 200 : ${okCount}/${ROUTES.length}`);
  console.log(`  Routes redirigées vers /login (auth) : ${loginCount}/${ROUTES.length}`);
  console.log(
    `  Branding GSL présent : ${results.filter((r) => r.brandingOk).length}/${ROUTES.length}`,
  );
  console.log(`  Pages 404 détectées : ${results.filter((r) => r.notFound).length}`);

  console.log("\n2. Crawler des liens internes");
  const crawl = await crawlInternalLinks();
  console.log(`  Liens internes uniques trouvés : ${crawl.checked}`);
  console.log(`  Liens morts : ${crawl.dead.length}`);
  for (const d of crawl.dead) console.log(`    ✗ ${d}`);

  console.log("\n3. Test CRUD admin (catégories de procédures)");
  const crud = await testAdminCrud();
  console.log(`  ${crud}`);

  console.log("\n=== Fin des tests ===\n");

  const hardFail = results.some((r) => r.notFound) || crawl.dead.length > 0;
  process.exit(hardFail ? 1 : 0);
}

main();
