# CLAUDE.md - Project Memory

## Project Overview

**GSL Portal** (`gsl-portal`) - Internal company portal for managing and accessing GSL group applications. Built with Next.js 16 + Supabase + Tailwind CSS 4.

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, Turbopack, Server Actions)
- **Auth & DB**: Supabase (Auth, PostgreSQL, Row-Level Security)
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Language**: TypeScript 5.8 (strict)
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Public auth pages (login, register, forgot-password, reset-password)
│   ├── (portal)/         # Protected pages (dashboard, apps, admin/*)
│   ├── api/              # API routes (admin CRUD, app access requests)
│   ├── auth/             # Auth callback (/auth/callback) and token exchange (/auth/exchange)
│   ├── layout.tsx        # Root layout with ThemeProvider
│   └── page.tsx          # Landing page (redirects auth codes to /auth/callback)
├── components/
│   ├── admin/            # Admin panel components (dialogs, actions, pagination)
│   ├── apps/             # App components (open button, request access)
│   ├── dashboard/        # Dashboard components (app-card)
│   ├── layout/           # Layout components (sidebar, top-nav, mobile-sidebar)
│   └── ui/               # shadcn/ui primitives (button, card, badge, input, etc.)
├── lib/
│   ├── auth/actions.ts   # Server actions: signIn, signUp, signOut, forgotPassword, getSession, getProfile
│   ├── supabase/         # Supabase clients (server.ts, client.ts, middleware.ts)
│   └── utils.ts          # Helpers: cn(), formatDate(), getInitials(), isAllowedRedirect(), isExternalUrl()
├── types/database.ts     # TypeScript types: Profile, Application, AppAccess, AuditLog, UserRole, AppVisibility
└── middleware.ts         # Next.js middleware (delegates to supabase/middleware.ts)
```

## Key Architecture Decisions

### Authentication Flow
- Supabase Auth with PKCE flow
- Password reset: `forgotPassword()` sends email with `redirectTo` pointing to `/auth/callback?next=/reset-password`
- The redirect URL is derived from request headers (`host` + `x-forwarded-proto`), NOT from `NEXT_PUBLIC_APP_URL`
- Middleware intercepts auth codes landing on `/` and redirects to `/auth/callback`

### SSO / External App Integration
- Portal passes Supabase session tokens to external apps via `/auth/exchange` route
- External apps receive tokens and establish their own sessions
- See `INTEGRATION-GUIDE.md` for full integration specs

### Roles
- `admin`, `manager`, `member`, `viewer` (defined in `types/database.ts`)
- Admins see all apps; other roles see only granted apps
- Admin pages are protected both in middleware and at page level

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (must pass TypeScript checks)
npm run lint         # ESLint
npm run db:migrate   # Push Supabase migrations
npm run db:reset     # Reset Supabase DB
npm run db:seed      # Seed data
```

## Environment Variables

Required (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)

Optional:
- `NEXT_PUBLIC_APP_URL` - Not used for auth redirects (derived from headers instead)
- `NEXT_PUBLIC_APP_NAME` - Display name (defaults to "GSL Portal")

## Important Notes

- **Build must pass TypeScript checks** before Vercel will deploy. Always run `npm run build` locally to verify.
- **Supabase redirect URLs**: The Supabase dashboard must whitelist the callback URL (e.g., `https://gsl-applications.vercel.app/auth/callback`). If not whitelisted, Supabase sends codes to `/` instead - the middleware handles this fallback.
- **Security headers** are configured in `next.config.ts` (HSTS, X-Frame-Options, CSP-ready).
- **Row-Level Security** is enabled on all Supabase tables.

## Roadmap — Évolutions du portail GSL

Contexte métier : fiduciaire/révision au Luxembourg (GSL Fiduciaire + GSL Révision), avec perspective portail client à terme.

### Phase 1 — Sécurité critique ✅ DONE (Q2 2026)

| Feature | Statut |
|---------|--------|
| MFA/2FA (TOTP) — QR code, enrôlement, vérification post-login, page settings | ✅ Done |
| Politique de mots de passe — 12 chars, majuscule, chiffre, spécial + indicateur visuel | ✅ Done |
| Timeout de session — 30 min inactivité, avertissement 2 min avant | ✅ Done |
| Rate limiting — 5 login / 3 signup / 3 forgot-password par 15 min par IP | ✅ Done |
| Bandeau MFA dashboard — rappel pour les users sans 2FA | ✅ Done |
| IP whitelisting admin (optionnel) | ❌ Non implémenté |

### Phase 2 — Expérience collaborateur GSL (cible Q3 2026)

| Feature | Pourquoi | Effort |
|---------|----------|--------|
| Notifications email | Admin notifié des demandes d'accès + user notifié quand approuvé | Moyen |
| Invitations utilisateur | Admin invite jean@gsl.lu avec rôle prédéfini (au lieu d'inscription libre) | Moyen |
| Recherche et filtres | Recherche dans apps, users, audit log — indispensable quand ça grandit | Faible |
| Multi-entité GSL | Champ `entity` sur profil (GSL Fiduciaire vs GSL Révision), filtrage apps par entité | Moyen |
| Icônes des applications | `icon_url` existe en DB mais jamais affiché — afficher les logos sur les tuiles | Faible |
| i18n (FR/EN/DE) | Le portail mélange anglais et français. Luxembourg = FR + DE + EN | Moyen |

### Phase 3 — Portail client / documents (cible Q4 2026 → Q1 2027)

| Feature | Pourquoi | Effort |
|---------|----------|--------|
| Espace client sécurisé | Rôle `client` avec dashboard simplifié, ne voit que ses documents/demandes | Élevé |
| Upload/download documents | Supabase Storage, chiffrement at-rest, types : PDF, Excel, images | Élevé |
| Demandes de documents | Workflow : GSL demande → client reçoit email → upload → GSL valide/refuse | Élevé |
| Signatures électroniques | Intégration LuxTrust ou DocuSign | Élevé |
| Dossiers par mandat/exercice | Organisation par client, exercice fiscal, type (bilan, TVA, salaires…) | Moyen |
| Notifications client | Email + in-app pour documents demandés, approuvés, deadlines | Moyen |
| Audit trail client | Le client voit qui a consulté ses documents et quand | Faible |

### Phase 4 — Ops & monitoring

| Feature | Pourquoi | Effort |
|---------|----------|--------|
| Health check endpoint | `/api/health` pour monitoring Vercel/uptime | Faible |
| Export audit log | CSV/Excel pour auditeurs et compliance | Faible |
| Analytics dashboard | Connexions/jour, apps les plus utilisées, users inactifs | Moyen |
| Webhooks | Notifier Slack/Teams lors d'événements critiques | Moyen |

### Planning prévisionnel

- **Q2 2026** → Phase 1 (Sécurité) ✅ + Multi-entité GSL
- **Q3 2026** → Phase 2 (UX collaborateur) + i18n
- **Q4 2026** → Phase 3 début (Espace client + Upload documents)
- **Q1 2027** → Phase 3 suite (Workflows + Signatures)
