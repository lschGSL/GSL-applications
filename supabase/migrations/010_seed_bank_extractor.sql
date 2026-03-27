-- Seed: Register Bank Extractor application in the portal
-- Run this in Supabase SQL Editor after deploying

-- 1. Insert the Bank Extractor application
INSERT INTO public.applications (name, slug, description, url, icon_url, visibility, entity, is_active)
VALUES (
  'Bank Extractor',
  'bank-extractor',
  'Extraction de transactions bancaires depuis des relevés PDF luxembourgeois (BGL, BCEE, BIL, BDL, Raiffeisen, POST)',
  'https://gsl-bank-extractor.vercel.app',
  'https://ui-avatars.com/api/?name=Bank+Extractor&background=009a44&color=fff&size=128&font-size=0.35&bold=true&format=svg',
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
WHERE a.slug = 'bank-extractor'
  AND p.is_active = true
  AND p.role IN ('admin', 'manager', 'member', 'viewer')
ON CONFLICT (user_id, app_id) DO NOTHING;
