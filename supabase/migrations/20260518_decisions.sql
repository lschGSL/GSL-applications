-- ============================================================
-- Sprint publication 26/05/2026 — Partie 2, Étape 6
-- Table `decisions` (ADR — Architecture Decision Records).
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.decisions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  number       text        UNIQUE NOT NULL,            -- ex: "ADR-011"
  slug         text        UNIQUE NOT NULL,            -- ex: "so-closure-convention"
  title        text        NOT NULL,
  status       text        NOT NULL DEFAULT 'Accepté'
               CHECK (status IN ('Accepté','Proposé','Obsolète','Remplacé')),
  summary      text,                                   -- résumé exécutif (généré)
  content      text        NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.decisions IS
  'Architecture Decision Records (ADR) GSL — sprint publication 26/05/2026.';

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read decisions" ON public.decisions;
CREATE POLICY "Authenticated users can read decisions"
  ON public.decisions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage decisions" ON public.decisions;
CREATE POLICY "Admins can manage decisions"
  ON public.decisions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','manager')
  ));

DROP TRIGGER IF EXISTS trg_decisions_updated_at ON public.decisions;
CREATE TRIGGER trg_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
