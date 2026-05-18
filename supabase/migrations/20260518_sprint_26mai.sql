-- ============================================================
-- Sprint publication 26/05/2026 — Procédures GSL
-- Étape 1 : table `procedure_categories` + colonne `category_id`
--
-- Idempotent (rejouable sans effet de bord).
-- NE MODIFIE PAS la colonne `procedures.category` (TEXT) ni sa
-- contrainte CHECK : elle reste intacte pour compatibilité ascendante.
-- La nouvelle colonne `procedures.category_id` est SÉPARÉE.
-- ============================================================

-- 1. Table des catégories de procédures
CREATE TABLE IF NOT EXISTS public.procedure_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  icon        text,
  sort_order  integer NOT NULL DEFAULT 0,
  published   boolean NOT NULL DEFAULT false,
  placeholder text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.procedure_categories IS
  'Catégories de procédures GSL — sprint publication 26/05/2026.';

-- 2. Trigger updated_at — réutilise handle_updated_at() (même fonction que la table procedures)
DROP TRIGGER IF EXISTS procedure_categories_updated_at ON public.procedure_categories;
CREATE TRIGGER procedure_categories_updated_at
  BEFORE UPDATE ON public.procedure_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Row-Level Security — calqué sur la table `procedures`
ALTER TABLE public.procedure_categories ENABLE ROW LEVEL SECURITY;

-- Lecture : tout utilisateur authentifié (toutes lignes, publiées ou non —
-- les catégories non publiées affichent un placeholder côté UI).
DROP POLICY IF EXISTS "Employees can read procedure categories" ON public.procedure_categories;
CREATE POLICY "Employees can read procedure categories"
  ON public.procedure_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- Écriture : admin uniquement (identique à la policy "Admins can manage procedures").
DROP POLICY IF EXISTS "Admins can manage procedure categories" ON public.procedure_categories;
CREATE POLICY "Admins can manage procedure categories"
  ON public.procedure_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. Colonne category_id sur procedures — SÉPARÉE de la colonne `category` TEXT.
--    ON DELETE SET NULL : la suppression d'une catégorie ne supprime aucune procédure.
ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS category_id uuid
  REFERENCES public.procedure_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS procedures_category_id_idx
  ON public.procedures(category_id);
