-- ============================================================
-- Sprint publication 26/05/2026 — Partie 2, Étape 7.5
-- Conversion des liens markdown internes en routes applicatives.
--
-- Les liens pointent vers les ROUTES RÉELLES (slugs effectifs en
-- base), et non vers le pattern littéral du brief (`/decisions/adr-XXX-slug`)
-- qui ne correspond pas au schéma de slugs adopté.
--
-- Deux traitements :
--  1. Cible importée  -> remplacement de l'URL par la route app.
--  2. Cible NON importée (ADR-002/003/010/012, references/) ->
--     dé-liaison : [label](url) devient label (0 lien mort).
--
-- Idempotent (les .md ont disparu après la 1re passe).
-- ============================================================

-- ---------- 1. Dé-liaison des cibles non importées ----------
-- Appliqué aux 3 tables. [label](...fichier.md) -> label
DO $$
DECLARE
  tbl text;
  dead text[] := ARRAY[
    'ADR-002-task-stage-cleanup\.md',
    'ADR-003-project-naming-standardization\.md',
    'ADR-010-git-workflow-itc-recommendations\.md',
    'ADR-012-task-stage-automations\.md',
    'task-stages-reference\.md'
  ];
  pat text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['procedures','decisions','formations'] LOOP
    FOREACH pat IN ARRAY dead LOOP
      EXECUTE format(
        'UPDATE public.%I SET content = regexp_replace(content,
           %L, %L, %L)',
        tbl,
        '\[([^\]]*)\]\([^)]*' || pat || '\)',
        '\1',
        'g'
      );
    END LOOP;
  END LOOP;
END $$;

-- ---------- 2. Conversion des cibles importées en routes ----------
-- Appliqué aux 3 tables. (...fichier.md) -> (/route)
DO $$
DECLARE
  tbl text;
  map text[][] := ARRAY[
    ['ADR-011-so-closure-convention\.md',                  '/decisions/so-closure-convention'],
    ['ADR-013-parametrage-listes-distribution-mails\.md',  '/decisions/parametrage-listes-distribution-mails'],
    ['ADR-014-cron-budget-v4-anomalies\.md',               '/decisions/cron-budget-v4-anomalies'],
    ['ADR-015-tag-projets-a-allouer\.md',                  '/decisions/tag-projets-a-allouer'],
    ['PRO-700-pr-itc-notification\.md',                    '/procedures/pr-itc-notification'],
    ['PRO-701-modifier-stages-taches\.md',                 '/procedures/modifier-stages-taches'],
    ['PRO-603-so-verrouillage\.md',                        '/procedures/so-verrouillage'],
    ['PRO-604-cron-recap-budget\.md',                      '/procedures/cron-recap-budget'],
    ['PRO-605-tag-projets-a-allouer\.md',                  '/procedures/tag-projets-a-allouer'],
    ['PRO-DAH-001-acces-dashboard-rentabilite\.md',        '/procedures/acces-dashboard-rentabilite']
  ];
  i int;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['procedures','decisions','formations'] LOOP
    FOR i IN 1 .. array_length(map, 1) LOOP
      EXECUTE format(
        'UPDATE public.%I SET content = regexp_replace(content,
           %L, %L, %L)',
        tbl,
        '\([^)]*' || map[i][1] || '\)',
        '(' || map[i][2] || ')',
        'g'
      );
    END LOOP;
  END LOOP;
END $$;
