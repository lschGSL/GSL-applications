# MERGE_REPORT.md — Alignement GSL Apps Portal × Agent Fiscal

> Date : avril 2026
> Repos concernes : `lschGSL/GSL-applications` (portail) et `lschGSL/gsl-agent-fiscal`

---

## Alignements effectues

### 1. @supabase/ssr — Version alignee

| Repo | Avant | Apres |
|------|-------|-------|
| gsl-applications (portail) | `^0.6.1` | `^0.9.0` |
| gsl-agent-fiscal | `^0.9.0` | `^0.9.0` (inchange) |

**Impact** : Aucun breaking change. L'API `createServerClient()` et `createBrowserClient()` restent identiques. Build passe sans erreur.

### 2. Conventions de nommage des migrations

| Repo | Format |
|------|--------|
| gsl-applications | `NNN_description.sql` (ex: `001_initial_schema.sql`, `011_seed_agent_fiscal.sql`) |
| gsl-agent-fiscal | `YYYYMMDDHHMMSS_description.sql` (format Supabase standard) |

**Decision** : Les deux formats coexistent sans conflit car ils partagent le meme projet Supabase mais sont executes manuellement (pas de `supabase db push` automatise). Le portail utilise un format simplifie car les migrations sont executees via SQL Editor.

**Recommandation** : Pour les futures migrations communes, utiliser le format Supabase standard `YYYYMMDDHHMMSS_description.sql` dans les deux repos.

### 3. Toast notifications

| Repo | Implementation |
|------|---------------|
| gsl-applications | `@radix-ui/react-toast` (shadcn/ui) + toasts inline manuels |
| gsl-agent-fiscal | `sonner` (Sonner) |

**Decision** : Divergence acceptee. Les deux libs fonctionnent bien. Pas de composant partage entre les repos qui necessite un toast unifie. Chaque app gere ses toasts independamment.

---

## Divergences deliberees (NE PAS aligner)

### 1. Couleur bleue

| Repo | Valeur | Raison |
|------|--------|--------|
| gsl-applications | `#67b9e8` (bleu groupe GSL) | Identite visuelle groupe |
| gsl-agent-fiscal | `#2563eb` (blue-600 Tailwind) | Identite visuelle Fiduciaire |

### 2. Composants UI

| Repo | Base | Raison |
|------|------|--------|
| gsl-applications | Radix UI (shadcn/ui classique) | Projet initial, plus de composants |
| gsl-agent-fiscal | Base UI (@base-ui-components) | Projet recent, API plus moderne |

### 3. Middleware

| Repo | Pattern |
|------|---------|
| gsl-applications | Factorise dans `src/lib/supabase/middleware.ts` |
| gsl-agent-fiscal | Inline dans `src/middleware.ts` |

### 4. i18n

| Repo | Implementation |
|------|---------------|
| gsl-applications | Custom context (I18nProvider + useI18n), FR/EN/DE |
| gsl-agent-fiscal | Pas d'i18n (FR uniquement) |

### 5. Theme provider

| Repo | Implementation |
|------|---------------|
| gsl-applications | `next-themes` (ThemeProvider) |
| gsl-agent-fiscal | `next-themes` (ThemeProvider) — aligne |

---

## Tokens de design partages (source de verite : portail)

```css
/* Tokens communs aux deux repos */
--color-primary: #e62a34;        /* GSL Red — identique */
--color-background: #ffffff;     /* Light — identique */
--color-background-dark: #141617; /* Dark — identique */
--color-card: #ffffff;           /* Light — identique */
--color-card-dark: #1e1f22;     /* Dark — identique */
--color-border: #e4e4e7;        /* Light — identique */
--color-border-dark: #3a3b3e;   /* Dark — identique */
--color-muted: #f2f2f4;         /* Light — identique */
--color-muted-dark: #2a2b2e;    /* Dark — identique */
--font-sans: "Inter";            /* Identique */
--radius: 0.625rem;              /* Identique */
```

---

## SSO Integration — Statut

| Element | Statut |
|---------|--------|
| Agent Fiscal enregistre dans le portail (migration 011) | ✅ |
| `/auth/exchange` dans l'Agent Fiscal | ✅ |
| Redirect URLs dans Supabase | ✅ |
| Meme projet Supabase partage | ✅ |
| Flux complet : portail → Agent Fiscal → chat | ✅ |

---

## Supabase — Projet partage

- **Project ID** : `kwjgfljzdgpfyqknakmy`
- **Tables portail** : profiles, applications, app_access, audit_logs, invitations, document_folders, documents, document_requests, document_signatures, signature_requests
- **Tables Agent Fiscal** : conversations, messages (+ tables portail via foreign keys)
- **Trigger** : `update_updated_at()` (pas `update_updated_at_column()`)
- **Storage** : bucket `documents` (portail uniquement)

---

## Checklist pour le prochain developpeur

- [ ] Garder `@supabase/ssr` aligne entre les deux repos
- [ ] Nouvelles migrations en format `YYYYMMDDHHMMSS_description.sql`
- [ ] Ne pas toucher aux couleurs bleues (divergence volontaire)
- [ ] Tester le flux SSO apres chaque modification du middleware
- [ ] Les emails passent par Resend (domaine `gsl.lu` verifie)
