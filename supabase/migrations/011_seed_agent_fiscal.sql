-- Seed: Register Agent Fiscal application in the portal
-- Run this in Supabase SQL Editor after deploying

-- 1. Insert the Agent Fiscal application
INSERT INTO public.applications (name, slug, description, url, icon_url, visibility, entity, is_active)
VALUES (
  'Agent Fiscal',
  'agent-fiscal',
  'Assistant IA pour la fiscalité luxembourgeoise — déclarations, conformité, conseil fiscal',
  'https://gsl-agent-fiscal.vercel.app',
  'https://ui-avatars.com/api/?name=Agent+Fiscal&background=1a3a5c&color=fff&size=128&font-size=0.35&bold=true&format=svg',
  'internal',
  NULL,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  icon_url = EXCLUDED.icon_url;

-- 2. Grant access to all active internal users (not clients)
INSERT INTO public.app_access (user_id, app_id, granted_by)
SELECT
  p.id,
  a.id,
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
FROM public.profiles p
CROSS JOIN public.applications a
WHERE a.slug = 'agent-fiscal'
  AND p.is_active = true
  AND p.role IN ('admin', 'manager', 'member', 'viewer')
ON CONFLICT (user_id, app_id) DO NOTHING;
