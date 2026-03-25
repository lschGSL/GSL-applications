# Architecture GSL Applications Portal

> Document de reference technique pour l'integration de nouvelles applications dans l'ecosysteme GSL.
> Genere le 25 mars 2026.

---

## 1. Vue d'ensemble

Le **GSL Portal** (`gsl-portal`) est le portail interne de la fiduciaire GSL (Luxembourg) pour gerer et acceder aux applications du groupe. Il sert de hub central d'authentification et de catalogue d'apps.

```
┌─────────────────────────────────────────────────────────┐
│                    apps.gsl.lu                          │
│                   (GSL Portal)                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Dashboard │  │ App Mgmt │  │ User Mgmt│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Audit Log│  │   Apps   │  │ Settings │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  Auth : Supabase (PKCE + MFA/TOTP)                     │
│  DB   : PostgreSQL (Supabase) + RLS                    │
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
| **SSR Auth** | @supabase/ssr | 0.6.1 |
| **Theme** | next-themes (dark/light) | 0.4.6 |
| **Icons** | lucide-react | 0.474.0 |
| **Email** | Resend | 6.9.4 |
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
│   │   ├── settings/security/
│   │   └── admin/
│   │       ├── users/
│   │       ├── apps/
│   │       └── audit-log/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── access/      # Grant/revoke app access
│   │   │   ├── apps/        # CRUD applications
│   │   │   ├── invitations/ # User invitations
│   │   │   └── users/       # User management
│   │   └── apps/
│   │       └── request-access/
│   └── auth/
│       ├── callback/        # Auth code exchange
│       └── exchange/        # SSO token passthrough
├── components/
│   ├── admin/               # Admin UI (tables, panels, filters)
│   ├── apps/                # App cards, open/request buttons
│   ├── dashboard/           # Dashboard widgets
│   ├── layout/              # Sidebar, topnav, mobile
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── auth/actions.ts      # Server actions (signIn, signUp, etc.)
│   ├── email/resend.ts      # Email notifications
│   ├── supabase/            # Supabase clients (server, client, middleware)
│   └── utils.ts             # Helpers (cn, formatDate, etc.)
├── types/database.ts        # Types TS
└── middleware.ts             # Auth middleware
```

---

## 4. Schema de base de donnees

### 4.1 Tables

```sql
-- Utilisateurs (extends auth.users)
profiles (
  id          uuid PRIMARY KEY → auth.users.id,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'member',  -- admin | manager | member | viewer
  entity      text,                             -- gsl_fiduciaire | gsl_revision | both | NULL
  is_active   boolean DEFAULT true,
  created_at  timestamptz,
  updated_at  timestamptz
)

-- Applications enregistrees
applications (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,            -- ex: "gsl-news", "agent-fiscal"
  description text,
  url         text NOT NULL,                   -- URL de l'app (Vercel)
  icon_url    text,                            -- Icone affichee sur le portail
  visibility  text DEFAULT 'internal',         -- internal | external | both
  entity      text,                            -- Restriction par entite (NULL = toutes)
  is_active   boolean DEFAULT true,
  created_at  timestamptz,
  updated_at  timestamptz
)

-- Acces utilisateur → application
app_access (
  id          uuid PRIMARY KEY,
  user_id     uuid → profiles.id,
  app_id      uuid → applications.id,
  granted_by  uuid → profiles.id,
  granted_at  timestamptz,
  UNIQUE (user_id, app_id)
)

-- Journal d'audit
audit_logs (
  id            uuid PRIMARY KEY,
  user_id       uuid → profiles.id,
  action        text NOT NULL,    -- sign_in, sign_out, request_access, grant_access, etc.
  resource_type text NOT NULL,    -- user, application, app_access
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
  role        text NOT NULL,
  entity      text,
  token       text UNIQUE,        -- Hex 64 chars, auto-genere
  invited_by  uuid → profiles.id,
  accepted_at timestamptz,        -- NULL = en attente
  expires_at  timestamptz,        -- +7 jours par defaut
  created_at  timestamptz
)
```

### 4.2 Row-Level Security (RLS)

Toutes les tables ont RLS active :
- **profiles** : lecture publique, ecriture limitee a l'utilisateur ou admin
- **applications** : lecture publique (apps actives), ecriture admin/manager
- **app_access** : lecture par l'utilisateur concerne ou admin, ecriture admin/manager
- **audit_logs** : lecture admin uniquement
- **invitations** : gestion admin/manager, lecture par token pour validation

### 4.3 Fonctions helper

```sql
get_user_role(user_uuid) → text          -- Retourne le role de l'utilisateur
user_has_app_access(user_uuid, slug) → bool  -- Verifie l'acces (ou si admin)
```

---

## 5. Systeme de roles

| Role | Dashboard | Apps | Admin Users | Admin Apps | Audit Log |
|------|-----------|------|-------------|------------|-----------|
| `admin` | Toutes les apps | Toutes | Oui | Oui | Oui |
| `manager` | Toutes les apps | Toutes | Oui | Oui | Non |
| `member` | Apps autorisees | Autorisees | Non | Non | Non |
| `viewer` | Apps autorisees | Autorisees | Non | Non | Non |

