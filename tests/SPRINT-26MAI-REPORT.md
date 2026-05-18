# Rapport Sprint Publication — 26/05/2026

Généré le : 2026-05-18
Branche : `claude/sprint-publication-26mai-part2`
Projet Supabase : `kwjgfljzdgpfyqknakmy`

## Résumé

| Étape | Statut | Détail |
|-------|--------|--------|
| Étape 4 — Procédures | ✅ | 6 procédures importées/mises à jour + PRO-601 rattachée |
| Étape 5 — Navigation | ✅ | Décisions + Formations ajoutés à la sidebar (desktop + mobile) |
| Étape 6 — ADR | ✅ | 4 ADR importés, table `decisions` + routes créées |
| Étape 7 — Formations | ✅ | 6 fiches (5 éclatées + F-PROJ-06), table `formations` + routes créées |
| Étape 7.5 — Liens | ✅ | 17 liens internes convertis, 0 lien `.md` résiduel |
| Étape 8 — Tests | ⚠️ | 19/19 routes HTTP 200, 0 page 404 — tests authentifiés non exécutés (voir anomalies) |

## Procédures importées

Table `procedures` — 7 lignes (status `published`) :

| number | slug | category_id (slug) | category (legacy) | source |
|--------|------|--------------------|--------------------|--------|
| PRO-DAH-001 | `acces-dashboard-rentabilite` | dashboard-rentabilite | portal | MAJ (déjà en base) |
| PRO-601 | `pro-601` | rh-paie | rh | rattachement seul (pas de fichier source) |
| PRO-603 | `so-verrouillage` | administration-odoo | it | importé |
| PRO-604 | `cron-recap-budget` | administration-odoo | it | importé |
| PRO-605 | `tag-projets-a-allouer` | administration-odoo | it | importé |
| PRO-700 | `pr-itc-notification` | git-deploiement | it | importé |
| PRO-701 | `modifier-stages-taches` | administration-odoo | it | importé |

## ADR importés

Table `decisions` — 4 lignes (status `Accepté`) :

| number | slug | titre |
|--------|------|-------|
| ADR-011 | `so-closure-convention` | Convention de clôture des bons de commande |
| ADR-013 | `parametrage-listes-distribution-mails` | Paramétrage des listes de distribution pour les mails internes automatisés |
| ADR-014 | `cron-budget-v4-anomalies` | Cron récap budget v4 : filtre anomalies Fidu+Mgmt et Direction consolidée |
| ADR-015 | `tag-projets-a-allouer` | Tag « À allouer » pour le suivi des projets sans manager assigné |

## Formations importées

Table `formations` — 6 lignes :

| number | slug | duration_min |
|--------|------|--------------|
| F-PROJ-01 | `f-proj-01-convention-nommage-projets` | 1 |
| F-PROJ-02 | `f-proj-02-champ-nom-court-short-name` | 1 |
| F-PROJ-03 | `f-proj-03-tags-so-annee-date` | 1 |
| F-PROJ-04 | `f-proj-04-etapes-projet-standardisees` | 1 |
| F-PROJ-05 | `f-proj-05-dashboards-controle-budget` | 1 |
| F-PROJ-06 | `f-proj-06-conventions-nommage-branches-commits` | 2 |

F-PROJ-01 à 05 : éclatées depuis `docs/training/points-formation-projets.md` (fichier
source agrégé conservé). F-PROJ-06 : fiche créée pour le sprint.

## Résultats des tests HTTP

Tests exécutés via `scripts/test-publication-sprint.ts` sur `http://localhost:3000`
(serveur de production local `npm run start`).

| Indicateur | Résultat |
|------------|----------|
| Routes testées | 19 |
| Routes HTTP 200 | 19/19 |
| Pages 404 détectées | 0 |
| Branding « GSL » présent | 19/19 |
| Liens internes morts (crawler) | 0 |
| Test CRUD admin | non exécuté (identifiants admin non fournis) |

