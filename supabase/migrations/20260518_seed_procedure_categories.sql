-- ============================================================
-- Sprint publication 26/05/2026 — Procédures GSL
-- Étape 3 : seed des 6 catégories + rattachement des procédures
--
-- Idempotent (ON CONFLICT / UPDATE ciblé par slug et number).
-- Ne modifie PAS la colonne `procedures.category` (TEXT) : seul
-- `category_id` (FK) est renseigné.
-- ============================================================

-- 1. Les 6 catégories de procédures
INSERT INTO public.procedure_categories
  (slug, name, icon, sort_order, published, placeholder)
VALUES
  ('dashboard-rentabilite', 'Dashboard & rentabilité', 'chart-bar',    1, true,  NULL),
  ('rh-paie',               'RH & paie',               'users',        2, true,  NULL),
  ('administration-odoo',   'Administration Odoo',     'cog',          3, true,  NULL),
  ('git-deploiement',       'Git & déploiement',       'git-branch',   4, true,  NULL),
  ('aml-kyc',               'AML / KYC',               'shield-check', 5, false,
     'Cette section accueillera prochainement les procédures AML et KYC de GSL Group.'),
  ('procedures-internes',   'Procédures internes',     'file-text',    6, false,
     'Cette section accueillera prochainement le règlement interne et les procédures transverses de GSL Group.')
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  icon        = EXCLUDED.icon,
  sort_order  = EXCLUDED.sort_order,
  published   = EXCLUDED.published,
  placeholder = EXCLUDED.placeholder;

-- 2. Rattachement des procédures existantes à leur catégorie.
--    UPDATE ciblé par `number` — n'altère que `category_id`.
UPDATE public.procedures
   SET category_id = (SELECT id FROM public.procedure_categories WHERE slug = 'dashboard-rentabilite')
 WHERE number = 'PRO-DAH-001';

UPDATE public.procedures
   SET category_id = (SELECT id FROM public.procedure_categories WHERE slug = 'rh-paie')
 WHERE number = 'PRO-601';
