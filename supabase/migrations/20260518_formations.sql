-- ============================================================
-- Sprint publication 26/05/2026 — Partie 2, Étape 7
-- Table `formations` (fiches de formation).
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.formations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  number       text        UNIQUE NOT NULL,   -- ex: "F-PROJ-01"
  slug         text        UNIQUE NOT NULL,
  title        text        NOT NULL,
  duration_min int,                           -- durée de lecture estimée (minutes)
  content      text        NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.formations IS
  'Fiches de formation GSL — sprint publication 26/05/2026.';

ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read formations" ON public.formations;
CREATE POLICY "Authenticated users can read formations"
  ON public.formations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage formations" ON public.formations;
CREATE POLICY "Admins can manage formations"
  ON public.formations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','manager')
  ));

DROP TRIGGER IF EXISTS trg_formations_updated_at ON public.formations;
CREATE TRIGGER trg_formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