⚠️ **Limite importante** : les 19 routes appartiennent au groupe `(portal)`, protégé par
le middleware d'authentification. Sans session, chaque requête est redirigée vers `/login`
(HTTP 200, branding GSL présent). Le test HTTP confirme donc que **les routes sont câblées
et ne plantent pas**, mais ne vérifie pas le rendu du contenu authentifié. Le crawler de
liens internes a parcouru la page `/login` (0 lien `/procedures|/decisions|/formations`).

### Vérification substantielle au niveau base de données

Pour compenser cette limite, le contenu et les liens ont été vérifiés directement en base
via le Supabase MCP :

- **Contenu présent** : 7 procédures publiées, 4 décisions, 6 formations, 6 catégories.
- **Slugs** : les 19 slugs des routes de test correspondent tous à une ligne en base.
- **Liens internes** : les 17 liens applicatifs présents dans les contenus
  (`/procedures/*`, `/decisions/*`) pointent **tous** vers une ligne existante —
  **0 lien mort**.
- **Build production** : `npm run build` compile les 19 routes sans erreur.

## Liens internes convertis

Étape 7.5 — 17 liens markdown internes convertis en routes applicatives :

| Table | Liens convertis |
|-------|-----------------|
| procedures | 6 |
| decisions | 9 |
| formations | 2 |

Les liens vers des documents non importés (ADR-002, ADR-003, ADR-010, ADR-012,
`references/task-stages-reference`) ont été **dé-liés** (le libellé est conservé, le lien
mort retiré) pour garantir 0 lien mort. 0 lien `.md` résiduel.

## Anomalies détectées

1. **PRO-601 — pas de fichier source** dans `gsl-odoo-workflow`. Conformément au brief,
   seul le rattachement `category_id` → `rh-paie` a été effectué (déjà fait en Partie 1).
   Le contenu de PRO-601 n'a pas été mis à jour et son slug reste `pro-601`.

2. **PRO-DAH-001 — changement de slug**. Le slug en base était `pro-dah-001` ; il a été
   aligné sur `acces-dashboard-rentabilite` (slug dérivé du nom de fichier, cohérent avec
   les 5 autres procédures et avec la route de test attendue). Aucune donnée perdue.

3. **Documents référencés mais hors périmètre d'import** : ADR-002, ADR-003, ADR-010,
   ADR-012 et `references/task-stages-reference.md` sont cités dans les contenus importés
   mais ne font pas partie du périmètre du sprint. Leurs liens ont été dé-liés.

4. **Pattern de conversion de liens du brief inapplicable tel quel**. Le brief prévoyait
   `../decisions/ADR-XXX-slug.md → /decisions/adr-XXX-slug`. Le schéma de slugs réellement
   adopté ne porte pas le préfixe `adr-`/`pro-` (ex. `/decisions/so-closure-convention`).
   Les liens ont été convertis vers les **routes réelles** afin d'éviter des liens morts.

5. **Tests authentifiés non exécutés**. Les routes `(portal)` exigent une session ;
   le test CRUD admin (`POST`/`DELETE` sur `/api/admin/procedure-categories`) et la
   vérification du contenu rendu nécessitent des identifiants admin
   (`TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`) non fournis. Le script est prêt à les
   utiliser dès qu'ils seront disponibles.

6. **Contrainte ajoutée** : `UNIQUE (number)` sur la table `procedures` — nécessaire pour
   les upserts `ON CONFLICT (number)`. La table n'avait qu'une contrainte unique sur
   `slug`. La colonne `category` (TEXT) et son CHECK n'ont pas été modifiés.

## Questions pour Luc

1. **Slug PRO-DAH-001** : valider le passage de `pro-dah-001` à
   `acces-dashboard-rentabilite` (anomalie n°2).
2. **Identifiants de test admin** : fournir un compte admin de test pour exécuter les
   tests authentifiés (routes `(portal)` + CRUD admin).
3. **ADR hors périmètre** : ADR-002, ADR-003, ADR-010, ADR-012 sont référencés par les
   contenus importés. Faut-il les importer lors d'un prochain sprint pour rétablir ces
   liens ?
