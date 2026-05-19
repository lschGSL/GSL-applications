-- ============================================================
-- Sprint publication 26/05/2026 — Partie 2, Étape 7
-- Import des 6 fiches de formation :
--   - F-PROJ-01 à F-PROJ-05 : éclatées depuis l'agrégat
--     gsl-odoo-workflow/docs/training/points-formation-projets.md
--   - F-PROJ-06 : fiche créée pour le sprint
-- Idempotent : ON CONFLICT (number) DO UPDATE.
-- duration_min = durée de lecture estimée (nb mots / 200).
-- ============================================================

-- F-PROJ-01
INSERT INTO public.formations (number, slug, title, duration_min, content)
VALUES (
  'F-PROJ-01', 'f-proj-01-convention-nommage-projets',
  'Convention de nommage des projets', 1,
  $md$> **Durée de lecture** : ~1 min

# F-PROJ-01 — Convention de nommage des projets

**Objectif** : tous les collaborateurs savent lire et retrouver un projet
d'après la convention unique GSL.

**Contenu**
- Pourquoi une convention unique (cf. ADR-003, contexte dispersion
  historique).
- Les 4 formats officiels :
  1. `[Client]-[date]-[SO]-[Template]` — SO avec tag de date
  2. `[Client]-[année]-[SO]-[Template]` — SO avec tag d'année
  3. `[Client]-[SO]-[Template]` — SO sans tag temporel
  4. `[Client]-[période]-[Template]` — création via wizard
- Lecture pratique sur 5 exemples réels de l'instance prod.
- Comment le nom est **automatiquement** composé par `gsl_custom` : on
  ne tape plus rien à la main.

**Exercice** : retrouver un projet donné à partir d'un nom de client et
d'une période, via la barre de recherche kanban projets.

**Durée de la session** : 20 min
**Support** : ADR-003 + 5 captures kanban prod
**Résultat attendu** : collaborateur capable de décoder n'importe quel
nom de projet existant.

## Références

- [ADR-003 — Project naming standardization](../decisions/ADR-003-project-naming-standardization.md)$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min, content = EXCLUDED.content,
  updated_at = now();

-- F-PROJ-02
INSERT INTO public.formations (number, slug, title, duration_min, content)
VALUES (
  'F-PROJ-02', 'f-proj-02-champ-nom-court-short-name',
  'Champ « Nom court » (short_name) sur la fiche client', 1,
  $md$> **Durée de lecture** : ~1 min

# F-PROJ-02 — Champ "Nom court" (short_name) sur la fiche client

**Objectif** : comprendre à quoi sert `short_name`, savoir le corriger
sur un nouveau client.

**Contenu**
- Où se trouve le champ sur la fiche `res.partner` (onglet GSL).
- Règles du nom court :
  - Sans forme juridique (SARL/SA/GmbH…)
  - Abréviations métier autorisées (Compta, Admin, Intl, Lux, Mgmt, Dev,
    Fid, Immo, Tech, Svc…)
  - Max 40 caractères
  - Format individus : `F. Nom` (initiale prénom)
- Impact sur le nom des projets générés par la suite.
- 738 `short_name` ont été pré-renseignés automatiquement le 15/04/2026
  via le script `docs/scripts/short-name-bulk-populate.py` — la formation
  porte sur la **création de nouveaux clients**.
- Rappel : si le client n'a pas de `client_code`, le nom court est
  **obligatoire** (sinon le nom du projet dégrade). 93 clients sans
  client_code restent à régulariser (tâche P1).

**Exercice** : créer un client fictif et observer le nom du projet généré
au lancement d'un template.

**Durée de la session** : 20 min
**Support** : fiche partner vide + un template de test
**Résultat attendu** : manager capable de corriger un `short_name` et
d'expliquer l'impact sur le nom du projet.$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min, content = EXCLUDED.content,
  updated_at = now();

-- F-PROJ-03
INSERT INTO public.formations (number, slug, title, duration_min, content)
VALUES (
  'F-PROJ-03', 'f-proj-03-tags-so-annee-date',
  'Tags SO année et date', 1,
  $md$> **Durée de lecture** : ~1 min

# F-PROJ-03 — Tags SO année et date

**Objectif** : savoir ajouter le bon tag temporel sur un sale order pour
que le projet instancié porte la bonne période.

**Contenu**
- Les deux types de tags reconnus par `gsl_custom` :
  - **Tag année** (`year_tag`) : format `YYYY`, ex. `2026`. Utilisé pour
    les missions annuelles (bilan, déclarations fiscales annuelles).
  - **Tag date** (`date_tag`) : format `YYYY-MM` ou `YYYY-MM-DD`. Utilisé
    pour les missions mensuelles, trimestrielles, ou ponctuelles datées.
- Effet concret : propagation automatique dans le nom du projet et dans
  le rapport pivot pré-facturation.
- Cas "pas de tag" : le projet est créé en format `[Client]-[SO]-[Template]`,
  sans période. À n'utiliser que pour les missions non récurrentes.
- Démo live : créer un SO, ajouter un tag année, confirmer, constater le
  nom du projet généré.

**Exercice** : sur un SO de test, ajouter successivement les trois cas
(année / date / aucun) et observer le nom du projet résultant.

**Durée de la session** : 20 min
**Support** : 1 SO de test par stagiaire
**Résultat attendu** : commercial/manager capable de poser le bon tag
avant confirmation d'un SO.$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min, content = EXCLUDED.content,
  updated_at = now();

-- F-PROJ-04
INSERT INTO public.formations (number, slug, title, duration_min, content)
VALUES (
  'F-PROJ-04', 'f-proj-04-etapes-projet-standardisees',
  'Étapes projet standardisées (34 étapes)', 1,
  $md$> **Durée de lecture** : ~1 min

# F-PROJ-04 — Étapes projet standardisées (34 étapes)

**Objectif** : connaître les étapes standardisées, savoir les utiliser
dans le kanban projets et dans les tâches.

**Contenu**
- Les **34 étapes** retenues après nettoyage du 15/04/2026 (avant nettoyage :
  stages hérités incohérents selon les projets).
- Lecture du kanban : où placer une tâche selon l'avancement réel.
- Focus sur les étapes spéciales :
  - `Awaiting Documents` (hérité `lux_project`) — déclenche notification
    client.
  - `In Review` — attribue automatiquement le reviewer.
  - `Done` / `Cancelled` — impact sur la facturation.
- Règle d'or : on **n'invente pas** de nouvelle étape — si besoin, demande
  au manager Odoo référent.

**Exercice** : déplacer 3 tâches dans le kanban selon un scénario donné.

**Durée de la session** : 20 min
**Support** : un projet de démo avec 10 tâches
**Résultat attendu** : collaborateur autonome sur les étapes, n'en crée
aucune nouvelle.

## Références

- [PRO-701 — Modifier ou supprimer des étapes de tâches en toute sécurité](../procedures/PRO-701-modifier-stages-taches.md)$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min, content = EXCLUDED.content,
  updated_at = now();

-- F-PROJ-05
INSERT INTO public.formations (number, slug, title, duration_min, content)
VALUES (
  'F-PROJ-05', 'f-proj-05-dashboards-controle-budget',
  'Dashboards et contrôle budget', 1,
  $md$> **Durée de lecture** : ~1 min

# F-PROJ-05 — Dashboards et contrôle budget

**Objectif** : savoir lire les dashboards projets/timesheets et détecter
les dépassements budget.

**Contenu**
- Les 3 dashboards disponibles après le 15/04/2026 :
  1. **Pré-facturation** — pivot heures imputables par client/mois.
  2. **Contrôle budget** — comparaison heures vendues / heures imputées
     par projet.
  3. **Avancement missions récurrentes** — suivi des tâches M1/M2/M3…
- Lecture d'un pivot : filtre par année (via tag SO), par société
  (Fid/Rev/Grp), par manager.
- Seuils de dépassement à retenir :
  - 🟢 ≤ 80 % du budget
  - 🟡 80 – 100 %
  - 🔴 > 100 % → escalade manager
- Procédure à suivre en cas de dépassement (lien vers procédure managers
  à rédiger).

**Exercice** : identifier sur le dashboard de démo 1 projet en dépassement
et proposer l'action à entreprendre.

**Durée de la session** : 20 min
**Support** : dashboard live + 1 projet volontairement en dépassement
**Résultat attendu** : manager capable d'ouvrir un dashboard, filtrer, et
réagir à un dépassement.

## Références

- [PRO-DAH-001 — Accès au Dashboard Rentabilité GSL](../procedures/PRO-DAH-001-acces-dashboard-rentabilite.md)$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min, content = EXCLUDED.content,
  updated_at = now();

-- F-PROJ-06 — fiche créée pour le sprint
INSERT INTO public.formations (number, slug, title, duration_min, content)
VALUES (
  'F-PROJ-06', 'f-proj-06-conventions-nommage-branches-commits',
  'Conventions de nommage des branches et commits GSL', 2,
  $md$> **Durée de lecture** : ~2 min

# F-PROJ-06 — Conventions de nommage des branches et commits GSL

**Objectif** : tout collaborateur contribuant au code des applications
GSL applique les mêmes conventions Git, pour un historique lisible et
des revues fluides.

## Nommage des branches

Toute nouvelle branche de travail suit le format `claude/[feature-name]`,
où `[feature-name]` décrit la fonctionnalité en quelques mots séparés par
des tirets (ex. `claude/sprint-publication-26mai`). Le préfixe `claude/`
identifie les branches de développement assisté. On ne travaille jamais
directement sur une branche partagée comme `main`.

## Nommage des commits

Chaque message de commit respecte le format `type(scope): description` :

- **`type`** est l'un de :
  - `feat` — nouvelle fonctionnalité
  - `fix` — correction de bug
  - `chore` — maintenance, configuration
  - `docs` — documentation
  - `test` — ajout ou modification de tests
  - `refactor` — réorganisation du code sans changement de comportement
- **`scope`** (optionnel) précise la zone touchée, ex. `feat(content): …`.
- **`description`** est courte, à l'impératif, et explique l'intention du
  changement.

Exemple : `feat(nav): ajout du menu Formations dans la sidebar`.

## Règles de workflow

- **1 fonctionnalité = 1 branche = 1 PR.** On ne mélange pas plusieurs
  sujets dans une même branche : chaque sujet a sa branche et sa Pull
  Request dédiées.
- **Jamais de commit direct sur `main`.** Toute modification passe par une
  branche puis une Pull Request.
- **Luc Schmitt est l'unique approbateur des PR.** Aucune PR n'est mergée
  sans sa revue préalable.
- **Déploiement automatique** : le merge d'une PR sur `main` déclenche le
  déploiement automatique sur Vercel. Merger une PR équivaut donc à une
  mise en production immédiate — d'où l'importance de la revue.

**Résultat attendu** : collaborateur capable de nommer correctement une
branche et ses commits, et de respecter le cycle
branche → PR → revue → merge.$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min, content = EXCLUDED.content,
  updated_at = now();
