# Architecture GSL Applications Portal

> Document de reference technique pour l'integration de nouvelles applications dans l'ecosysteme GSL.
> Mis a jour le 25 mars 2026.

---

## 1. Vue d'ensemble

Le **GSL Portal** (`gsl-portal`) est le portail interne de la fiduciaire GSL (Luxembourg) pour gerer et acceder aux applications du groupe. Il sert de hub central d'authentification, de catalogue d'apps, et d'espace client pour la gestion documentaire.

```
┌─────────────────────────────────────────────────────────┐
│                    apps.gsl.lu                          │
│                   (GSL Portal)                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Dashboard │  │ App Mgmt │  │ User Mgmt│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Audit Log│  │Client Mgt│  │ Settings │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐                            │
│  │ Client   │  │ Document │  ← Espace client           │
│  │ Docs     │  │ Upload   │    (role client)            │
│  └──────────┘  └──────────┘                            │
│                                                         │
│  Auth : Supabase (PKCE + MFA/TOTP)                     │
│  DB   : PostgreSQL (Supabase) + RLS                    │
│  Files: Supabase Storage (bucket documents)            │
│  i18n : FR / EN / DE                                   │
└────────────────────┬────────────────────────────────────┘
                     │ SSO via /auth/exchange
          ┌──────────┼──────────┐
          ▼          ▼          ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ GSL News │ │ POS Extr.│ │ Agent    │
   │          │ │          │ │ Fiscal   │
   └──────────┘ └──────────┘ └──────────┘
   Sous-apps hebergees sur Vercel
   Meme projet Supabase, meme auth
```

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16.2.1 |
| **Runtime** | React (Server Components) | 19.0.0 |
| **Langage** | TypeScript (strict) | 5.8.2 |
| **Styling** | Tailwind CSS 4 + shadcn/ui | 4.0.14 |
| **Auth & DB** | Supabase (Auth + PostgreSQL + RLS) | 2.49.1 |
| **Storage** | Supabase Storage (bucket `documents`) | — |
| **SSR Auth** | @supabase/ssr | 0.6.1 |
| **Theme** | next-themes (dark/light) | 0.4.6 |
| **Icons** | lucide-react | 0.474.0 |
| **Email** | Resend | 6.9.4 |
| **i18n** | Custom (I18nProvider + useI18n) | FR/EN/DE |
| **Hosting** | Vercel | — |
| **DNS** | apps.gsl.lu | — |

---

## 3. Structure du projet

