-- Sprint documentation 21/05/2026
-- Rapport de nettoyage donnÃ©es Odoo GSL â€” intÃ©gration dans Formations

-- CrÃ©er la catÃ©gorie si elle n'existe pas
INSERT INTO procedure_categories (slug, name, description, icon, color, sort_order, created_at, updated_at)
VALUES (
  'odoo-donnees',
  'DonnÃ©es & qualitÃ© Odoo',
  'Rapports de nettoyage, audits de donnÃ©es et bonnes pratiques Odoo',
  'database',
  '#5BAFD6',
  30,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- InsÃ©rer la formation/rapport
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
  'Rapport de nettoyage â€” Fiabilisation des donnÃ©es Odoo (mai 2026)',
  'Rapport complet du chantier de fiabilisation des donnÃ©es Odoo menÃ© en mai 2026 : 144 projets mal-routÃ©s, budgets incorrects, verrou automatique, orphelins Fiduciaire. Causes racines identifiÃ©es et bonnes pratiques Ã  retenir.',
  '# Rapport de nettoyage â€” Fiabilisation des donnÃ©es Odoo GSL
**PÃ©riode couverte** : 09/05/2026 â†’ 21/05/2026  
**RÃ©alisÃ© par** : Luc Schmitt  
**PÃ©rimÃ¨tre** : GSL Fiduciaire Â· GSL RÃ©vision Â· GSL Management  
**RÃ©fÃ©rences** : ADR-011 Â· ADR-016 Â· ADR-017 Â· PRO-606 v2.0

---

## Contexte gÃ©nÃ©ral

Depuis fin avril 2026, GSL Group a engagÃ© un chantier de fiabilisation complet de ses donnÃ©es Odoo 18. Ce travail fait suite Ã  la dÃ©tection d''anomalies dans le dashboard de rentabilitÃ© â€” des heures timesheetÃ©es et des revenus qui n''apparaissaient pas ou Ã©taient attribuÃ©s aux mauvais clients.

Ce rapport documente l''ensemble des actions rÃ©alisÃ©es, leurs causes et les bonnes pratiques qui en dÃ©coulent.

---

## Phase 1 â€” Investigation et correction des 144 projets mal-routÃ©s (09-20/05/2026)

### Le problÃ¨me dÃ©couvert

Un audit a rÃ©vÃ©lÃ© que **144 projets actifs** (sur ~400) Ã©taient liÃ©s au mauvais bon de commande dans le systÃ¨me. ConcrÃ¨tement : un projet nommÃ© "S00125 - Comptes Annuels CLIENT A" pointait vers le bon de commande de CLIENT B. Les heures et les revenus Ã©taient donc comptabilisÃ©s sur le mauvais client.

**Impact mesurÃ© :**
- 622,25 heures mal attribuÃ©es dans le dashboard
- 112 clients affectÃ©s
- 50 projets avec des factures Ã©mises sur le mauvais dossier commercial

### Pourquoi ce n''est pas visible sans outil ?

Le champ technique qui relie un projet Ã  son bon de commande n''Ã©tait pas suivi dans Odoo. Aucune trace n''Ã©tait laissÃ©e quand il Ã©tait modifiÃ© â€” ni qui l''avait changÃ©, ni quand, ni quelle Ã©tait l''ancienne valeur.

### Investigation sur les causes

5 tests ont Ã©tÃ© menÃ©s sur l''environnement de test (staging) avec annulation systÃ©matique aprÃ¨s chaque test. RÃ©sultat : **aucune action utilisateur normale ne reproduit ce problÃ¨me.** Les workflows d''Isabelle Perbal ont Ã©tÃ© testÃ©s en direct et validÃ©s propres â€” elle a Ã©tÃ© formellement innocentÃ©e.

**Conclusion :** les modifications provenaient d''opÃ©rations techniques directes rÃ©alisÃ©es entre 2024 et 2026 lors de migrations et corrections de donnÃ©es, sans traÃ§abilitÃ©.

### Corrections rÃ©alisÃ©es

| MÃ©thode | Volume |
|---|---|
| Script automatique (correspondance nomâ†’SO) | 137 projets |
| Corrections manuelles cas par cas | 5 projets |
| Archivage (SO inexistant â€” S00089, S00123) | 2 projets |
| **Total corrigÃ©** | **144 projets** |

**DÃ©cision ADR-016** : activation du suivi sur le lien projet-bon de commande. Tout futur changement est dÃ©sormais tracÃ© dans le journal du projet : qui a changÃ© quoi, quand, et quelle Ã©tait l''ancienne valeur.

**Bonne pratique :** toute modification technique du lien projet-dossier commercial passe dÃ©sormais par un script versionnÃ© dans le dÃ©pÃ´t Git, avec une phase de test prÃ©alable.

---

## Phase 2 â€” Correction des budgets Ã  1h "placeholder" (19/05/2026)

### Le problÃ¨me

Le rapport hebdomadaire du mardi matin a mis en Ã©vidence des dizaines de missions en "dÃ©passement" Ã  plus de 1000%. En creusant, il s''est avÃ©rÃ© que ces dossiers avaient Ã©tÃ© crÃ©Ã©s avec un budget de **1 heure** â€” non pas comme estimation rÃ©elle, mais simplement parce qu''aucun budget n''avait Ã©tÃ© renseignÃ© Ã  la crÃ©ation.

Le systÃ¨me affichait donc un dÃ©passement dÃ¨s la premiÃ¨re heure travaillÃ©e, ce qui n''Ã©tait pas un vrai dÃ©passement mais une donnÃ©e manquante.

### Actions rÃ©alisÃ©es

Un mail a Ã©tÃ© envoyÃ© le 19/05/2026 Ã  Isabelle Perbal, Viviane Poirier et Isabelle Sinibaldi avec la liste des ~30 dossiers concernÃ©s. Toutes ont corrigÃ© les budgets avant le 22/05/2026 â€” avec une exception :

**S00108 ALLTRA** : Isabelle Perbal ne pouvait pas modifier le prix unitaire (bloquÃ© par Odoo sur un dossier confirmÃ©). Elle a contournÃ© en mettant qty=3 Ã— 2000â‚¬ â‰ˆ 6000â‚¬. Ã€ corriger proprement lors d''une prochaine session (montant forfaitaire exact Ã  confirmer avec Isabelle Sinibaldi).

**DÃ©cision mÃ©tier validÃ©e** : l''Ã©tablissement des comptes annuels est en forfait par dÃ©faut chez GSL Fiduciaire. Le budget doit reflÃ©ter le montant forfaitaire estimÃ©, pas les heures.

**Bonne pratique :** la personne qui confirme un dossier commercial est responsable de renseigner un budget rÃ©el dÃ¨s la confirmation. Un budget Ã  1h n''est pas un budget â€” c''est une donnÃ©e manquante.

---

## Phase 3 â€” DÃ©sactivation du verrou automatique des dossiers (19/05/2026)

### Le problÃ¨me

Odoo Ã©tait configurÃ© pour verrouiller automatiquement tout bon de commande dÃ¨s sa confirmation. Cette option crÃ©ait une friction importante au quotidien : pour mettre Ã  jour les quantitÃ©s livrÃ©es sur les lignes de frais (frais IRE & CSSF, frais AML/KYC, frais de bureau), il fallait dÃ©verrouiller manuellement le dossier Ã  chaque facturation.

### Investigation prÃ©alable

Avant toute action, vÃ©rification systÃ©matique des dÃ©pendances :
- Actions automatiques sur les bons de commande â†’ 0 dÃ©tectÃ©
- Actions serveur mentionnant le verrouillage â†’ 0 dÃ©tectÃ©
- RÃ¨gles d''enregistrement â†’ 0 bloquer
- Crons GSL â†’ 2 crons utilisent le verrou pour **exclure** les missions terminÃ©es (comportement inchangÃ© aprÃ¨s la dÃ©cision)

### Actions rÃ©alisÃ©es

1. DÃ©sactivation de l''option "Verrouillage automatique" pour tous les utilisateurs (26 personnes)
2. DÃ©verrouillage en masse de 102 bons de commande actifs sans tag "FacturÃ©/fermÃ©"
3. Conservation intacte des 298 dossiers clÃ´turÃ©s selon ADR-011

**Ce qui change concrÃ¨tement :**
- Nouveau dossier confirmÃ© â†’ pas de verrou automatique
- Lignes de frais modifiables directement Ã  la facturation
- La clÃ´ture propre reste sous contrÃ´le exclusif via ADR-011

**Bonne pratique (ADR-017)** : le verrouillage reste un outil de clÃ´ture dÃ©finitive, pas un mÃ©canisme de confirmation. Un dossier se verrouille manuellement quand la mission est terminÃ©e, facturÃ©e et payÃ©e â€” pas automatiquement Ã  la confirmation.

---

## Phase 4 â€” Correction des projets RÃ©vision non liÃ©s (20/05/2026)

### Cas traitÃ©s

| Projet | Client | Action |
|---|---|---|
| S00933 CENTRE D''ORIENTATION | Audit lÃ©gal/contractuel, 76h | Recoudi vers la bonne ligne SO |
| S00012 Bonnievale | SO annulÃ©, 1h seulement | ArchivÃ© |
| S00695 F91 DiddelÃ©ng | Forfait assumÃ©, 144h | Note documentÃ©e dans le journal, conservÃ© |

**DÃ©cision sur S00695 :** mission conduite en forfait fixe (17 500â‚¬), timesheets informatifs uniquement, pas de dÃ©passement Ã  nÃ©gocier. Le projet reste orphelin intentionnellement â€” il est exclu des alertes automatiques.

---

## Phase 5 â€” Nettoyage des 185 orphelins Fiduciaire (21/05/2026)

### DÃ©finition d''un projet orphelin

Un projet orphelin est un projet dont le nom contient une rÃ©fÃ©rence Ã  un dossier commercial (ex. "S00125 - Comptes Annuels") mais qui n''est pas techniquement reliÃ© Ã  ce dossier dans le systÃ¨me. Ces projets sont **invisibles dans le dashboard de rentabilitÃ©.**

### Cartographie initiale

| CatÃ©gorie | Volume |
|---|---|
| Dossier commercial inexistant | 4 |
| Dossier annulÃ© Â· 0h travaillÃ©es | 5 |
| Dossier annulÃ© Â· avec heures | 18 |
| Dossier actif Â· 0h travaillÃ©es | 23 |
| Dossier actif Â· avec heures | 137 |
| **Total** | **187** |

### Actions par catÃ©gorie

---

#### Archivages directs â€” projets vides (6 projets)

S00689, S01041, S00438, S00900, S00290 Fiches salaires, S00462 Fiches salaires

**Cause :** crÃ©Ã©s automatiquement par Odoo Ã  la confirmation du dossier, mais aucune heure n''y a jamais Ã©tÃ© enregistrÃ©e. Le dossier Ã©tant annulÃ© ou inexistant, ces projets n''ont plus de raison d''Ãªtre.

**Bonne pratique :** quand un dossier commercial est annulÃ©, vÃ©rifier si un projet lui est associÃ©. Si 0h â†’ archiver immÃ©diatement (PRO-606 Â§4).

---

#### RÃ©siliations clients â€” perte sÃ¨che (4 projets)

| Projet | Client | Heures non facturÃ©es |
|---|---|---|
| S00146 - Comptes Annuels | LUXHOSTING NETWORKS | 12h |
| S00156 - Comptes Annuels | XEDOC HOLDING | 20h |
| S00157 - Comptes Annuels | Y Real Estate | 4h |
| S00158 - Comptes Annuels | ZONAT | 3h |

Ces 4 sociÃ©tÃ©s appartiennent au mÃªme groupe. La relation commerciale a Ã©tÃ© rÃ©siliÃ©e par GSL (clients ne rÃ©pondant pas aux demandes). **39h de travail prestÃ©es non facturÃ©es â€” dÃ©cision assumÃ©e par la direction.** Les heures restent en base de donnÃ©es mais le projet n''apparaÃ®t plus dans les listes actives.

**Bonne pratique :** documenter la dÃ©cision de rÃ©siliation dans le journal du projet avant d''archiver.

---

#### Dossiers mal clÃ´turÃ©s â€” Pattern 1 (4 SO remis en ordre)

Missions terminÃ©es et **intÃ©gralement payÃ©es** dont le dossier avait Ã©tÃ© annulÃ© au lieu d''Ãªtre clÃ´turÃ© proprement.

| Dossier | Client |
|---|---|
| S00140 | HÃ´tel ACACIA (6 factures, toutes payÃ©es) |
| S00906 | TASLE |
| S00837 | BÃ¼ck Roland |
| S00983 | Klein Mireille |

**Cause :** les collaborateurs ont annulÃ© ces dossiers aprÃ¨s la facturation complÃ¨te au lieu d''appliquer la procÃ©dure de clÃ´ture.

**Ce qu''on a fait :** rÃ©activÃ© les dossiers, puis appliquÃ© la clÃ´ture propre ADR-011 (verrouillage + tag "FacturÃ©/fermÃ©").

> âŒ **Ne jamais annuler un dossier parce que la mission est terminÃ©e.**  
> âœ… **Mission terminÃ©e + facturÃ©e + payÃ©e â†’ Verrouiller + tag "FacturÃ©/fermÃ©" (ADR-011)**  
> âœ… **Mission abandonnÃ©e commercialement â†’ Annuler le dossier (vÃ©rifier le projet d''abord)**

---

#### Dossiers mal clÃ´turÃ©s â€” Pattern 2 (9 SO remis en ordre)

Missions terminÃ©es, **facturÃ©es mais paiement en attente.**

| Dossier | Client | Montant facturÃ© |
|---|---|---|
| S00125 | GABBANAELCOM | 3 829â‚¬ |
| S00909 | MATTE Jean-Christophe | 2 052â‚¬ |
| S00290 | Arbre Ã  Pain | 2 567â‚¬ |
| S00143 | KARLINN | 1 700â‚¬ |
| S00238 | GIUSTINIANI | 1 400â‚¬ |
| S00267 | GEISEN FranÃ§oise | 542â‚¬ |
| S01004 | Goedert HÃ©ritiers Esch | 171â‚¬ |
| S01022 | Goedert HÃ©ritiers PÃ©tange | 171â‚¬ |
| S01023 | Jacqueline BREYER | 133â‚¬ |

Note : les factures ouvertes (clients n''ayant pas encore payÃ©) n''ont aucun lien avec le problÃ¨me Odoo. Les clients paieront normalement â€” c''est le cycle commercial habituel. Ces dossiers ont Ã©tÃ© remis en ordre (rÃ©activÃ©s + verrouillÃ©s + tag "FacturÃ©/fermÃ©").

---

#### Fiches de salaires Julien Gourdeau â€” pollution 0h (14 projets archivÃ©s)

S00223, S00291, S00301, S00305, S00313, S00316, S00328, S00340, S00341, S00347, S00350, S00354, S00360, S00744

**Cause :** ces projets "Fiches de salaires" ont Ã©tÃ© crÃ©Ã©s automatiquement par Odoo Ã  chaque confirmation de dossier payroll. Julien gÃ¨re les fiches sans utiliser les feuilles de temps projet â€” 0h rÃ©elles dans tous ces projets. Les quelques "entrÃ©es" dÃ©tectÃ©es Ã©taient des lignes Ã  0.00h gÃ©nÃ©rÃ©es lors de la facturation (anomalie connue, corrigÃ©e dans le module gsl_custom pour les nouveaux enregistrements).

---

#### Doublons et cas divers â€” 9 projets archivÃ©s ou recoudus

| Projet | Situation | Action |
|---|---|---|
| S00219 doublon [686] | 0.2h Laure Andreolla sur mauvais projet | Timesheet migrÃ© vers [687], [686] archivÃ© |
| S00213 doublon [390] | Doublon vide, 0h | ArchivÃ© |
| S00213 Compta [389] | 60h orphelines, SO actif | Recoudi vers ligne 2331 |
| S00104 doublon [227] | Doublon vide, 0h | ArchivÃ© |
| S00104 Evaluation [206] | 33h, SO actif | Recoudi vers ligne 685 |
| S00676 AML/LFT | Forfait frais, 0h | ArchivÃ© |
| S00114 CA + TdC | 2 missions lÃ©gitimes | Recoudus (lines 741 + 739) |
| S01044 CA + TdC | 2 missions lÃ©gitimes | Recoudus (lines 8374 + 8371) |
| S00335 KOCH Charlotte | 1h Weiss Katia sur SO inexistant | Timesheet migrÃ© vers S00298, [579] archivÃ© |

---

#### Cas particuliers conservÃ©s intentionnellement

**S00216 â€” ComptabilitÃ© interne GSL Fiduciaire (50h Laure Andreolla)**  
Pas de dossier commercial car non facturable â€” projet interne lÃ©gitime. Laure retrouve son projet normalement. Ã€ configurer dans le chantier "Internal GSL".

**S00526 â€” VALENTE Sylvie (rÃ©serve heures)**  
32h timesheetÃ©es par ZubaÃ¯r Hakimi (jan-fÃ©v 2026) non liÃ©es Ã  des factures, conservÃ©es intentionnellement par Isabelle Perbal pour rÃ©intÃ©gration sur factures ultÃ©rieures. Dossier trÃ¨s serrÃ© en budget. Note documentÃ©e dans le journal du projet. Ã€ revoir avec Isabelle Perbal lors de l''audit facturation.

---

### Bilan chiffrÃ© Phase 5

| Action | Volume |
|---|---|
| ArchivÃ©s | 29 |
| Dossiers rÃ©activÃ©s + clÃ´turÃ©s ADR-011 | 13 SO |
| Projets recoudus | 10 |
| Timesheets migrÃ©s | 2 |
| ConservÃ©s intentionnellement | 2 |
| **Total traitÃ©s** | **~52** |
| **Restant** | **137** (dossiers actifs avec heures â€” chantier relink) |

---

## Bilan global du chantier (09-21/05/2026)

| Chantier | Volume | Statut |
|---|---|---|
| Projets mal-routÃ©s corrigÃ©s | 144 | âœ… TerminÃ© |
| Budgets 1h corrigÃ©s | ~30 SO | âœ… TerminÃ© |
| Verrou automatique dÃ©sactivÃ© | 102 SO dÃ©verrouillÃ©s | âœ… TerminÃ© |
| RÃ©vision orphelins | 3 projets | âœ… TerminÃ© |
| Fiduciaire orphelins Phase 1 | 52 projets | âœ… TerminÃ© |
| **Fiduciaire orphelins Phase 2** | **137 projets** | ðŸ”§ En cours |

---

## Causes racines identifiÃ©es

| Cause | FrÃ©quence | Correction |
|---|---|---|
| Dossier annulÃ© au lieu de clÃ´turÃ© (mission terminÃ©e) | **TrÃ¨s frÃ©quent** | Formation + ADR-011 |
| Budget non renseignÃ© Ã  la crÃ©ation (1h placeholder) | **FrÃ©quent** | RÃ¨gle + formation |
| Projet crÃ©Ã© sans lien SO (historique prÃ©-Odoo) | FrÃ©quent | Chantier relink en cours |
| Doublon crÃ©Ã© par "Ajouter projet au dossier" | Occasionnel | Patch ITC semaine 22 |
| Projet forfait sans suivi heures (AML, fiches salaires) | Structurel | Revoir configuration produits |
| Modifications techniques sans traÃ§abilitÃ© | Historique | Tracking activÃ© (ADR-016) |

---

## Recommandations

### ImmÃ©diat
1. **RÃ¨gle de clÃ´ture** : quand une mission est terminÃ©e et facturÃ©e, on verrouille le dossier avec le tag "FacturÃ©/fermÃ©" â€” on ne l''annule pas.
2. **RÃ¨gle de budget** : le crÃ©ateur du dossier renseigne un budget rÃ©el Ã  la confirmation. Un budget Ã  1h n''est pas un budget.
3. **Surveiller le cron orphelins** chaque lundi â€” la liste doit diminuer semaine aprÃ¨s semaine.

### Moyen terme
4. **Chantier relink 137 projets** avec dossiers actifs et heures rÃ©elles.
5. **Configurer S00216** comme projet interne (chantier Internal GSL).
6. **Patch wizard "Ajouter projet au dossier"** (ITC, semaine 22) â€” cause principale des doublons.

### Long terme
7. **Revoir la configuration des produits** "Fiches de salaires" et "AML/LFT" â€” si ces missions ne nÃ©cessitent pas de suivi d''heures, Ã©viter la crÃ©ation automatique de projets inutiles.
8. **IntÃ©grer ces vÃ©rifications dans gsl_integrity_checks** pour une dÃ©tection automatique proactive.

---

## RÃ©fÃ©rences documentaires

| Document | Description |
|---|---|
| ADR-011 | Convention clÃ´ture dossiers (annuler vs verrouiller) |
| ADR-016 | Tracking du lien projet-dossier commercial |
| ADR-017 | DÃ©sactivation du verrou automatique |
| PRO-606 v2.0 | Workflow dossier + projet + tÃ¢ches (cycle complet) |

AccÃ¨s : apps.gsl.lu â†’ DÃ©cisions / ProcÃ©dures

---

*Rapport rÃ©digÃ© le 21/05/2026 â€” Luc Schmitt / GSL Group*  
*Prochaine Ã©tape : relink des 137 projets orphelins avec dossier actif et heures rÃ©elles*
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

-- Retry: 21/05/2026 v2

