-- ============================================================
-- Sprint publication 26/05/2026 — Partie 2, Étape 6
-- Import des 4 ADR (ADR-011, ADR-013, ADR-014, ADR-015).
-- Idempotent : ON CONFLICT (number) DO UPDATE.
-- summary = résumé exécutif généré (paraphrase, non verbatim).
-- ============================================================

-- ADR-011
INSERT INTO public.decisions (number, slug, title, status, summary, content)
VALUES (
  'ADR-011', 'so-closure-convention',
  'Convention de clôture des bons de commande', 'Accepté',
  $sum$Odoo 18 avait initialement été déployé avec une convention de contournement consistant à passer les bons de commande terminés à l'état « annulé », faute de bouton Verrouiller fonctionnel. Cette pratique brouillait la lecture comptable et créait des divergences entre entités. La décision retient désormais une convention unique : l'état « verrouillé » pour les missions livrées, facturées et payées, et « annulé » réservé aux véritables annulations commerciales. Une étiquette « Facturé/fermé » complète le marquage ; environ 370 bons de commande ont été migrés.$sum$,
  $md$> 🟢 **Statut** : Accepté | **Date** : 09/05/2026 | **Décideur** : Luc Schmitt

# ADR-011 — Convention de clôture des bons de commande

| Statut        | 🟢 Accepted |
|---------------|-------------|
| Date          | 2026-05-09 |
| Décideur      | Luc Schmitt (Dirigeant GSL Group) |
| Stakeholders  | Non documenté à l'origine — à compléter si pertinent |
| Périmètre     | GSL Fiduciaire + GSL Révision |
| Successeur de | ADR-010 (workflow Git ITC) |

---

## Contexte

Lors du déploiement initial d'Odoo 18 en 2025, IT Consultancy avait conseillé d'utiliser l'état **`cancel`** (annulé) pour clôturer les bons de commande terminés et facturés. Ce conseil découlait d'un blocage temporaire du bouton "Verrouiller" dans l'UI Odoo, qui rendait inutilisable la fonction native de verrouillage des SO.

Cette convention de contournement a entraîné plusieurs problèmes :

1. **Confusion sémantique** : `cancel` désigne dans Odoo une vraie annulation commerciale (mission perdue, client parti, erreur de création). L'utiliser pour clôturer des missions livrées et facturées brouille la lecture historique des données.
2. **Incohérence avec les rapports** : les SO en `cancel` apparaissent dans les vues d'annulations alors qu'ils correspondent à des missions exécutées avec succès.
3. **Risque comptable apparent** : un SO `cancel` avec des factures `paid` rattachées suggère une anomalie (annulé mais facturé) alors que la réalité est l'inverse.
4. **Hétérogénéité** : la migration partielle réalisée sur GSL Révision en avril 2026 a créé deux conventions coexistantes selon l'entité.

Le bouton "Verrouiller" est de nouveau accessible dans Odoo 18, et la méthode `action_lock()` fonctionne correctement en shell (testé et validé sur 55 SO en staging puis 290 SO en production le 09/05/2026).

## Décision

**À compter du 09/05/2026, la convention unique pour clôturer un SO Fidu ou Révision est :**

| État final | Quand l'utiliser |
|------------|------------------|
| **`locked`** (state=`sale` + `locked=True`) | SO terminé d'un point de vue opérationnel : prestations livrées, facture(s) émise(s) **et payée(s)**, mission close |
| **`cancel`** | SO réellement annulé : mission perdue, client parti, erreur de création, devis refusé, etc. |

En complément du verrouillage, l'étiquette **"Facturé/fermé"** (`crm.tag` id=87 en prod) est appliquée pour faciliter le filtrage dans les vues.

### Critères techniques d'éligibilité au verrouillage

Un SO est éligible au verrouillage si **toutes** les conditions sont réunies :

- `state = 'sale'` (ou `cancel` à migrer)
- `invoice_status = 'invoiced'` (entièrement facturé)
- Toutes les factures liées (`account_move.invoice_origin = sale_order.name`) ont :
  - `state = 'posted'`
  - `payment_state = 'paid'`

### Séquence Odoo 18

```python
so.action_draft()       # cancel → draft
so.action_confirm()     # draft → sale
so.write({'locked': True})
so.tag_ids = [(4, 87)]  # tag "Facturé/fermé"
```

## Options évaluées

1. **Maintenir `cancel` pour Fidu** : écarté — perpétue l'incohérence et le risque de mauvaise lecture comptable.
2. **Créer un nouvel état custom (`closed`)** : écarté — modifie le modèle natif `sale.order`, fragilise les mises à jour Odoo, complexifie les rapports.
3. **Archiver les SO terminés** (`active=False`) : écarté — masque les SO dans toutes les vues, casse les liens analytiques avec les timesheets historiques.
4. **Ne rien faire** : écarté — la dette s'accumule, la confusion s'installe durablement.

## Conséquences

### Positives

- **Sémantique claire** : `cancel` = annulation, `locked` = clôture.
- **Cohérence Fidu/Révision** : convention unique, plus de divergence par entité.
- **Dashboard fiabilisé** : les vues "SO actifs" et "SO annulés" reflètent la réalité métier.
- **Auditabilité** : le chatter Odoo trace explicitement le verrouillage (`Non → Oui (Verrouillé)`).
- **Réversibilité** : un SO `locked` reste modifiable via "Débloquer" en cas de besoin légitime (avoir, refacturation).

### Neutres

- **Migration historique réalisée** :
  - Révision : ~80 SO migrés en avril 2026
  - Fiduciaire : 290 SO migrés le 09/05/2026 (937 045€ HT)
  - Total : ~370 SO clôturés selon la nouvelle convention
- **Cas particuliers conservés en `cancel`** : SO à montant négatif (notes de crédit), SO sans facture, vrais SO annulés.

### Négatives / risques résiduels

- **Formation utilisateurs** : Isa P. (Fidu) et les managers Révision doivent intégrer la nouvelle pratique. Communication par mail le 09/05/2026.
- **Workaround historique** : les SO clôturés avant la migration et oubliés peuvent rester en `cancel` quelque temps. Cron de balayage à mettre en place (voir PRO-603 v2).

## Plan de mise en œuvre

### Risques techniques validés (09/05/2026)

| Risque | Vérification | Résultat |
|--------|--------------|----------|
| Email automatique à la confirmation | `base_automation` sur `sale.order` + paramètre `sale.automatic_invoice` | ✅ Aucune automation, paramètre `False` |
| PO miroir intercompany | `intercompany_generate_purchase_orders` sur les 4 entités | ✅ `False` partout |
| Override custom `_action_confirm` | Inspection MRO de la classe `sale.order` | ✅ Modules standards uniquement |
| Modification de prix/lignes | Comparaison `amount_untaxed` avant/après sur 290 SO | ✅ 0 différence |
| Date de commande écrasée | Test staging | ✅ `date_order` préservée |

### Implémentation

| Action | Date | Statut |
|--------|------|--------|
| Migration Révision (~80 SO) | Avril 2026 | ✅ Terminé |
| Test staging Fidu (55 SO) | 09/05/2026 matin | ✅ Validé |
| Migration Fidu prod (290 SO, 937 045€) | 09/05/2026 midi | ✅ Terminé |
| Communication Isa P. | 09/05/2026 | ✅ Mail envoyé |
| PRO-603 v2 | 09/05/2026 | ✅ Rédigée |
| Cron mensuel de balayage | À planifier | ⚪ Backlog |

## Documentation associée

- Procédure : [PRO-603 — Verrouillage des SO terminés](../procedures/PRO-603-so-verrouillage.md)
- Module : Odoo 18 Enterprise — `sale.order` natif
- Tag : `crm.tag` id=87 prod — "Facturé/fermé"$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, status = EXCLUDED.status,
  summary = EXCLUDED.summary, content = EXCLUDED.content, updated_at = now();

-- ADR-013
INSERT INTO public.decisions (number, slug, title, status, summary, content)
VALUES (
  'ADR-013', 'parametrage-listes-distribution-mails',
  'Paramétrage des listes de distribution pour les mails internes automatisés', 'Accepté',
  $sum$La liste des destinataires du récapitulatif budgétaire hebdomadaire (cron 84) était codée en dur dans le cron, rendant toute modification dépendante d'une intervention technique et non tracée. La décision externalise les listes de distribution dans des paramètres système Odoo (ir.config_parameter), suivant la convention de nommage gsl.budget_recap.<scope>_user_ids. Les destinataires se modifient ainsi en direct via l'interface Settings, sans toucher au code. Les options d'un champ utilisateur dédié ou d'un modèle dédié ont été reportées à un besoin futur.$sum$,
  $md$> 🟢 **Statut** : Accepté | **Date** : 17/05/2026 | **Décideur** : Luc Schmitt

# ADR-013 — Paramétrage des listes de distribution pour les mails internes automatisés

| Statut       | 🟢 Accepted                                          |
|--------------|------------------------------------------------------|
| Date         | 2026-05-17                                           |
| Décideur     | Luc Schmitt (Dirigeant GSL Group)                    |
| Stakeholders | Managers Fidu, Managers Révision, Direction GSL      |
| Périmètre    | GSL Fiduciaire + GSL Révision + GSL Management       |
| Successeur de| —                                                    |

---

## Contexte

Le cron `ir.cron(84)` "Récap budget missions — mardi matin" envoie chaque mardi à 7h un récapitulatif hebdomadaire de consommation des missions actives aux managers et à la Direction.

Jusqu'à la version v2 (12/05/2026), la liste des destinataires Fiduciaire + Management était hardcodée dans le code Python du cron :

```python
FIDU_USER_IDS = [120, 126, 119, 113, 122, 6]
```

Cette approche présente plusieurs limites observées en exploitation :

- Modifier la liste requiert une intervention technique (édition du cron via Settings → Technical → Scheduled Actions)
- Aucune traçabilité des changements (qui a modifié, quand, pourquoi)
- Risque d'oubli lors d'événements RH (départs, congés parentaux, retours)
- Couplage fort entre la logique métier (qui doit recevoir le mail) et la logique technique (comment l'envoyer)

Exemple concret rencontré le 17/05/2026 : Julie Iovalone (uid 119) est en congé parental jusqu'au 01/08/2026. Son compte est `active=False` mais elle continuait à recevoir les mails du cron via le contexte `with_context(active_test=False)`. Sa réintégration à son retour nécessitait une modification de code, fragile et non documentée.

Par ailleurs, le besoin de paramétrer plusieurs listes distinctes émerge :

- Liste Fiduciaire + Management (destinataires hebdomadaires standards)
- Liste Direction Révision (vue consolidée par manager, volumétrie compatible avec un mail)
- Futurs cas potentiels : alertes marges négatives, rappels trimestriels MAJ hourly_cost, rapports mensuels Direction

## Décision

Externaliser toutes les listes de distribution des mails internes automatisés dans des entrées `ir.config_parameter` Odoo, accessibles via Settings → Technical → System Parameters.

**Convention de nommage** : `gsl.budget_recap.<scope>_user_ids` où `<scope>` désigne le groupe destinataire.

**Format des valeurs** : liste d'IDs `res.users` séparés par virgules. Exemple : `120,126,113,122,6`.

**Création initiale au 17/05/2026** :

| Clé | Valeur initiale | Destinataires |
|-----|-----------------|---------------|
| `gsl.budget_recap.fidu_user_ids` | `120,126,113,122,6` | Perbal, Sinibaldi, Gourdeau, Poirier, Schmitt |
| `gsl.budget_recap.direction_revision_user_ids` | `6` | Schmitt |

Julie Iovalone (uid 119) est temporairement retirée de la liste Fidu pendant son congé parental, à réintégrer le 01/08/2026.

## Options évaluées

| Option | Description | Décision | Pour | Contre |
|--------|-------------|----------|------|--------|
| **A — `ir.config_parameter`** | Stockage clé-valeur natif Odoo | ✅ **Choisie** | Zéro développement, modification live via UI Settings, traçabilité automatique | UI Technical peu user-friendly, format CSV manuel, pas de validation des IDs |
| **B — Champ booléen sur `res.users`** | Cocher "Reçoit récap budget Fidu" sur la fiche utilisateur | Reportée | UX optimale, valide par construction | Nécessite PR Gonzalo, 1 champ par liste = lourd à scaler |
| **C — Modèle dédié `gsl.distribution.list`** | Nouveau modèle Odoo avec M2M users | Reportée | Multi-listes natif, extensible | Développement custom, complexité disproportionnée |

L'option A est retenue pour sa time-to-value immédiate (déployable le jour même) et son alignement avec les pratiques natives Odoo.

## Conséquences

**Positives**

- Modification des destinataires sans intervention sur le code du cron
- Traçabilité automatique des changements via les logs Odoo
- Pattern réutilisable pour d'autres mails automatisés
- Découplage propre entre logique métier et données de configuration

**Négatives**

- UI Settings → Technical → Parameters est austère pour un utilisateur non technique
- Format CSV imposé : un ID mal saisi génère une erreur silencieuse lors de l'exécution
- Pas de validation à la saisie (l'erreur n'apparaît qu'à la prochaine exécution du cron)

**Neutres**

- L'évolution vers l'option B ou C reste possible sans rupture (migration progressive)

## Métriques de succès

- **Adoption** : la liste Fidu a été modifiée au moins une fois via Settings → Technical → Parameters avant le 31/12/2026
- **Fiabilité** : 0 erreur d'exécution du cron 84 entre le 19/05/2026 et le 31/12/2026 liée au paramétrage
- **Extensibilité** : au moins une nouvelle liste de distribution créée via la même convention de nommage avant le 31/12/2026

## Documentation associée

- [PRO-604 — Récap budget hebdomadaire : exploitation, modification, désactivation](../procedures/PRO-604-cron-recap-budget.md)
- [ADR-011 — Convention de clôture des bons de commande](../decisions/ADR-011-so-closure-convention.md)$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, status = EXCLUDED.status,
  summary = EXCLUDED.summary, content = EXCLUDED.content, updated_at = now();

-- ADR-014
INSERT INTO public.decisions (number, slug, title, status, summary, content)
VALUES (
  'ADR-014', 'cron-budget-v4-anomalies',
  'Cron récap budget v4 : filtre anomalies Fidu+Mgmt et Direction consolidée', 'Accepté',
  $sum$Un diagnostic du portefeuille Fiduciaire a montré que verrouiller les bons de commande terminés ne réduirait le récapitulatif budgétaire hebdomadaire que de 3,5 %, et a révélé 108 missions en dépassement de budget. La décision refond le cron 84 en version 4 : les managers Fidu+Mgmt ne reçoivent plus que les missions en anomalie (consommation au-delà d'un seuil paramétrable, 75 % par défaut), tandis que Révision conserve l'envoi complet. Un mail Direction consolidé regroupe les anomalies par manager. Le seuil est ajustable sans modification de code.$sum$,
  $md$> 🟢 **Statut** : Accepté | **Date** : 17/05/2026 | **Décideur** : Luc Schmitt

# ADR-014 — Cron récap budget v4 : filtre anomalies Fidu+Mgmt et Direction consolidée

| Statut       | 🟢 Accepted                                          |
|--------------|------------------------------------------------------|
| Date         | 2026-05-17                                           |
| Décideur     | Luc Schmitt (Dirigeant GSL Group)                    |
| Stakeholders | Managers Fidu (Sinibaldi, Poirier, Perbal, Andreolla, Gourdeau), Direction GSL |
| Périmètre    | GSL Fiduciaire + GSL Révision + GSL Management       |
| Successeur de| ADR-013 (paramétrage listes de distribution)         |

---

## Contexte

Le cron `ir.cron(84)` "Récap budget missions" envoie chaque mardi 7h un récapitulatif de consommation budgétaire des missions actives. Lors de l'adoption de la v3 (ADR-013, matin du 17/05/2026), le bloc Fidu+Mgmt avait été **suspendu** (`SEND_FIDU_MGT_RECAP=False`) car le mail comportait 423 lignes, jugé illisible et non actionnable.

L'intention initiale était de **nettoyer les SO Fidu** (verrouiller les missions terminées-facturées-payées) avant de réactiver le bloc. Un diagnostic shell approfondi en soirée du 17/05/2026 a invalidé cette hypothèse :

**Diagnostic chiffré** (lecture seule prod, 17/05/2026 soir) :

- 767 SO Fidu au total dont 325 déjà lockés (1.02M€)
- 373 SO actifs non-lockés (1.45M€)
- Sur ces 373 SO actifs, candidats au lock immédiat : **12 SO maximum**
- Impact sur le mail Fidu+Mgmt si verrouillage maximal : **15 projets en moins sur 423** (3.5%)

**Conclusion** : le verrouillage n'est pas la solution. Le mail reste structurellement long parce que la Fiduciaire a beaucoup de missions clients actives normales (en grande majorité `invoice_status = 'to invoice'`).

**Découverte majeure** : sur 423 projets Fidu+Mgmt actifs, **108 sont en dépassement ≥100%** (26% du portefeuille). Top 10 entre 850% et 5000%. Cela révèle un sujet métier de fond.

L'objectif du mail ne peut donc plus être "présenter l'ensemble" — il doit être **"présenter les anomalies actionnables"**.

## Décision

Refondre le cron 84 en **v4** avec une logique différenciée par société :

- **Fidu + Management** : envoyer aux managers uniquement les missions en anomalie (consommation ≥ seuil paramétrable, défaut 75%)
- **Révision** : maintenir l'envoi complet (volume gérable, 37 projets, pilotage utile)
- Ajouter un **mail "Direction Fidu+Mgmt"** consolidé : toutes les anomalies groupées par manager
- Maintenir le mail Direction Révision existant
- Supprimer le toggle `SEND_FIDU_MGT_RECAP` (remplacé par le filtre anomalies)

Paramètres ajoutés :

| Clé `ir.config_parameter` | Valeur initiale | Rôle |
|---|---|---|
| `gsl.budget_recap.direction_fidu_user_ids` | `6` | Liste destinataires Direction Fidu+Mgmt |
| `gsl.budget_recap.fidu_alert_threshold_pct` | `75` | Seuil pourcentage déclenchant l'alerte |

## Options évaluées

| Option | Description | Décision |
|--------|-------------|----------|
| **A — Tout envoyer (v2)** | 423 lignes par destinataire Fidu | Écartée — illisible |
| **B — Filtrer aux anomalies par manager** | Seuls les projets ≥75% remontés | ✅ **Choisie** — actionnable |
| **C — Top 30 dérives + lien dashboard** | Limite 30 lignes triées | Reportée |
| **D — Synthèse compactée** | Compteurs + lien | Reportée |
| **E — Locker massivement les SO** | Verrouiller les SO terminés | Écartée — impact réel 3.5% |

## Conséquences

**Positives**

- Sinibaldi (48 anomalies) et Poirier (54 anomalies) reçoivent un mail actionnable, support d'un rituel "mardi matin revue dérives 30 min"
- Direction reçoit la vue consolidée des anomalies groupées par manager
- Seuil ajustable sans modification de code
- Mise en lumière du sujet stratégique "108 dépassements" précédemment invisible

**Négatives**

- Asymétrie Fidu (anomalies seulement) vs Révision (tout) — décision assumée vu les volumes
- Le manager Fidu doit aller au dashboard pour voir l'ensemble

**Neutres**

- Réversibilité simple : passer le seuil à 0% revient à l'envoi exhaustif

## Métriques de succès

- **Volume mail** : Sinibaldi et Poirier reçoivent <100 lignes chacune. Atteint : 48 et 54.
- **Adoption rituel** : au moins 2 réunions hebdomadaires "revue dérives" entre 2026-05-19 et 2026-06-30
- **Impact sur les dérives** : 50% des 108 dépassements traités d'ici 2026-08-31

## Documentation associée

- [ADR-011 — Convention de clôture des bons de commande](../decisions/ADR-011-so-closure-convention.md)
- [ADR-013 — Paramétrage des listes de distribution](../decisions/ADR-013-parametrage-listes-distribution-mails.md)
- [PRO-604 — Récap budget hebdomadaire](../procedures/PRO-604-cron-recap-budget.md)$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, status = EXCLUDED.status,
  summary = EXCLUDED.summary, content = EXCLUDED.content, updated_at = now();

-- ADR-015
INSERT INTO public.decisions (number, slug, title, status, summary, content)
VALUES (
  'ADR-015', 'tag-projets-a-allouer',
  'Tag « À allouer » pour le suivi des projets sans manager assigné', 'Accepté',
  $sum$Chez GSL, un projet sans manager assigné correspond par convention à une mission gagnée en attente d'allocation, mais cette situation restait invisible. La décision instaure un tag projet « À allouer » géré automatiquement par deux crons : un cron quotidien qui pose et retire le tag, et un cron mensuel qui adresse à la Direction la liste des projets concernés classés par ancienneté. Au 17/05/2026, 38 projets étaient candidats, dont 26 de plus de 90 jours. La solution par cron natif Odoo a été préférée à un développement custom ou à une pose manuelle du tag.$sum$,
  $md$> 🟢 **Statut** : Accepté | **Date** : 17/05/2026 | **Décideur** : Luc Schmitt

# ADR-015 — Tag "À allouer" pour le suivi des projets sans manager assigné

| Statut       | 🟢 Accepted                                          |
|--------------|------------------------------------------------------|
| Date         | 2026-05-17                                           |
| Décideur     | Luc Schmitt (Dirigeant GSL Group)                    |
| Stakeholders | Direction GSL, Managers Fidu et Révision             |
| Périmètre    | GSL Fiduciaire + GSL Révision + GSL Management       |
| Successeur de| —                                                    |

---

## Contexte

Convention métier en vigueur chez GSL : un projet créé sans `user_id` (champ manager) correspond à une mission **gagnée mais en attente d'allocation à un manager**. Cette convention a été formalisée lors de la session du 17/05/2026.

Sans système de signalisation, cette convention reste **invisible** : impossible de distinguer un projet légitimement en attente d'allocation, d'un projet ayant subi un oubli de saisie, ou d'un projet en transition entre deux managers.

État observé au 17/05/2026 (production) :

- 38 projets actifs sans manager (34 Fidu, 2 Mgmt, 2 Révision)
- 26 ont plus de 90 jours d'ancienneté
- Le plus ancien : S00095 TdC Trimestriel (276 jours sans manager attribué)

Le filtre Révision sans manager du cron 84 v4 ne couvre que 2 projets — les 36 autres étaient invisibles.

## Décision

Mettre en place un **système de marqueur explicite** sous forme d'un tag projet natif Odoo `À allouer` (couleur orange, id=122 en prod), géré automatiquement par deux crons dédiés :

1. **Cron quotidien** (`ir.cron(86)`, 6h Luxembourg) :
   - Ajoute le tag aux projets actifs sans `user_id`
   - Retire le tag dès qu'un manager est assigné
   - Nettoie le tag des projets devenus inactifs

2. **Cron mensuel** (`ir.cron(87)`, 1er du mois 8h Luxembourg) :
   - Envoie un mail à la Direction listant les projets taggés
   - Classement par ancienneté (>90j en rouge, 61-90j en orange, 31-60j en jaune, ≤30j en vert)

Paramètres `ir.config_parameter` :

| Clé | Valeur initiale | Rôle |
|---|---|---|
| `gsl.tag.to_allocate_id` | `122` | ID du tag dans la base prod |
| `gsl.tag.to_allocate_report_user_ids` | `6` | Liste destinataires rapport mensuel |

## Options évaluées

| Option | Description | Décision |
|--------|-------------|----------|
| **A — Pose manuelle du tag** | Le manager pose le tag à chaque mission | Écartée — oublis garantis |
| **B — Auto via gsl_custom (hook)** | Tag posé à la création par le module custom | Reportée — nécessite PR Gonzalo |
| **C — Cron quotidien Odoo** | Cron natif qui tagge/détagge | ✅ **Choisie** |
| **D — Vue filtrée + alerte manuelle** | Filtre kanban + revue manuelle | Écartée — pas de rappel |

## Conséquences

**Positives**

- La dette d'allocation devient **visible** dans Odoo (tag orange dans les vues kanban et liste)
- Rapport mensuel automatique : la Direction ne peut plus "oublier" la dette
- Système entièrement réversible
- Cohérence avec ADR-011 : les projets dont le SO est `locked` ne sont pas taggés

**Négatives**

- Latence d'un jour entre l'action manager et la mise à jour du tag
- Le tag ne distingue pas "vraie attente d'allocation" et "mission communautaire" (cas TdC trimestriels Fidu)

**Neutres**

- Évolution future possible vers l'option B (hook `gsl_custom`)

## Métriques de succès

- **Adoption** : à 30 jours, 50% des projets taggés au 17/05 alloués ou clôturés (cible 19/38 d'ici 2026-06-17)
- **Vieillissement** : à 90 jours, aucun projet taggé n'a plus de 180 jours d'ancienneté
- **Faux positifs** : au plus 5 projets taggés à tort

## Documentation associée

- [ADR-011 — Convention de clôture des bons de commande](../decisions/ADR-011-so-closure-convention.md)
- [ADR-013 — Paramétrage des listes de distribution](../decisions/ADR-013-parametrage-listes-distribution-mails.md)
- [PRO-605 — Tag « À allouer » : exploitation et arbitrages](../procedures/PRO-605-tag-projets-a-allouer.md)$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, status = EXCLUDED.status,
  summary = EXCLUDED.summary, content = EXCLUDED.content, updated_at = now();