```
src/
├── app/
│   ├── (auth)/              # Pages publiques
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── mfa-verify/
│   ├── (portal)/            # Pages protegees (middleware)
│   │   ├── dashboard/
│   │   ├── apps/
│   │   ├── client/
│   │   │   └── documents/   # Espace client documents
│   │   ├── settings/security/
│   │   └── admin/
│   │       ├── users/
│   │       ├── clients/     # Gestion clients + documents
│   │       ├── apps/
│   │       ├── audit-log/
│   │       └── settings/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── access/      # Grant/revoke app access
│   │   │   ├── apps/        # CRUD applications
│   │   │   ├── invitations/ # User invitations
│   │   │   └── users/       # User management
│   │   ├── apps/
│   │   │   └── request-access/
│   │   ├── documents/       # Document management
│   │   │   ├── upload/      # POST: file upload (FormData)
│   │   │   ├── [id]/        # PATCH: status, DELETE: remove
│   │   │   │   └── download/ # GET: signed URL redirect
│   │   │   └── folders/     # GET/POST + [id] PATCH/DELETE
│   │   └── invitations/
│   │       └── validate/
│   └── auth/
│       ├── callback/        # Auth code exchange
│       └── exchange/        # SSO token passthrough
├── components/
│   ├── admin/               # Admin UI (tables, panels, filters, dialogs)
│   │   ├── users-table.tsx
│   │   ├── user-detail-panel.tsx
│   │   ├── apps-table.tsx
│   │   ├── app-detail-panel.tsx
│   │   ├── clients-table.tsx
│   │   ├── client-detail-panel.tsx
│   │   ├── filter-bar.tsx
│   │   ├── search-input.tsx
│   │   ├── add-app-dialog.tsx
│   │   ├── edit-app-dialog.tsx
│   │   ├── invite-user-dialog.tsx
│   │   ├── app-actions.tsx
│   │   └── audit-log-pagination.tsx
│   ├── apps/                # App cards, open/request buttons
│   ├── dashboard/           # Dashboard widgets (app-card, mfa-banner)
│   ├── documents/           # Document management UI
│   │   ├── document-browser.tsx    # Folder nav + file table
│   │   ├── upload-dialog.tsx       # Drag-and-drop upload
│   │   └── document-status-badge.tsx
│   ├── layout/              # Sidebar, topnav, mobile, language-selector
│   ├── landing-content.tsx  # Landing page (client component, i18n)
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── auth/actions.ts      # Server actions (signIn, signUp, etc.)
│   ├── email/resend.ts      # Email notifications
│   ├── i18n/                # i18n system
│   │   ├── index.ts         # getDictionary(), t() function
│   │   ├── context.tsx      # I18nProvider + useI18n hook
│   │   └── locales/
│   │       ├── en.json      # English (~280 keys)
│   │       ├── fr.json      # Francais (~280 keys)
│   │       └── de.json      # Deutsch (~280 keys)
│   ├── supabase/            # Supabase clients (server, client, middleware)
│   └── utils.ts             # Helpers (cn, formatDate, etc.)
├── types/database.ts        # TypeScript types
└── middleware.ts             # Auth middleware
```

---

## 4. Schema de base de donnees

### 4.1 Tables

```sql
-- Utilisateurs (extends auth.users)
profiles (
  id          uuid PRIMARY KEY -> auth.users.id,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'member',  -- admin | manager | member | viewer | client
  entity      text,                             -- gsl_fiduciaire | gsl_revision | both | NULL
  is_active   boolean DEFAULT true,
  created_at  timestamptz,
  updated_at  timestamptz
)

-- Applications enregistrees
applications (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  url         text NOT NULL,
  icon_url    text,
  visibility  text DEFAULT 'internal',         -- internal | external | both
  entity      text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz,
  updated_at  timestamptz
)

-- Acces utilisateur -> application
app_access (
  id          uuid PRIMARY KEY,
  user_id     uuid -> profiles.id,
  app_id      uuid -> applications.id,
  granted_by  uuid -> profiles.id,
  granted_at  timestamptz,
  UNIQUE (user_id, app_id)
)

-- Journal d'audit
audit_logs (
  id            uuid PRIMARY KEY,
  user_id       uuid -> profiles.id,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text,
  details       jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz
)

-- Invitations
invitations (
  id          uuid PRIMARY KEY,
  email       text NOT NULL,
  role        text NOT NULL,       -- admin | manager | member | viewer | client
  entity      text,
  token       text UNIQUE,
  invited_by  uuid -> profiles.id,
  accepted_at timestamptz,
  expires_at  timestamptz,         -- +7 jours par defaut
  created_at  timestamptz
)

-- Dossiers documents client
document_folders (
  id            uuid PRIMARY KEY,
  name          text NOT NULL,
  client_id     uuid NOT NULL -> profiles.id,
  parent_id     uuid -> document_folders.id,   -- Nesting
  type          text,                           -- bilan | tva | salaires | general | other
  exercise_year integer,                        -- ex: 2025
  created_at    timestamptz,
  updated_at    timestamptz
)

-- Documents
documents (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  file_path   text NOT NULL,       -- Supabase Storage path
  file_size   bigint NOT NULL,
  mime_type   text NOT NULL,
  client_id   uuid NOT NULL -> profiles.id,
  uploaded_by uuid NOT NULL -> profiles.id,
  folder_id   uuid -> document_folders.id,
  status      text DEFAULT 'pending',  -- pending | approved | rejected
  notes       text,
  created_at  timestamptz,
  updated_at  timestamptz
)
```

