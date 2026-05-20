-- ============================================================
-- Sprint Domains — Phase 1
-- Taxonomie partagée `domains` entre procedures / decisions / formations
--
-- Contenu :
--   1. Table `domains` + RLS + trigger updated_at
--   2. Seed des 6 domaines initiaux
--   3. Colonnes `domain_id` + `tags[]` sur procedures, decisions, formations
--   4. Index sur domain_id
--   5. Migration conservatrice des catégories existantes vers domain_id
--      (mapping limité aux slugs procedure_categories non ambigus)
--
-- Idempotent : IF NOT EXISTS / ON CONFLICT DO NOTHING.
-- N'altère ni ne supprime les colonnes legacy `category` / `category_id`
-- (préservées pour rollback ; suppression différée à un sprint ultérieur).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table `domains`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.domains (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  slug       text        NOT NULL UNIQUE,
  color      text        NOT NULL DEFAULT 'gray'
             CHECK (color IN ('blue','green','amber','purple','teal','coral','pink','gray')),
  icon       text,
  sort_order integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.domains IS
  'Taxonomie transversale partagée par procedures / decisions / formations.';

-- Trigger updated_at (réutilise handle_updated_at — défini par 012_procedures.sql)
DROP TRIGGER IF EXISTS domains_updated_at ON public.domains;
CREATE TRIGGER domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Domains readable by all authenticated" ON public.domains;
CREATE POLICY "Domains readable by all authenticated"
  ON public.domains FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Domains writable by admin" ON public.domains;
CREATE POLICY "Domains writable by admin"
  ON public.domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- 2. Seed des 6 domaines initiaux
-- ------------------------------------------------------------
INSERT INTO public.domains (name, slug, color, icon, sort_order) VALUES
  ('Odoo',         'odoo',         'blue',   'ti-database',     1),
  ('RH',           'rh',           'pink',   'ti-users',        2),
  ('IT / Dev',     'it-dev',       'purple', 'ti-code',         3),
  ('Sécurité',     'securite',     'amber',  'ti-shield',       4),
  ('Agent Fiscal', 'agent-fiscal', 'teal',   'ti-file-invoice', 5),
  ('Audit',        'audit',        'coral',  'ti-zoom-check',   6)
ON CONFLICT (slug) DO UPDATE SET
  name       = EXCLUDED.name,
  color      = EXCLUDED.color,
  icon       = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------------------
-- 3. domain_id + tags sur procedures / decisions / formations
-- ------------------------------------------------------------

-- procedures
ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL;
ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- decisions
ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL;
ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- formations
ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL;
ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- ------------------------------------------------------------
-- 4. Index sur domain_id
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS procedures_domain_id_idx ON public.procedures(domain_id);
CREATE INDEX IF NOT EXISTS decisions_domain_id_idx  ON public.decisions(domain_id);
CREATE INDEX IF NOT EXISTS formations_domain_id_idx ON public.formations(domain_id);

-- ------------------------------------------------------------
-- 5. Mapping conservateur catégorie → domaine
-- ------------------------------------------------------------
-- procedures : on s'appuie sur le slug de procedure_categories (relation procedures.category_id).
-- Mapping non ambigu uniquement ; les autres lignes restent domain_id=NULL.

WITH cat_to_domain AS (
  SELECT pc.id AS category_id, d.id AS domain_id
  FROM public.procedure_categories pc
  JOIN public.domains d ON d.slug = (
    CASE pc.slug
      WHEN 'dashboard-rentabilite' THEN 'odoo'
      WHEN 'administration-odoo'   THEN 'odoo'
      WHEN 'rh-paie'               THEN 'rh'
      WHEN 'git-deploiement'       THEN 'it-dev'
      WHEN 'aml-kyc'               THEN 'securite'
      WHEN 'agent-fiscal'          THEN 'agent-fiscal'
      ELSE NULL
    END
  )
)
UPDATE public.procedures p
   SET domain_id = c.domain_id
  FROM cat_to_domain c
 WHERE p.category_id = c.category_id
   AND p.domain_id IS NULL;

-- decisions : pas de colonne catégorie héritée ; on mappe par préfixe ADR-XXX
-- selon les ADR connus (mapping minimal, conservateur).
UPDATE public.decisions d
   SET domain_id = dom.id
  FROM public.domains dom
 WHERE d.domain_id IS NULL
   AND dom.slug = 'agent-fiscal'
   AND d.number = 'ADR-017';

UPDATE public.decisions d
   SET domain_id = dom.id
  FROM public.domains dom
 WHERE d.domain_id IS NULL
   AND dom.slug = 'odoo'
   AND d.number IN ('ADR-011','ADR-013','ADR-014','ADR-015');

-- formations : mapping par préfixe number.
UPDATE public.formations f
   SET domain_id = dom.id
  FROM public.domains dom
 WHERE f.domain_id IS NULL
   AND dom.slug = 'agent-fiscal'
   AND f.number LIKE 'F-AF-%';

UPDATE public.formations f
   SET domain_id = dom.id
  FROM public.domains dom
 WHERE f.domain_id IS NULL
   AND dom.slug = 'odoo'
   AND f.number LIKE 'F-PROJ-%';
