# GSL Portal

Centralized application portal for GSL with enterprise-grade security, user management, and audit logging.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **UI**: shadcn/ui + Tailwind CSS v4
- **Auth & Database**: Supabase (PostgreSQL + Auth)
- **Language**: TypeScript
- **Hosting**: Vercel + Supabase

## Quick Start

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/lschGSL/GSL-applications.git
cd GSL-applications
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Project Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key
3. Run the migration in the Supabase SQL Editor:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Paste and run it in the SQL Editor

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GSL Portal
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Make yourself admin

After registering your first account, run this in the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@company.com';
```

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Add environment variables (same as `.env.local`)
4. Deploy — Vercel auto-detects Next.js

### Custom Domain

1. In Vercel: **Settings > Domains > Add**
2. Point your domain's DNS to Vercel (CNAME or A record)
3. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables

## Domain Registration

Recommended registrars:
- **[Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)** — at-cost pricing, built-in DNS/CDN
- **[Namecheap](https://www.namecheap.com)** — good value, simple UI

Suggested domain names for GSL:
- `gsl-portal.com`
- `gsl-apps.com`
- `portal.gsl.com` (if you own `gsl.com`)

## Features

### Authentication
- Email/password with email verification
- Password reset flow
- Session management via Supabase Auth
- MFA support (configurable in Supabase dashboard)

### User Management
- Role-based access control: Admin, Manager, Member, Viewer
- Per-application access grants
- User activation/deactivation
- Profile management

### Application Hub
- Register internal and external applications
- Per-user app access control
- Application visibility (internal/external/both)
- One-click launch for authorized apps

### Audit Logging
- All sign-in/sign-out events
- User management actions
- Application access changes
- IP address and user agent tracking

### Security
- Row-Level Security (RLS) on all tables
- HTTPS-only with HSTS
- Security headers (X-Frame-Options, CSP, etc.)
- CSRF protection via Supabase Auth
- No secrets exposed to client

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register, forgot password
│   ├── (portal)/         # Authenticated portal pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── apps/         # Application hub
│   │   └── admin/        # Admin: users, apps, audit log, settings
│   ├── api/              # API routes for admin operations
│   └── auth/callback/    # OAuth callback handler
├── components/
│   ├── layout/           # Sidebar, top nav
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth/             # Server actions for auth
│   └── supabase/         # Supabase client setup
└── types/                # TypeScript type definitions

supabase/
└── migrations/           # Database schema
```

## Next Steps

- [ ] Set up Supabase project and run migration
- [ ] Deploy to Vercel
- [ ] Register your domain
- [ ] Enable MFA in Supabase dashboard
- [ ] Add your applications to the portal
- [ ] Invite team members