### 4.2 Row-Level Security (RLS)

Toutes les tables ont RLS active :
- **profiles** : lecture publique, ecriture limitee a l'utilisateur ou admin
- **applications** : lecture publique (apps actives), ecriture admin/manager
- **app_access** : lecture par l'utilisateur concerne ou admin, ecriture admin/manager
- **audit_logs** : lecture admin uniquement
- **invitations** : gestion admin/manager, lecture par token pour validation
- **document_folders** : clients voient leurs dossiers, admins/managers voient tout
- **documents** : clients voient leurs docs, admins/managers voient tout, clients peuvent modifier leurs docs en statut `pending`

### 4.3 Fonctions helper

```sql
get_user_role(user_uuid) -> text             -- Retourne le role de l'utilisateur
user_has_app_access(user_uuid, slug) -> bool -- Verifie l'acces (ou si admin)
update_updated_at()                          -- Trigger function pour updated_at
```

### 4.4 Supabase Storage

- Bucket : `documents` (prive)
- Taille max : 50MB
- Types MIME : PDF, Excel (.xlsx, .xls), PNG, JPEG
- Path convention : `{client_id}/{folder_id|root}/{uuid}.{ext}`

---

## 5. Systeme de roles

| Role | Dashboard | Apps | Client Docs | Admin Users | Admin Clients | Admin Apps | Audit Log |
|------|-----------|------|-------------|-------------|---------------|------------|-----------|
| `admin` | Toutes les apps | Toutes | Via admin panel | Oui | Oui | Oui | Oui |
| `manager` | Toutes les apps | Toutes | Via admin panel | Oui | Oui | Oui | Non |
| `member` | Apps autorisees | Autorisees | Non | Non | Non | Non | Non |
| `viewer` | Apps autorisees | Autorisees | Non | Non | Non | Non | Non |
| `client` | Redirect → docs | Non | Ses documents | Non | Non | Non | Non |

---

## 6. Flux d'authentification

### 6.1 Login standard

```
User -> /login (email + password)
  -> signIn() server action
  -> Rate limit check (5/15min par IP & email)
  -> supabase.auth.signInWithPassword()
  -> MFA enrolled? -> redirect /mfa-verify
  -> Audit log "sign_in"
  -> role === "client" ? redirect /client/documents : redirect /dashboard
```

### 6.2 MFA (TOTP)

```
/settings/security -> Enrollment QR code
  -> supabase.auth.mfa.enroll({ factorType: 'totp' })
  -> User scans QR -> enters TOTP code
  -> supabase.auth.mfa.challengeAndVerify()

Post-login si MFA active:
  /mfa-verify -> challenge -> verify -> redirect /dashboard
```

### 6.3 Password Reset

```
/forgot-password -> forgotPassword() server action
  -> Rate limit (3/15min)
  -> supabase.auth.resetPasswordForEmail()
  -> redirectTo = {origin}/auth/callback?next=/reset-password
  -> Email envoye par Supabase
  -> User clique -> /auth/callback -> exchange code -> /reset-password
```

### 6.4 SSO / Integration apps externes

```
Portal (apps.gsl.lu)                 App externe (news.gsl.lu)
─────────────────────                ──────────────────────────
User clique "Open App"
  -> Fetch session tokens
  -> Redirect vers:
    news.gsl.lu/auth/exchange
      ?access_token=xxx
      &refresh_token=yyy
                                     /auth/exchange route:
                                       -> supabase.auth.setSession()
                                       -> Cookies set
                                       -> redirect /dashboard
```

**Route `/auth/exchange`** (a implementer dans chaque app) :

