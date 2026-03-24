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
