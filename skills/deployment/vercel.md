# Skill: Vercel Deployment

## Pre-deploy Checklist
1. `npm run build` passes with zero errors
2. All env vars set in Vercel dashboard
3. CHANGELOG.md updated
4. `main` branch is clean

## Vercel Config (`vercel.json`, if needed)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

## Environment Variables
- Set in Vercel dashboard → Settings → Environment Variables
- Use `NEXT_PUBLIC_` prefix for client-side vars only
- Never commit `.env.local`

## Custom Domain
- Add in Vercel → Settings → Domains
- For GSL apps: `[app].gsl.lu` CNAME → `cname.vercel-dns.com`

## Common Build Fixes
- TypeScript errors: fix them, don't suppress with `// @ts-ignore`
- Missing deps: check `package.json` — Vercel installs from lockfile
- Image optimization: use `next/image` with `remotePatterns` in `next.config.js`
