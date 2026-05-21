-- Sprint documentation 21/05/2026
-- Rapport de nettoyage données Odoo GSL — intégration dans Formations

-- Créer la catégorie si elle n'existe pas
INSERT INTO procedure_categories (slug, name, description, icon, color, sort_order, created_at, updated_at)
VALUES (
  'odoo-donnees',
  'Données & qualité Odoo',
  'Rapports de nettoyage, audits de données et bonnes pratiques Odoo',
  'database',
  '#5BAFD6',
  30,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Insérer la formation/rapport
INSERT INTO formations (
  slug,
  title,
  description,
  content,
  category_id,
  status,
  visibility,
  duration_minutes,
  created_at,
  updated_at
)
SELECT
  'f-nettoyage-donnees-mai2026',
  'Rapport de nettoyage — Fiabilisation des données Odoo (mai 2026)',
  'Rapport complet du chantier de fiabilisation des données Odoo mené en mai 2026 : 144 projets mal-routés, budgets incorrects, verrou automatique, orphelins Fiduciaire. Causes racines identifiées et bonnes pratiques à retenir.',
  '# Rapport de nettoyage — Fiabilisation des données Odoo GSL
**Période couverte** : 09/05/2026 → 21/05/2026  
**Réalisé par** : Luc Schmitt  
**Périmètre** : GSL Fiduciaire · GSL Révision · GSL Management  
**Références** : ADR-011 · ADR-016 · ADR-017 · PRO-606 v2.0

---

## Contexte général

Depuis fin avril 2026, GSL Group a engagé un chantier de fiabilisation complet de ses données Odoo 18. Ce travail fait suite à la détection d''anomalies dans le dashboard de rentabilité — des heures timesheetées et des revenus qui n''apparaissaient pas ou étaient attribués aux mauvais clients.

Ce rapport documente l''ensemble des actions réalisées, leurs causes et les bonnes pratiques qui en découlent.

---

## Phase 1 — Investigation et correction des 144 projets mal-routés (09-20/05/2026)

### Le problème découvert

Un audit a révélé que **144 projets actifs** (sur ~400) étaient liés au mauvais bon de commande dans le système. Concrètement : un projet nommé "S00125 - Comptes Annuels CLIENT A" pointait vers le bon de commande de CLIENT B. Les heures et les revenus étaient donc comptabilisés sur le mauvais client.

**Impact mesuré :**
- 622,25 heures mal attribuées dans le dashboard
- 112 clients affectés
- 50 projets avec des factures émises sur le mauvais dossier commercial

### Pourquoi ce n''est pas visible sans outil ?

Le champ technique qui relie un projet à son bon de commande n''était pas suivi dans Odoo. Aucune trace n''était laissée quand il était modifié — ni qui l''avait changé, ni quand, ni quelle était l''ancienne valeur.

### Investigation sur les causes

5 tests ont été menés sur l''environnement de test (staging) avec annulation systématique après chaque test. Résultat : **aucune action utilisateur normale ne reproduit ce problème.** Les workflows d''Isabelle Perbal ont été testés en direct et validés propres — elle a été formellement innocentée.

**Conclusion :** les modifications provenaient d''opérations techniques directes réalisées entre 2024 et 2026 lors de migrations et corrections de données, sans traçabilité.

### Corrections réalisées

| Méthode | Volume |
|---|---|
| Script automatique (correspondance nom→SO) | 137 projets |
| Corrections manuelles cas par cas | 5 projets |
| Archivage (SO inexistant — S00089, S00123) | 2 projets |
| **Total corrigé** | **144 projets** |

**Décision ADR-016** : activation du suivi sur le lien projet-bon de commande. Tout futur changement est désormais tracé dans le journal du projet : qui a changé quoi, quand, et quelle était l''ancienne valeur.

**Bonne pratique :** toute modification technique du lien projet-dossier commercial passe désormais par un script versionné dans le dépôt Git, avec une phase de test préalable.

---

## Phase 2 — Correction des budgets à 1h "placeholder" (19/05/2026)

### Le problème

Le rapport hebdomadaire du mardi matin a mis en évidence des dizaines de missions en "dépassement" à plus de 1000%. En creusant, il s''est avéré que ces dossiers avaient été créés avec un budget de **1 heure** — non pas comme estimation réelle, mais simplement parce qu''aucun budget n''avait été renseigné à la création.

Le système affichait donc un dépassement dès la première heure travaillée, ce qui n''était pas un vrai dépassement mais une donnée manquante.

### Actions réalisées

Un mail a été envoyé le 19/05/2026 à Isabelle Perbal, Viviane Poirier et Isabelle Sinibaldi avec la liste des ~30 dossiers concernés. Toutes ont corrigé les budgets avant le 22/05/2026 — avec une exception :

**S00108 ALLTRA** : Isabelle Perbal ne pouvait pas modifier le prix unitaire (bloqué par Odoo sur un dossier confirmé). Elle a contourné en mettant qty=3 × 2000€ ≈ 6000€. À corriger proprement lors d''une prochaine session (montant forfaitaire exact à confirmer avec Isabelle Sinibaldi).

**Décision métier validée** : l''établissement des comptes annuels est en forfait par défaut chez GSL Fiduciaire. Le budget doit refléter le montant forfaitaire estimé, pas les heures.

**Bonne pratique :** la personne qui confirme un dossier commercial est responsable de renseigner un budget réel dès la confirmation. Un budget à 1h n''est pas un budget — c''est une donnée manquante.

---

## Phase 3 — Désactivation du verrou automatique des dossiers (19/05/2026)

### Le problème

Odoo était configuré pour verrouiller automatiquement tout bon de commande dès sa confirmation. Cette option créait une friction importante au quotidien : pour mettre à jour les quantités livrées sur les lignes de frais (frais IRE & CSSF, frais AML/KYC, frais de bureau), il fallait déverrouiller manuellement le dossier à chaque facturation.

### Investigation préalable

Avant toute action, vérification systématique des dépendances :
- Actions automatiques sur les bons de commande → 0 détecté
- Actions serveur mentionnant le verrouillage → 0 détecté
- Règles d''enregistrement → 0 bloquer
- Crons GSL → 2 crons utilisent le verrou pour **exclure** les missions terminées (comportement inchangé après la décision)

### Actions réalisées

1. Désactivation de l''option "Verrouillage automatique" pour tous les utilisateurs (26 personnes)
2. Déverrouillage en masse de 102 bons de commande actifs sans tag "Facturé/fermé"
3. Conservation intacte des 298 dossiers clôturés selon ADR-011

**Ce qui change concrètement :**
- Nouveau dossier confirmé → pas de verrou automatique
- Lignes de frais modifiables directement à la facturation
- La clôture propre reste sous contrôle exclusif via ADR-011

**Bonne pratique (ADR-017)** : le verrouillage reste un outil de clôture définitive, pas un mécanisme de confirmation. Un dossier se verrouille manuellement quand la mission est terminée, facturée et payée — pas automatiquement à la confirmation.

---

## Phase 4 — Correction des projets Révision non liés (20/05/2026)

### Cas traités

| Projet | Client | Action |
|---|---|---|
| S00933 CENTRE D''ORIENTATION | Audit légal/contractuel, 76h | Recoudi vers la bonne ligne SO |
| S00012 Bonnievale | SO annulé, 1h seulement | Archivé |
| S00695 F91 Diddeléng | Forfait assumé, 144h | Note documentée dans le journal, conservé |

**Décision sur S00695 :** mission conduite en forfait fixe (17 500€), timesheets informatifs uniquement, pas de dépassement à négocier. Le projet reste orphelin intentionnellement — il est exclu des alertes automatiques.

---

## Phase 5 — Nettoyage des 185 orphelins Fiduciaire (21/05/2026)

### Définition d''un projet orphelin

Un projet orphelin est un projet dont le nom contient une référence à un dossier commercial (ex. "S00125 - Comptes Annuels") mais qui n''est pas techniquement relié à ce dossier dans le système. Ces projets sont **invisibles dans le dashboard de rentabilité.**

### Cartographie initiale

| Catégorie | Volume |
|---|---|
| Dossier commercial inexistant | 4 |
| Dossier annulé · 0h travaillées | 5 |
| Dossier annulé · avec heures | 18 |
| Dossier actif · 0h travaillées | 23 |
| Dossier actif · avec heures | 137 |
| **Total** | **187** |

### Actions par catégorie

---

#### Archivages directs — projets vides (6 projets)

S00689, S01041, S00438, S00900, S00290 Fiches salaires, S00462 Fiches salaires

**Cause :** créés automatiquement par Odoo à la confirmation du dossier, mais aucune heure n''y a jamais été enregistrée. Le dossier étant annulé ou inexistant, ces projets n''ont plus de raison d''être.

**Bonne pratique :** quand un dossier commercial est annulé, vérifier si un projet lui est associé. Si 0h → archiver immédiatement (PRO-606 §4).

---

#### Résiliations clients — perte sèche (4 projets)

| Projet | Client | Heures non facturées |
|---|---|---|
| S00146 - Comptes Annuels | LUXHOSTING NETWORKS | 12h |
| S00156 - Comptes Annuels | XEDOC HOLDING | 20h |
| S00157 - Comptes Annuels | Y Real Estate | 4h |
| S00158 - Comptes Annuels | ZONAT | 3h |

Ces 4 sociétés appartiennent au même groupe. La relation commerciale a été résiliée par GSL (clients ne répondant pas aux demandes). **39h de travail prestées non facturées — décision assumée par la direction.** Les heures restent en base de données mais le projet n''apparaît plus dans les listes actives.

**Bonne pratique :** documenter la décision de résiliation dans le journal du projet avant d''archiver.

---

#### Dossiers mal clôturés — Pattern 1 (4 SO remis en ordre)

Missions terminées et **intégralement payées** dont le dossier avait été annulé au lieu d''être clôturé proprement.

| Dossier | Client |
|---|---|
| S00140 | Hôtel ACACIA (6 factures, toutes payées) |
| S00906 | TASLE |
| S00837 | Bück Roland |
| S00983 | Klein Mireille |

**Cause :** les collaborateurs ont annulé ces dossiers après la facturation complète au lieu d''appliquer la procédure de clôture.

**Ce qu''on a fait :** réactivé les dossiers, puis appliqué la clôture propre ADR-011 (verrouillage + tag "Facturé/fermé").

> ❌ **Ne jamais annuler un dossier parce que la mission est terminée.**  
> ✅ **Mission terminée + facturée + payée → Verrouiller + tag "Facturé/fermé" (ADR-011)**  
> ✅ **Mission abandonnée commercialement → Annuler le dossier (vérifier le projet d''abord)**

---

#### Dossiers mal clôturés — Pattern 2 (9 SO remis en ordre)

Missions terminées, **facturées mais paiement en attente.**

| Dossier | Client | Montant facturé |
|---|---|---|
| S00125 | GABBANAELCOM | 3 829€ |
| S00909 | MATTE Jean-Christophe | 2 052€ |
| S00290 | Arbre à Pain | 2 567€ |
| S00143 | KARLINN | 1 700€ |
| S00238 | GIUSTINIANI | 1 400€ |
| S00267 | GEISEN Françoise | 542€ |
| S01004 | Goedert Héritiers Esch | 171€ |
| S01022 | Goedert Héritiers Pétange | 171€ |
| S01023 | Jacqueline BREYER | 133€ |

Note : les factures ouvertes (clients n''ayant pas encore payé) n''ont aucun lien avec le problème Odoo. Les clients paieront normalement — c''est le cycle commercial habituel. Ces dossiers ont été remis en ordre (réactivés + verrouillés + tag "Facturé/fermé").

---

#### Fiches de salaires Julien Gourdeau — pollution 0h (14 projets archivés)

S00223, S00291, S00301, S00305, S00313, S00316, S00328, S00340, S00341, S00347, S00350, S00354, S00360, S00744

**Cause :** ces projets "Fiches de salaires" ont été créés automatiquement par Odoo à chaque confirmation de dossier payroll. Julien gère les fiches sans utiliser les feuilles de temps projet — 0h réelles dans tous ces projets. Les quelques "entrées" détectées étaient des lignes à 0.00h générées lors de la facturation (anomalie connue, corrigée dans le module gsl_custom pour les nouveaux enregistrements).

---

#### Doublons et cas divers — 9 projets archivés ou recoudus

| Projet | Situation | Action |
|---|---|---|
| S00219 doublon [686] | 0.2h Laure Andreolla sur mauvais projet | Timesheet migré vers [687], [686] archivé |
| S00213 doublon [390] | Doublon vide, 0h | Archivé |
| S00213 Compta [389] | 60h orphelines, SO actif | Recoudi vers ligne 2331 |
| S00104 doublon [227] | Doublon vide, 0h | Archivé |
| S00104 Evaluation [206] | 33h, SO actif | Recoudi vers ligne 685 |
| S00676 AML/LFT | Forfait frais, 0h | Archivé |
| S00114 CA + TdC | 2 missions légitimes | Recoudus (lines 741 + 739) |
| S01044 CA + TdC | 2 missions légitimes | Recoudus (lines 8374 + 8371) |
| S00335 KOCH Charlotte | 1h Weiss Katia sur SO inexistant | Timesheet migré vers S00298, [579] archivé |

---

#### Cas particuliers conservés intentionnellement

**S00216 — Comptabilité interne GSL Fiduciaire (50h Laure Andreolla)**  
Pas de dossier commercial car non facturable — projet interne légitime. Laure retrouve son projet normalement. À configurer dans le chantier "Internal GSL".

**S00526 — VALENTE Sylvie (réserve heures)**  
32h timesheetées par Zubaïr Hakimi (jan-fév 2026) non liées à des factures, conservées intentionnellement par Isabelle Perbal pour réintégration sur factures ultérieures. Dossier très serré en budget. Note documentée dans le journal du projet. À revoir avec Isabelle Perbal lors de l''audit facturation.

---

### Bilan chiffré Phase 5

| Action | Volume |
|---|---|
| Archivés | 29 |
| Dossiers réactivés + clôturés ADR-011 | 13 SO |
| Projets recoudus | 10 |
| Timesheets migrés | 2 |
| Conservés intentionnellement | 2 |
| **Total traités** | **~52** |
| **Restant** | **137** (dossiers actifs avec heures — chantier relink) |

---

## Bilan global du chantier (09-21/05/2026)

| Chantier | Volume | Statut |
|---|---|---|
| Projets mal-routés corrigés | 144 | ✅ Terminé |
| Budgets 1h corrigés | ~30 SO | ✅ Terminé |
| Verrou automatique désactivé | 102 SO déverrouillés | ✅ Terminé |
| Révision orphelins | 3 projets | ✅ Terminé |
| Fiduciaire orphelins Phase 1 | 52 projets | ✅ Terminé |
| **Fiduciaire orphelins Phase 2** | **137 projets** | 🔧 En cours |

---

## Causes racines identifiées

| Cause | Fréquence | Correction |
|---|---|---|
| Dossier annulé au lieu de clôturé (mission terminée) | **Très fréquent** | Formation + ADR-011 |
| Budget non renseigné à la création (1h placeholder) | **Fréquent** | Règle + formation |
| Projet créé sans lien SO (historique pré-Odoo) | Fréquent | Chantier relink en cours |
| Doublon créé par "Ajouter projet au dossier" | Occasionnel | Patch ITC semaine 22 |
| Projet forfait sans suivi heures (AML, fiches salaires) | Structurel | Revoir configuration produits |
| Modifications techniques sans traçabilité | Historique | Tracking activé (ADR-016) |

---

## Recommandations

### Immédiat
1. **Règle de clôture** : quand une mission est terminée et facturée, on verrouille le dossier avec le tag "Facturé/fermé" — on ne l''annule pas.
2. **Règle de budget** : le créateur du dossier renseigne un budget réel à la confirmation. Un budget à 1h n''est pas un budget.
3. **Surveiller le cron orphelins** chaque lundi — la liste doit diminuer semaine après semaine.

### Moyen terme
4. **Chantier relink 137 projets** avec dossiers actifs et heures réelles.
5. **Configurer S00216** comme projet interne (chantier Internal GSL).
6. **Patch wizard "Ajouter projet au dossier"** (ITC, semaine 22) — cause principale des doublons.

### Long terme
7. **Revoir la configuration des produits** "Fiches de salaires" et "AML/LFT" — si ces missions ne nécessitent pas de suivi d''heures, éviter la création automatique de projets inutiles.
8. **Intégrer ces vérifications dans gsl_integrity_checks** pour une détection automatique proactive.

---

## Références documentaires

| Document | Description |
|---|---|
| ADR-011 | Convention clôture dossiers (annuler vs verrouiller) |
| ADR-016 | Tracking du lien projet-dossier commercial |
| ADR-017 | Désactivation du verrou automatique |
| PRO-606 v2.0 | Workflow dossier + projet + tâches (cycle complet) |

Accès : apps.gsl.lu → Décisions / Procédures

---

*Rapport rédigé le 21/05/2026 — Luc Schmitt / GSL Group*  
*Prochaine étape : relink des 137 projets orphelins avec dossier actif et heures réelles*
',
  pc.id,
  'published',
  'managers',
  20,
  NOW(),
  NOW()
FROM procedure_categories pc
WHERE pc.slug = 'odoo-donnees'
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- Executed: 21/05/2026
