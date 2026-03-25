# CLAUDE.md - Project Memory

## Project Overview

**GSL Portal** (`gsl-portal`) - Internal company portal for managing and accessing GSL group applications. Built with Next.js 16 + Supabase + Tailwind CSS 4.

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, Turbopack, Server Actions)
- **Auth & DB**: Supabase (Auth, PostgreSQL, Row-Level Security, Storage)
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Language**: TypeScript 5.8 (strict)
- **Email**: Resend (notifications)
- **i18n**: Custom context-based system (FR/EN/DE)
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Public auth pages (login, register, forgot-password, reset-password, mfa-verify)
│   ├── (portal)/         # Protected pages
│   │   ├── dashboard/    # Main dashboard (redirects clients to /client/documents)
│   │   ├── apps/         # App catalog with search + filters
│   │   ├── client/       # Client space
│   │   │   └── documents/  # Client document browser
│   │   ├── settings/     # User settings (security/2FA)
│   │   └── admin/        # Admin pages
│   │       ├── users/    # User management (search, filters, detail panel)
│   │       ├── clients/  # Client management (documents, folders)
│   │       ├── apps/     # App management (detail panel)
│   │       ├── audit-log/  # Audit log (action filters)
│   │       └── settings/ # Portal settings
│   ├── api/
│   │   ├── admin/        # Admin APIs (access, apps, invitations, users)
│   │   ├── apps/         # App access requests
│   │   ├── documents/    # Document APIs (upload, download, status, folders)
│   │   └── invitations/  # Invitation validation
│   ├── auth/             # Auth callback + SSO exchange
│   ├── layout.tsx        # Root layout with ThemeProvider + I18nProvider
│   └── page.tsx          # Landing page (server → LandingContent client component)
├── components/
│   ├── admin/            # Admin UI (tables, detail panels, dialogs, filters)
│   ├── apps/             # App components (open button, request access)
│   ├── dashboard/        # Dashboard components (app-card, mfa-banner)
│   ├── documents/        # Document components (browser, upload dialog, status badge)
│   ├── layout/           # Layout (sidebar, top-nav, mobile-sidebar, language-selector)
│   ├── landing-content.tsx  # Landing page client component (i18n)
│   └── ui/               # shadcn/ui primitives
├── lib/
│   ├── auth/actions.ts   # Server actions: signIn, signUp, signOut, forgotPassword, getSession, getProfile
│   ├── email/resend.ts   # Email notifications (access request, granted, revoked, invitation)
│   ├── i18n/             # i18n system (context, index, locales/en.json, fr.json, de.json)
│   ├── supabase/         # Supabase clients (server.ts, client.ts, middleware.ts)
│   └── utils.ts          # Helpers: cn(), formatDate(), getInitials(), isAllowedRedirect(), isExternalUrl()
├── types/database.ts     # TypeScript types: Profile, Application, AppAccess, AuditLog, Document, DocumentFolder, Invitation
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
- `admin`, `manager`, `member`, `viewer`, `client` (defined in `types/database.ts`)
- Admins see all apps; other roles see only granted apps
- Clients see only their own documents (redirected from dashboard to `/client/documents`)
- Admin pages are protected at page level

### i18n
- Custom lightweight system: `I18nProvider` + `useI18n()` hook
- 3 locales: FR (default), EN, DE
- Language stored in `localStorage`, auto-detected from browser
- LanguageSelector in top-nav and landing page
- All user-facing strings use `t("key")` pattern

### Document Management
- Supabase Storage bucket `documents` (private, max 50MB)
- Storage path: `{client_id}/{folder_id|root}/{uuid}.{ext}`
- Document status workflow: `pending → approved/rejected` (admin only)
- Folder structure managed by admins (type: bilan, tva, salaires, general, other + exercise year)
- RLS: clients see own docs only, admins/managers see all

## Database Tables

- `profiles` — User profiles (extends auth.users), roles, entity
- `applications` — Registered apps with slug, URL, visibility, entity
- `app_access` — User → Application access grants
- `audit_logs` — Full audit trail (actions, IP, user-agent)
- `invitations` — Admin-generated invite tokens (7-day expiry)
- `document_folders` — Client document folders (nested, typed, exercise year)
- `documents` — Uploaded files (status, notes, Supabase Storage path)

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
- `RESEND_API_KEY` - Resend API key for email notifications
- `RESEND_FROM_EMAIL` - Sender email (defaults to "GSL Portal <noreply@gsl.lu>")