---

## 6. Flux d'authentification

### 6.1 Login standard

```
User → /login (email + password)
  → signIn() server action
  → Rate limit check (5/15min par IP & email)
  → supabase.auth.signInWithPassword()
  → MFA enrolled? → redirect /mfa-verify
  → Audit log "sign_in"
  → redirect /dashboard
```

### 6.2 MFA (TOTP)

```
/settings/security → Enrollment QR code
  → supabase.auth.mfa.enroll({ factorType: 'totp' })
  → User scans QR → enters TOTP code
  → supabase.auth.mfa.challengeAndVerify()

Post-login si MFA active:
  /mfa-verify → challenge → verify → redirect /dashboard
```

### 6.3 Password Reset

```
/forgot-password → forgotPassword() server action
  → Rate limit (3/15min)
  → supabase.auth.resetPasswordForEmail()
  → redirectTo = {origin}/auth/callback?next=/reset-password
  → Email envoye par Supabase
  → User clique → /auth/callback → exchange code → /reset-password
```

### 6.4 SSO / Integration apps externes

C'est le pattern cle pour integrer de nouvelles apps :

```
Portal (apps.gsl.lu)                 App externe (news.gsl.lu)
─────────────────────                ──────────────────────────
User clique "Open App"
  → Fetch session tokens
  → Redirect vers:
    news.gsl.lu/auth/exchange
      ?access_token=xxx
      &refresh_token=yyy
                                     /auth/exchange route:
                                       → supabase.auth.setSession()
                                       → Cookies set
                                       → redirect /dashboard
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
| Demande d'acces | Tous les admins/managers | `[GSL Portal] Access request: {user} → {app}` |
| Acces accorde | L'utilisateur | `[GSL Portal] Access granted: {app}` |
| Acces revoque | L'utilisateur | `[GSL Portal] Access revoked: {app}` |
| Invitation | L'invite | `[GSL Portal] You've been invited` |

---

## 9. Multi-entite GSL

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

## 10. Hebergement et deploiement

```
Vercel
├── gsl-portal          → apps.gsl.lu (portail principal)
├── gsl-news            → news.gsl.lu (ou sous-domaine)
└── [future apps]       → *.gsl.lu

Supabase (projet unique partage)
├── Auth                → Authentification centralisee
├── PostgreSQL          → Base de donnees avec RLS
└── Storage             → (prevu Phase 3 pour documents)
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

## 11. Design System GSL

### Couleurs de marque

```css
--gsl-red: #e62a34;    /* Rouge GSL (accent principal) */
--gsl-blue: #67b9e8;   /* Bleu GSL (accent secondaire) */
```

### Composants UI

Basé sur **shadcn/ui** (Radix UI + Tailwind) :
- Button, Input, Card, Badge, Avatar
- Dialog, DropdownMenu, Select, Tabs
- Toast, Tooltip, Switch, Separator

### Themes

- Light mode (defaut)
- Dark mode (via `next-themes`)
- Les deux sont supportes et requis pour toute nouvelle app

---

## 12. Pattern d'integration d'une nouvelle app

Pour integrer une app (ex: "Agent Fiscal") dans le portail :

### Cote portail
1. **Enregistrer l'app** dans Admin → Apps → Add Application
   - Name: `Agent Fiscal`
   - Slug: `agent-fiscal`
   - URL: `https://agent-fiscal.vercel.app`
   - Visibility: `internal`
   - Entity: selon besoin

2. **Accorder l'acces** aux utilisateurs (Admin → Users ou via demande)

### Cote app externe
1. Utiliser le **meme projet Supabase** (memes cles API)
2. Implementer `/auth/exchange` (voir section 6.4)
3. Proteger les routes avec le middleware Supabase
4. Respecter le design system GSL (voir `INTEGRATION-GUIDE.md`)
5. **Ne PAS creer de login propre** — tout passe par le portail

### Flux utilisateur
```
User sur apps.gsl.lu
  → Clique "Agent Fiscal"
  → Portal passe les tokens Supabase
  → agent-fiscal.vercel.app/auth/exchange reçoit les tokens
  → Session etablie
  → User utilise l'app normalement
```

---

## 13. Commandes de developpement

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Build production (verifie TypeScript)
npm run lint         # ESLint
npm run db:migrate   # Push migrations Supabase
npm run db:reset     # Reset DB
npm run db:seed      # Seed data
```

---

## 14. Roadmap

| Phase | Contenu | Statut |
|-------|---------|--------|
| **Phase 1** | Securite (MFA, rate limit, session timeout, password policy) | Done |
| **Phase 2** | UX collaborateur (notifications, invitations, filtres, icones, multi-entite) | Done |
| **Phase 3** | Espace client + documents (upload, workflows, signatures) | Planifie Q4 2026 |
| **Phase 4** | Ops & monitoring (health check, export audit, analytics, webhooks) | Planifie 2027 |