```typescript
// app/auth/exchange/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const access_token = url.searchParams.get("access_token");
  const refresh_token = url.searchParams.get("refresh_token");

  if (!access_token || !refresh_token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

---

## 7. Securite

| Mesure | Implementation |
|--------|---------------|
| **Rate limiting** | 5 login / 3 signup / 3 forgot-password par 15min par IP |
| **MFA/2FA** | TOTP (Google Authenticator, etc.) |
| **Password policy** | 12 chars min, majuscule, chiffre, caractere special |
| **Session timeout** | 30 min inactivite, avertissement 2 min avant |
| **Headers HTTP** | HSTS (2 ans), X-Frame-Options DENY, X-Content-Type-Options |
| **RLS** | Activee sur toutes les tables PostgreSQL |
| **Audit trail** | Toute action logguee (IP, user-agent, details) |
| **PKCE** | Flux auth Supabase avec PKCE (proof key for code exchange) |

---

## 8. Notifications email

Via **Resend** (fire-and-forget, silencieux si cle API absente) :

| Evenement | Destinataire | Sujet |
|-----------|-------------|-------|
| Demande d'acces | Tous les admins/managers | `[GSL Portal] Access request: {user} -> {app}` |
| Acces accorde | L'utilisateur | `[GSL Portal] Access granted: {app}` |
| Acces revoque | L'utilisateur | `[GSL Portal] Access revoked: {app}` |
| Invitation | L'invite | `[GSL Portal] You've been invited` |
| Demande de document | Le client | `[GSL Portal] Document demande : {titre}` |
| Document approuve | Le client | `[GSL Portal] Document approuve : {nom}` |
| Document rejete | Le client | `[GSL Portal] Document rejete : {nom}` |

---

## 9. i18n — Internationalisation

3 langues supportees : **Francais** (defaut), **English**, **Deutsch**

Architecture :
- `I18nProvider` wraps l'app dans le root layout
- `useI18n()` hook retourne `{ locale, setLocale, t }`
- `t("nav.dashboard")` resout les cles imbriquees
- `t("dashboard.welcomeBack", { name: "Luc" })` supporte l'interpolation
- Langue persistee en `localStorage`, auto-detectee du navigateur
- ~280 cles par locale couvrant toutes les pages et composants

---

## 10. Gestion documentaire (Phase 3)

### Flux document

```
Admin cree un dossier pour le client
  -> Dossier avec type (bilan/tva/salaires) + annee d'exercice
  -> Client ou admin upload un document
  -> Document en statut "pending"
  -> Admin review : approve ou reject
  -> Client recoit email de notification
  -> Client peut telecharger ses documents
```

### Flux demande de document

```
Admin cree une demande pour le client
  -> Titre, description, dossier cible, date limite
  -> Client recoit email avec lien vers son espace
  -> Client voit la demande en "pending" avec bouton upload
  -> Client upload le document -> statut "uploaded"
  -> Admin review : approve ou reject
  -> Client recoit email de notification
```

### API Documents

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/documents/upload` | Upload fichier (FormData) |
| GET | `/api/documents` | Liste documents (filtrable par client_id) |
| GET | `/api/documents/[id]/download` | Redirect vers URL signee (60s) |
| PATCH | `/api/documents/[id]` | Update status/notes (admin) + email client |
| DELETE | `/api/documents/[id]` | Supprimer doc + fichier storage |
| GET | `/api/documents/folders` | Liste dossiers |
| POST | `/api/documents/folders` | Creer dossier (admin) |
| PATCH | `/api/documents/folders/[id]` | Update dossier |
| DELETE | `/api/documents/folders/[id]` | Supprimer dossier |
| GET | `/api/documents/requests` | Liste demandes (filtrable par client_id) |
| POST | `/api/documents/requests` | Creer demande (admin) + email client |
| PATCH | `/api/documents/requests/[id]` | Update statut/lier document |
| DELETE | `/api/documents/requests/[id]` | Supprimer demande |

### Types de dossiers

| Type | Description |
|------|-------------|
| `bilan` | Bilan annuel / Balance sheet |
| `tva` | Declarations TVA / VAT |
| `salaires` | Fiches de paie / Payroll |
| `general` | Documents generaux |
| `other` | Autre |

---

## 11. Multi-entite GSL

Deux entites juridiques :
- **GSL Fiduciaire** (`gsl_fiduciaire`)
- **GSL Revision** (`gsl_revision`)

Le champ `entity` existe sur `profiles` et `applications` :
- `NULL` = pas de restriction (visible par tous)
- `gsl_fiduciaire` = reserve a la fiduciaire
- `gsl_revision` = reserve a la revision
- `both` = accessible aux deux

Le filtrage est applique cote serveur dans les pages Apps et Dashboard.

---

## 12. Hebergement et deploiement

```
Vercel
├── gsl-portal          -> apps.gsl.lu (portail principal)
├── gsl-news            -> news.gsl.lu
└── [future apps]       -> *.gsl.lu