## Important Notes

- **Build must pass TypeScript checks** before Vercel will deploy. Always run `npm run build` locally to verify.
- **Supabase redirect URLs**: The Supabase dashboard must whitelist the callback URL (e.g., `https://gsl-applications.vercel.app/auth/callback`). If not whitelisted, Supabase sends codes to `/` instead - the middleware handles this fallback.
- **Security headers** are configured in `next.config.ts` (HSTS, X-Frame-Options, CSP-ready).
- **Row-Level Security** is enabled on all Supabase tables.
- **Supabase trigger function** is named `update_updated_at()` (NOT `update_updated_at_column()`).
- **Storage bucket** `documents` must be created manually in Supabase Dashboard (private, 50MB limit).

## Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Profiles, applications, app_access, audit_logs, RLS, triggers |
| `002_seed_gsl_news_app.sql` | Seed GSL News application |
| `003_multi_entity.sql` | Add `entity` column to profiles and applications |
| `004_invitations.sql` | Invitations table with token, role, entity, expiry |
| `005_default_app_icons.sql` | Set default letter-based icons (ui-avatars.com) |
| `006_client_documents.sql` | Client role, document_folders, documents tables, RLS |

## Roadmap

Contexte metier : fiduciaire/revision au Luxembourg (GSL Fiduciaire + GSL Revision), avec perspective portail client a terme.

### Phase 1 — Securite critique ✅ DONE (Q2 2026)

| Feature | Statut |
|---------|--------|
| MFA/2FA (TOTP) | ✅ Done |
| Politique de mots de passe (12 chars, majuscule, chiffre, special) | ✅ Done |
| Timeout de session (30 min inactivite) | ✅ Done |
| Rate limiting (5 login / 3 signup / 3 forgot-password par 15 min) | ✅ Done |
| Bandeau MFA dashboard | ✅ Done |
| IP whitelisting admin (optionnel) | ❌ Non implemente |

### Phase 2 — Experience collaborateur GSL ✅ DONE (Q3 2026)

| Feature | Statut |
|---------|--------|
| Notifications email (Resend) | ✅ Done |
| Invitations utilisateur (admin invite avec role/entite) | ✅ Done |
| Recherche et filtres (apps, users, audit log) | ✅ Done |
| Multi-entite GSL (Fiduciaire / Revision) | ✅ Done |
| Icones des applications (auto-generees + icon_url) | ✅ Done |
| i18n FR/EN/DE (toutes les pages et composants) | ✅ Done |
| Panneau detail apps (slide-over, edit, archive, delete) | ✅ Done |
| FilterBar reutilisable (chips, URL params) | ✅ Done |

### Phase 3 — Portail client / documents (en cours)

| Feature | Statut |
|---------|--------|
| Espace client securise (role `client`, dashboard simplifie) | ✅ Done |
| Upload/download documents (Supabase Storage, PDF/Excel/images, 50MB) | ✅ Done |
| Dossiers par mandat/exercice (type: bilan, TVA, salaires + annee) | ✅ Done |
| Gestion admin des clients (page + panneau detail) | ✅ Done |
| DocumentBrowser (navigation dossiers, breadcrumbs, tableau fichiers) | ✅ Done |
| Approve/reject documents (admin workflow) | ✅ Done |
| Demandes de documents (workflow email GSL → client) | ❌ Pas encore |
| Signatures electroniques (LuxTrust/DocuSign) | ❌ Pas encore |
| Notifications client (email + in-app) | ❌ Pas encore |
| Audit trail client (qui a consulte quoi) | ❌ Pas encore |

### Phase 4 — Ops & monitoring

| Feature | Statut |
|---------|--------|
| Health check endpoint `/api/health` | ❌ Pas encore |
| Export audit log CSV/Excel | ❌ Pas encore |
| Analytics dashboard | ❌ Pas encore |
| Webhooks Slack/Teams | ❌ Pas encore |

### Planning previsionnel

- **Q2 2026** → Phase 1 (Securite) ✅
- **Q3 2026** → Phase 2 (UX collaborateur) ✅
- **Q4 2026** → Phase 3 (Espace client + Documents) — en cours
- **Q1 2027** → Phase 3 suite (Workflows + Signatures) + Phase 4
