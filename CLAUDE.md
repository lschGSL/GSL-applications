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
- **Webhooks**: Slack + Teams (fire-and-forget)
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
│   │       ├── audit-log/  # Audit log (action filters, CSV export)
│   │       ├── analytics/  # Analytics dashboard (stats, activity, top apps)
│   │       └── settings/ # Portal settings
│   ├── api/
│   │   ├── admin/        # Admin APIs (access, apps, invitations, users, audit-log/export)
│   │   ├── apps/         # App access requests
│   │   ├── documents/    # Document APIs (upload, download, status, folders, requests, signatures)
│   │   ├── health/       # Health check endpoint
│   │   └── invitations/  # Invitation validation
│   ├── auth/             # Auth callback + SSO exchange
│   ├── layout.tsx        # Root layout with ThemeProvider + I18nProvider
│   └── page.tsx          # Landing page (server → LandingContent client component)
├── components/
│   ├── admin/            # Admin UI (tables, detail panels, dialogs, filters)
│   ├── apps/             # App components (open button, request access)
│   ├── dashboard/        # Dashboard components (app-card, mfa-banner)
│   ├── documents/        # Document components (browser, upload, sign, status badge, request list)
│   ├── layout/           # Layout (sidebar, top-nav, mobile-sidebar, language-selector)
│   ├── landing-content.tsx  # Landing page client component (i18n)
│   └── ui/               # shadcn/ui primitives
├── lib/
│   ├── auth/actions.ts   # Server actions: signIn, signUp, signOut, forgotPassword, getSession, getProfile
│   ├── email/resend.ts   # Email notifications (access, invitation, document status, signature request)
│   ├── i18n/             # i18n system (context, index, locales/en.json, fr.json, de.json)
│   ├── supabase/         # Supabase clients (server.ts, client.ts, middleware.ts)
│   ├── webhooks.ts       # Slack/Teams webhook notifications
│   └── utils.ts          # Helpers: cn(), formatDate(), getInitials(), isAllowedRedirect(), isExternalUrl()
├── types/database.ts     # TypeScript types: Profile, Application, AppAccess, AuditLog, Document, DocumentFolder, DocumentRequest, DocumentSignature, SignatureRequest, Invitation
└── middleware.ts         # Next.js middleware (delegates to supabase/middleware.ts)
```

## Key Architecture Decisions

### Authentication Flow
- Supabase Auth with PKCE flow
- Password reset: `forgotPassword()` sends email with `redirectTo` pointing to `/auth/callback?next=/reset-password`
- The redirect URL is derived from request headers (`host` + `x-forwarded-proto`), NOT from `NEXT_PUBLIC_APP_URL`
- Middleware intercepts auth codes landing on `/` and redirects to `/auth/callback`
- Login supports `?redirect=` parameter for external app SSO (Bank Extractor, etc.)

### SSO / External App Integration
- Portal passes Supabase session tokens to external apps via `/auth/exchange` route
- External apps receive tokens and establish their own sessions
- Allowed redirect domains: `*.gsl.lu`, `*.vercel.app`
- See `INTEGRATION-GUIDE.md` for full integration specs
- See `BANK_EXTRACTOR_PORTAL_INTEGRATION.md` for Bank Extractor specifics

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
- Supabase Storage bucket `documents` (private, max 50MB, no MIME type restriction — validated server-side)
- Storage path: `{client_id}/{folder_id|root}/{uuid}.{ext}`
- Document status workflow: `pending → approved/rejected` (admin only)
- Folder structure managed by admins (type: bilan, tva, salaires, general, other + exercise year)
- RLS: clients see own docs only, admins/managers see all

### Signatures
- Simple electronic signature with password re-verification
- SHA-256 hash of (document_id + signer_id + timestamp + file_path)
- Multi-signer support: admin sends document to multiple signers
- Each signer receives email and signs independently
- Prepared for future LuxTrust/DocuSign integration (method field: simple, luxtrust, docusign)
- Signature requests tracked in `signature_requests` table

### Document Requests
- Admin creates a request → client receives email → uploads doc → admin reviews
- Status workflow: pending → uploaded → approved/rejected/cancelled
- Due date support with overdue highlighting

## Database Tables

- `profiles` — User profiles (extends auth.users), roles, entity
- `applications` — Registered apps with slug, URL, visibility, entity
- `app_access` — User → Application access grants
- `audit_logs` — Full audit trail (actions, IP, user-agent)
- `invitations` — Admin-generated invite tokens (7-day expiry)
- `document_folders` — Client document folders (nested, typed, exercise year)
- `documents` — Uploaded files (status, notes, signature_required, signed_at, Supabase Storage path)
- `document_requests` — Document request workflow (GSL → client)
- `document_signatures` — Electronic signatures (hash, method, IP, user-agent)
- `signature_requests` — Multi-signer signature requests (document → signer mapping)
- `extraction_jobs` — Bank Extractor jobs (added by Bank Extractor, shared Supabase)

## Integrated Applications

| App | URL | Slug | Status |
|-----|-----|------|--------|
| GSL News | gsl-news-portal.vercel.app | `gsl-news` | Active |
| Bank Extractor | bank.gsl.lu / gsl-bank-extractor.vercel.app | `bank-extractor` | Active |
| POS Extractor | gsl-pos-extractor.vercel.app | `gsl-pos-extractor` | Active |
| Agent Fiscal | gsl-agent-fiscal.vercel.app | `agent-fiscal` | Active |

## Domains

| Domain | Project | Status |
|--------|---------|--------|
| `apps.gsl.lu` | GSL Portal (gsl-applications) | ✅ Active |
| `bank.gsl.lu` | Bank Extractor (gsl-bank-extractor) | ✅ Active |
| `gsl-applications.vercel.app` | GSL Portal | ✅ Active |
| `gsl-bank-extractor.vercel.app` | Bank Extractor | ✅ Active |

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
- `SLACK_WEBHOOK_URL` - Slack incoming webhook URL
- `TEAMS_WEBHOOK_URL` - Microsoft Teams incoming webhook URL

## Important Notes

- **Build must pass TypeScript checks** before Vercel will deploy. Always run `npm run build` locally to verify.
- **Supabase redirect URLs**: The Supabase dashboard must whitelist callback URLs for all apps (portal + Bank Extractor + POS Extractor).
- **Security headers** are configured in `next.config.ts` (HSTS, X-Frame-Options, CSP-ready).
- **Row-Level Security** is enabled on all Supabase tables.
- **Supabase trigger function** is named `update_updated_at()` (NOT `update_updated_at_column()`).
- **Storage bucket** `documents` must have NO MIME type restrictions (validation is done server-side in the upload API).
- **Toast notifications**: uses `@radix-ui/react-toast` (shadcn/ui). Agent Fiscal uses Sonner — divergence acceptee (voir `MERGE_REPORT.md`).
- **@supabase/ssr**: aligne a `^0.9.0` sur tous les repos GSL (portail, Agent Fiscal, Bank Extractor).
- **Migrations**: format `NNN_description.sql` dans ce repo. Futur : migrer vers format Supabase `YYYYMMDDHHMMSS_description.sql`.
- **Resend domain** `gsl.lu` is verified and active for email sending.
- **Allowed redirect domains** for SSO: `*.gsl.lu` and `*.vercel.app` (configured in `src/lib/utils.ts`).

## Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Profiles, applications, app_access, audit_logs, RLS, triggers |
| `002_seed_gsl_news_app.sql` | Seed GSL News application |
| `003_multi_entity.sql` | Add `entity` column to profiles and applications |
| `004_invitations.sql` | Invitations table with token, role, entity, expiry |
| `005_default_app_icons.sql` | Set default letter-based icons (ui-avatars.com) |
| `006_client_documents.sql` | Client role, document_folders, documents tables, RLS |
| `007_document_requests.sql` | Document requests table (workflow GSL → client) |
| `008_document_signatures.sql` | Document signatures + signature_required/signed_at on documents |
| `009_signature_requests.sql` | Multi-signer signature requests |
| `010_seed_bank_extractor.sql` | Register Bank Extractor app + grant access to all users |
| `011_seed_agent_fiscal.sql` | Register Agent Fiscal app + grant access to all users |

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
| Creation directe d'utilisateurs (admin, avec role client) | ✅ Done |
| Recherche et filtres (apps, users, audit log) | ✅ Done |
| Multi-entite GSL (Fiduciaire / Revision) | ✅ Done |
| Icones des applications (auto-generees + icon_url) | ✅ Done |
| i18n FR/EN/DE (toutes les pages et composants) | ✅ Done |
| Panneau detail apps (slide-over, edit, archive, delete) | ✅ Done |
| FilterBar reutilisable (chips, URL params) | ✅ Done |

### Phase 3 — Portail client / documents ✅ DONE (Q4 2026)

| Feature | Statut |
|---------|--------|
| Espace client securise (role `client`, dashboard simplifie) | ✅ Done |
| Upload/download documents (Supabase Storage, PDF/Excel/images, 50MB) | ✅ Done |
| Dossiers par mandat/exercice (type: bilan, TVA, salaires + annee) | ✅ Done |
| Gestion admin des clients (page + panneau detail) | ✅ Done |
| DocumentBrowser (navigation dossiers, breadcrumbs, tableau fichiers) | ✅ Done |
| Approve/reject documents (admin workflow) | ✅ Done |
| Demandes de documents (workflow email GSL → client) | ✅ Done |
| Notifications client (email quand doc approuve/rejete) | ✅ Done |
| Signatures electroniques (simple, multi-signataires, prepare LuxTrust) | ✅ Done |
| Demande de signature (admin envoie doc pour signature + email) | ✅ Done |
| Audit trail client (qui a consulte quoi) | ❌ Pas encore |

### Phase 4 — Ops & monitoring ✅ DONE (Q1 2027)

| Feature | Statut |
|---------|--------|
| Health check endpoint `/api/health` | ✅ Done |
| Export audit log CSV/Excel | ✅ Done |
| Analytics dashboard (stats, activite, top apps, logins recents) | ✅ Done |
| Webhooks Slack/Teams | ✅ Done |

### Phase 5 — Integration applications

| Feature | Statut |
|---------|--------|
| Bank Extractor (bank.gsl.lu) — SSO, catalogue, acces auto | ✅ Done |
| POS Extractor — integration existante | ✅ Done |
| GSL News — integration existante | ✅ Done |
| Agent Fiscal — SSO, catalogue, acces auto | ✅ Done |

### Planning previsionnel

- **Q2 2026** → Phase 1 (Securite) ✅
- **Q3 2026** → Phase 2 (UX collaborateur) ✅
- **Q4 2026** → Phase 3 (Espace client + Documents) ✅
- **Q1 2027** → Phase 4 (Ops & monitoring) ✅
- **Q1 2027** → Phase 5 (Integration apps) ✅
- **A venir** → Audit trail client, LuxTrust integration