Supabase (projet unique partage)
├── Auth                -> Authentification centralisee
├── PostgreSQL          -> Base de donnees avec RLS
└── Storage             -> Bucket "documents" (prive, 50MB)
```

**Variables d'environnement requises** (chaque app) :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Server-only

# Portal uniquement :
RESEND_API_KEY=re_xxx                  # Optionnel
RESEND_FROM_EMAIL=GSL Portal <noreply@gsl.lu>
NEXT_PUBLIC_APP_NAME=GSL Portal
```

---

## 13. Design System GSL

### Couleurs de marque

```css
--gsl-red: #e62a34;    /* Rouge GSL (accent principal) */
--gsl-blue: #67b9e8;   /* Bleu GSL (accent secondaire) */
```

### Composants UI

Base sur **shadcn/ui** (Radix UI + Tailwind) :
- Button, Input, Card, Badge, Avatar
- Dialog, DropdownMenu, Select, Tabs
- Toast, Tooltip, Switch, Separator

### Themes

- Light mode (defaut)
- Dark mode (via `next-themes`)
- Les deux sont supportes et requis pour toute nouvelle app

---

## 14. Pattern d'integration d'une nouvelle app

Pour integrer une app dans le portail :

### Cote portail
1. **Enregistrer l'app** dans Admin -> Apps -> Add Application
2. **Accorder l'acces** aux utilisateurs (Admin -> Users ou via demande)

### Cote app externe
1. Utiliser le **meme projet Supabase** (memes cles API)
2. Implementer `/auth/exchange` (voir section 6.4)
3. Proteger les routes avec le middleware Supabase
4. Respecter le design system GSL (voir `INTEGRATION-GUIDE.md`)
5. **Ne PAS creer de login propre** — tout passe par le portail

### Applications integrees

| App | URL Production | URL Vercel | Slug |
|-----|---------------|------------|------|
| GSL News | — | gsl-news-portal.vercel.app | `gsl-news` |
| Bank Extractor | bank.gsl.lu | gsl-bank-extractor.vercel.app | `bank-extractor` |
| POS Extractor | — | gsl-pos-extractor.vercel.app | `gsl-pos-extractor` |

Voir `BANK_EXTRACTOR_PORTAL_INTEGRATION.md` pour les details specifiques du Bank Extractor.

---

## 15. Signatures electroniques

### Signature simple (implementee)
- Admin envoie un document pour signature a un ou plusieurs signataires
- Chaque signataire recoit un email "Signature requise"
- Le signataire confirme son identite par mot de passe
- Hash SHA-256 genere : `document_id + signer_id + timestamp + file_path`
- IP, user-agent, et horodatage enregistres
- Badge "Signe" affiche sur le document

### Multi-signataires
- Table `signature_requests` : lien document → signataire
- Admin choisit plusieurs signataires dans un dialog avec recherche
- Chaque signataire signe independamment
- Statut par signataire : pending / signed / declined

