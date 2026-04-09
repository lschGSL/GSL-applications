# Skill: GSL Apps Architecture

## Standard GSL App Blueprint

```
[apps.gsl.lu] → SSO → [app.vercel.app/auth/exchange] → [app pages]
                              ↕
                    [Supabase: auth + data]
```

## Key Decisions
- **Auth**: Always Supabase SSO via apps.gsl.lu — never build custom auth
- **Data**: Supabase Postgres with RLS — never expose service_role key to client
- **Rendering**: Server Components by default, Client Components only for interactivity
- **State**: URL search params > React state > Context > Zustand (escalate only when needed)
- **Forms**: Server Actions for mutations, Zod for validation
- **Files**: Supabase Storage for user uploads, signed URLs for access

## Naming Conventions
- Repos: `gsl-[app-name]` (e.g., `gsl-doc-converter`, `gsl-xml-invoice`)
- Vercel projects: match repo name
- Supabase tables: `snake_case`, plural (e.g., `invoices`, `client_profiles`)

## Error Handling
- API routes: return `{ error: string }` with appropriate HTTP status
- Pages: use `error.tsx` boundaries
- Log errors server-side, show user-friendly messages client-side