### API Signatures

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/documents/[id]/sign` | Signer un document (password required) |
| GET | `/api/documents/[id]/signatures` | Liste des signatures d'un document |
| GET/POST | `/api/documents/[id]/signature-requests` | Liste/creer demandes de signature |

### Prepare pour LuxTrust
- Champ `method` : `simple` | `luxtrust` | `docusign`
- Champ `metadata` (jsonb) pour donnees provider-specifiques

---

## 16. Webhooks (Slack/Teams)

Notifications fire-and-forget vers Slack et/ou Microsoft Teams :

| Evenement | Fonction |
|-----------|----------|
| Nouvel utilisateur | `webhookNewUser()` |
| Demande d'acces app | `webhookAccessRequest()` |
| Document uploade | `webhookDocumentUploaded()` |
| Document approuve/rejete | `webhookDocumentStatusChanged()` |
| Alerte securite | `webhookSecurityAlert()` |

Configuration : `SLACK_WEBHOOK_URL` et/ou `TEAMS_WEBHOOK_URL` dans les variables d'environnement.

---

## 17. Migrations

| Migration | Description |
|-----------|-------------|
| `001_initial_schema.sql` | Schema initial : profiles, applications, app_access, audit_logs, RLS, triggers, helper functions |
| `002_seed_gsl_news_app.sql` | Seed app GSL News |
| `003_multi_entity.sql` | Champ `entity` sur profiles et applications |
| `004_invitations.sql` | Table invitations avec token, role, entite, expiry |
| `005_default_app_icons.sql` | Icones par defaut (ui-avatars.com) pour apps sans icon_url |
| `006_client_documents.sql` | Role client, tables document_folders et documents, RLS |
| `007_document_requests.sql` | Demandes de documents (workflow GSL -> client) |
| `008_document_signatures.sql` | Signatures electroniques + champs signature sur documents |
| `009_signature_requests.sql` | Demandes de signature multi-signataires |
| `010_seed_bank_extractor.sql` | Enregistrement Bank Extractor + acces pour tous les users |

**Note** : La trigger function s'appelle `update_updated_at()` (pas `update_updated_at_column()`).

---

## 18. Domaines et DNS

| Domaine | Projet Vercel | CNAME |
|---------|--------------|-------|
| `apps.gsl.lu` | gsl-applications | `59aa5de9ef573003.vercel-dns-017.com` |
| `bank.gsl.lu` | gsl-bank-extractor | `098e81d113c2abed.vercel-dns-017.com` |

DNS gere chez **vo.lu**. Email (Resend) configure avec domaine `gsl.lu` verifie (DKIM + SPF).

---

## 19. Ops & monitoring (Phase 4)

### Health check

`GET /api/health` — retourne :
- `status` : "healthy" ou "unhealthy"
- `latency_ms` : temps de reponse DB
- `version` : SHA du commit Git
- `checks.database.status` : "ok" ou "fail"
- HTTP 503 si la DB est inaccessible

### Export audit log

`GET /api/admin/audit-log/export` — telecharge un CSV avec :
- Date, User, Email, Action, Resource Type, Resource ID, IP, User Agent, Details
- UTF-8 BOM pour compatibilite Excel
- Limite : 10 000 entrees
- Admin uniquement

### Analytics dashboard

`/admin/analytics` — page admin avec :
- 8 cartes stats (users, active, inactive, clients, apps, documents, pending docs, pending requests)
- Activite : logins et events (24h + 7 jours)
- Top 5 apps par nombre d'utilisateurs
- 5 derniers logins (24h, dedupliques)

---

## 20. Roadmap

| Phase | Contenu | Statut |
|-------|---------|--------|
| **Phase 1** | Securite (MFA, rate limit, session timeout, password policy) | ✅ Done |
| **Phase 2** | UX collaborateur (notifications, invitations, filtres, icones, i18n, multi-entite) | ✅ Done |
| **Phase 3** | Espace client + documents (upload, dossiers, demandes, signatures, notifications) | ✅ Done |
| **Phase 4** | Ops & monitoring (health check, export audit, analytics, webhooks) | ✅ Done |
| **Phase 5** | Integration apps (Bank Extractor, POS Extractor, GSL News) | ✅ Done |
| **A venir** | Audit trail client, LuxTrust integration | Planifie |
