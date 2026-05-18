-- ============================================================
-- Sprint publication 26/05/2026 — Partie 2, Étape 4
-- Import des 6 procédures (PRO-700, PRO-701, PRO-603, PRO-604,
-- PRO-605, mise à jour PRO-DAH-001) + rattachement PRO-601.
--
-- Idempotent : ON CONFLICT (number) DO UPDATE.
-- La colonne `category` (TEXT, legacy) n'est jamais écrasée sur
-- conflit. `category_id` (FK) porte la nouvelle taxonomie.
-- ============================================================

-- Contrainte UNIQUE sur `number` — requise pour ON CONFLICT (number).
-- Idempotent. N'affecte pas la colonne `category` ni son CHECK.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'procedures_number_key'
  ) THEN
    ALTER TABLE public.procedures
      ADD CONSTRAINT procedures_number_key UNIQUE (number);
  END IF;
END $$;

-- PRO-700 — git-deploiement
INSERT INTO public.procedures
  (number, slug, title, category, category_id, summary, content, version, owner, status)
VALUES (
  'PRO-700', 'pr-itc-notification', 'Notification PR à ITC Consultancy',
  'it', '98c35aff-c720-4545-866a-4b5e1f4f2167',
  $sum$Garantir que chaque Pull Request soumise sur itc-lu/gsl-fiduciaire est notifiée explicitement à Gonzalo Matamala (ITC Consultancy Sàrl). ITC ne surveille pas activement la liste des PR ; sans notification, la review peut prendre plusieurs jours de retard.$sum$,
  $md$> **Statut** : En vigueur | **Version** : 1.0 | **Dernière mise à jour** : 18/05/2026

# PRO-700 — Notification PR à ITC Consultancy

## Informations générales
| Champ | Valeur |
|-------|--------|
| Code | PRO-700 |
| Domaine | IT / Workflow externe |
| Version | 1.0 |
| Date de création | 2026-05-08 |
| Dernière mise à jour | 2026-05-08 |
| Auteur | Luc Schmitt |
| Validé par | Luc Schmitt |
| Fréquence d'application | À chaque PR ouverte sur `itc-lu/gsl-fiduciaire` |
| Temps estimé | 2 min |

## Objectif

Garantir que chaque Pull Request soumise sur `itc-lu/gsl-fiduciaire` est
notifiée explicitement à Gonzalo Matamala (ITC Consultancy Sàrl). ITC ne
surveille pas activement la liste des PR ; sans notification, la review peut
prendre plusieurs jours de retard.

Cette procédure complète le workflow Git défini dans
[ADR-010](../decisions/ADR-010-git-workflow-itc-recommendations.md).

## Périmètre

- **S'applique à** : toute PR ouverte sur `itc-lu/gsl-fiduciaire`, qu'elle
  vienne d'un développement Claude Code, d'un fix manuel, ou d'un sync fork.
- **Ne s'applique PAS à** : PR sur `lschGSL/gsl-odoo-workflow` (repo de
  doc/workflow interne — pas de review ITC).

## Quand envoyer

Immédiatement **après** avoir ouvert la PR sur GitHub (l'URL doit exister).

## À qui

| Destinataire | Rôle | Position |
|-------------|------|----------|
| `gonzalo.matamala@it-c.lu` | Reviewer principal ITC | À |
| `stephane.ewerling@it-c.lu` | Référent stratégique ITC | Cc (uniquement si la PR a un impact stratégique : refonte, dépendance croisée, décision d'architecture) |

## Langue

**Anglais.** Gonzalo est anglophone. Pas de FR ni DE.

## Template du mail

```
Subject: PR #<N> — <module> <version> — <description>

Hi Gonzalo,

Following [your email of YYYY-MM-DD / our discussion of YYYY-MM-DD],
I have <description courte de la modification>.

PR open for your review: https://github.com/itc-lu/gsl-fiduciaire/pull/<N>

Module bumped to <version>. <Tests / behavior preserved / etc.>.
Branched from prod, targeting prod, single module touched.

Have a good <day/week>,
Luc
```

### Exemple concret

```
Subject: PR #51 — gsl_dashboard 18.0.1.11.0 — Move fallback emails to System Parameters

Hi Gonzalo,

Following your email of 2026-04-28, I have moved the hardcoded fallback
emails out of the source code into Odoo System Parameters.

PR open for your review: https://github.com/itc-lu/gsl-fiduciaire/pull/51

Module bumped to 18.0.1.11.0. Existing behavior preserved (default values
match the previous hardcoded list). Branched from prod, targeting prod,
single module touched.

Have a good week,
Luc
```

## Procédure pas-à-pas

### Étape 1 — Vérifier la PR avant de notifier
1. Confirmer que la PR cible bien `prod` (pas `main`, pas `Stage`).
2. Confirmer que la PR ne touche qu'**un seul module** (cf. ADR-010).
3. Relire le **body** de la PR : si on a changé la cible en cours de route,
   le body peut encore mentionner « target main » — corriger.
4. Vérifier que le numéro de version dans `__manifest__.py` est bien
   incrémenté.

### Étape 2 — Composer le mail
1. Adapter la phrase d'accroche selon le contexte :
   - Mail récent de Gonzalo → *« Following your email of YYYY-MM-DD »*
   - Discussion verbale → *« Following our discussion of YYYY-MM-DD »*
   - PR spontanée (initiative GSL) → *« I have prepared the following
     change for your review »*
2. La description courte tient en une phrase.
3. Préciser systématiquement les 3 garanties workflow :
   *« Branched from prod, targeting prod, single module touched. »*

### Étape 3 — Envoyer
1. Mail à `gonzalo.matamala@it-c.lu`.
2. `Cc: stephane.ewerling@it-c.lu` **uniquement** si la PR est stratégique.

### Étape 4 — Suivre la réponse
1. Si pas de réponse sous 3 jours ouvrés : relance courte par mail.
2. À la merge ITC : merger localement et déployer selon le workflow Odoo.sh
   habituel.

## Pièges fréquents

- **Mauvaise cible PR** : si la PR vise `main` ou `Stage`, ne pas notifier
  ITC tant que la cible n'est pas corrigée sur `prod` — sinon Gonzalo verra
  une PR polluée par la divergence `main`/`prod`.
- **Body PR pas synchronisé** : le prompt initial Claude Code peut indiquer
  *« PR target: main »* alors qu'on cible finalement `prod`. Toujours
  relire le body avant la notification.
- **Plusieurs modules dans la PR** : ne pas notifier — découper d'abord en
  PR séparées (1 PR = 1 module, cf. ADR-010).

## Références

- [ADR-010 — Workflow Git aligné sur les recommandations ITC](../decisions/ADR-010-git-workflow-itc-recommendations.md)
- Mail Gonzalo Matamala, 2026-04-28$md$,
  '1.0', 'Luc Schmitt', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id, updated_at = now();

-- PRO-701 — administration-odoo
INSERT INTO public.procedures
  (number, slug, title, category, category_id, summary, content, version, owner, status)
VALUES (
  'PRO-701', 'modifier-stages-taches',
  'Modifier ou supprimer des étapes de tâches en toute sécurité',
  'it', '0e2e89af-1cc1-4132-ad5e-bb8cb4959a49',
  $sum$Garantir qu'aucune modification ou suppression d'une étape de tâche (project.task.type) ne casse silencieusement une automatisation base.automation. Applique la règle d'or de l'ADR-012 : tout changement d'étape doit être précédé d'un audit des automatisations qui la référencent.$sum$,
  $md$> **Statut** : En vigueur | **Version** : 1.0 | **Dernière mise à jour** : 18/05/2026

# PRO-701 — Modifier ou supprimer des étapes de tâches en toute sécurité

## Informations générales

| Champ | Valeur |
|-------|--------|
| Numéro | PRO-701 |
| Titre | Modifier ou supprimer des étapes de tâches en toute sécurité |
| Domaine | Administration & IT |
| Date de création | 2026-05-15 |
| Dernière mise à jour | 2026-05-15 |
| Version | 1.0 |
| Propriétaire | Luc Schmitt |
| Validé par | Luc Schmitt |
| Public cible | Luc Schmitt / administrateur Odoo |
| Fréquence d'application | À la demande |

## 1. Objectif

Garantir qu'aucune modification ou suppression d'une étape de tâche
(`project.task.type`) ne casse silencieusement une automatisation
`base.automation`.

Le 15/05/2026, trois automatisations actives sur `project.task` pointaient
vers des étapes supprimées un mois plus tôt lors du nettoyage des étapes
([ADR-002](../decisions/ADR-002-task-stage-cleanup.md)). Elles étaient cassées
sans aucun message d'erreur. L'incident complet est documenté dans
[ADR-012](../decisions/ADR-012-task-stage-automations.md).

Cette procédure applique la **règle d'or** de l'ADR-012 :

> Toute modification ou suppression d'un `project.task.type` doit être
> précédée d'un audit des `base.automation` qui référencent l'ID concerné.

## 2. Public cible

- **Luc Schmitt** — administrateur projet et seul habilité à créer, modifier
  ou supprimer des `project.task.type` (cf. permissions verrouillées en
  ADR-002).
- Tout **administrateur Odoo** amené à reprendre cette responsabilité.

## 3. Prérequis

- Accès `odoo-bin shell` sur l'environnement **staging** ET **production**
  (Odoo.sh).
- Droits administrateur Odoo.
- Avoir lu [ADR-012](../decisions/ADR-012-task-stage-automations.md) et la
  [Référence — Étapes de tâches GSL](../references/task-stages-reference.md).
- Une fenêtre de modification où l'on accepte qu'une automatisation puisse
  être brièvement inactive.

## 4. Procédure étape par étape

### Étape 1 — Identifier les étapes cibles à modifier

1. Lister les `project.task.type` concernés par le changement prévu
   (renommage, fusion, suppression, changement de séquence).
2. Noter pour chacun son **ID de base de données** (pas seulement son nom —
   les automatisations référencent les IDs).
3. Documenter l'intention : pourquoi cette modification, quel résultat
   attendu.

### Étape 2 — Audit des automatisations

1. Exécuter le **script d'audit** fourni en Annexe A sur l'environnement
   **production** (lecture seule, sans risque).
2. Le script liste toutes les `base.automation` portant sur `project.task`,
   résout les IDs d'étapes référencés (en condition **et** en action), et
   signale tout ID déjà inexistant.
3. Croiser la liste des IDs cibles de l'Étape 1 avec les IDs référencés par
   les automatisations.

### Étape 3 — Arbitrer pour chaque étape référencée

Si une étape cible est référencée par au moins une automatisation, choisir
**avant toute modification** l'une des deux options :

- **(a) Ne pas supprimer / ne pas modifier l'étape.** L'option la plus sûre
  si l'automatisation est critique et qu'aucune étape de remplacement claire
  n'existe.
- **(b) Modifier l'automatisation AVANT de toucher à l'étape.** Réaffecter la
  condition (`filter_domain`) et/ou l'action vers l'étape de remplacement,
  puis seulement ensuite modifier ou supprimer l'étape d'origine.

> ⚠️ Ne **jamais** supprimer une étape référencée en espérant « réparer
> après ». Une automatisation cassée ne produit aucune erreur visible.

### Étape 4 — Effectuer la modification sur staging d'abord

1. Appliquer la modification (et, le cas échéant, la réaffectation des
   automatisations) sur l'environnement **staging**.
2. Ne jamais commencer par la production.

### Étape 5 — Vérifier post-modification sur staging

1. Relancer le script d'audit sur staging.
2. Confirmer qu'**aucune automatisation ne pointe vers une étape
   inexistante** (aucune ligne `MANQUANT` dans le rapport).
3. Tester le comportement réel : créer ou faire avancer une tâche de test
   pour vérifier que l'automatisation se déclenche comme prévu.

### Étape 6 — Déployer en production

1. Rejouer la même modification sur la production.
2. Relancer le script d'audit sur la production — rapport attendu : zéro
   `MANQUANT`.
3. Consigner l'opération (date, étapes touchées, automatisations
   réaffectées) — créer ou mettre à jour un ADR si la modification est
   structurante.

## 5. Vérification post-modification

La modification est considérée comme réussie lorsque, sur **staging** puis
sur **production** :

- [ ] Le script d'audit ne signale **aucune** étape `MANQUANT`.
- [ ] Chaque automatisation `on_time` cible une étape existante en condition
      et en action.
- [ ] Chaque automatisation `on_state_set` cible une étape existante en
      action.
- [ ] Un test fonctionnel a confirmé le déclenchement attendu.
- [ ] Rappel : une automatisation `on_time` réparée **ne rétro-déclenche
      pas** les tâches dont la date était déjà dépassée — prévoir un
      rattrapage manuel si nécessaire (cf. ADR-012).

## 6. Annexe

### Annexe A — Script d'audit des automatisations

Script utilisé le 15/05/2026 pour résoudre les IDs d'étapes et vérifier la
cohérence des automatisations. À exécuter via `odoo-bin shell --no-http` sur
Odoo.sh. **Lecture seule** — aucune écriture, aucun risque.

```python
"""
Audit des base.automation sur project.task — 15 mai 2026
Exécuter via: odoo-bin shell --no-http
Lecture seule : liste les automatisations, résout les IDs d'étapes
référencés (condition + action) et signale les étapes inexistantes.
"""
import re

Automation = env['base.automation']
TaskType = env['project.task.type']

# --- Toutes les automatisations portant sur project.task -----------------
automations = Automation.search([('model_id.model', '=', 'project.task')])
print(f"{len(automations)} automation(s) sur project.task\n")

# --- Ensemble des IDs d'étapes réellement existants ----------------------
existing_ids = set(TaskType.with_context(active_test=False).search([]).ids)


def resolve(stage_id):
    """Retourne 'nom (id)' ou 'MANQUANT (id)' si l'étape n'existe plus."""
    stage_id = int(stage_id)
    if stage_id in existing_ids:
        name = TaskType.browse(stage_id).name
        return f"{name!r} ({stage_id})"
    return f">>> MANQUANT <<< ({stage_id})"


def extract_stage_ids(text):
    """Extrait les IDs d'étapes d'une chaîne (domaine ou code Python)."""
    if not text:
        return []
    ids = []
    for match in re.finditer(r'stage_id[^\]\)]*?((?:\d+[,\s]*)+)', str(text)):
        ids += [int(n) for n in re.findall(r'\d+', match.group(1))]
    return ids


missing_found = False

for auto in automations:
    print(f"--- Automation id={auto.id} : {auto.name!r}")
    print(f"    trigger        : {auto.trigger}")
    trg_field = auto.trg_date_id.name if auto.trg_date_id else '—'
    print(f"    champ temporel : {trg_field}")
    print(f"    actif          : {auto.active}")

    domain = auto.filter_domain or auto.filter_pre_domain or ''
    cond_ids = extract_stage_ids(domain)
    print(f"    condition      : {domain or '(aucune)'}")
    for sid in cond_ids:
        flag = resolve(sid)
        print(f"        condition stage -> {flag}")
        if 'MANQUANT' in flag:
            missing_found = True

    action_ids = []
    if auto.state == 'code':
        action_ids = extract_stage_ids(auto.code)
        print(f"    action (code)  : voir code Python")
    else:
        for line in auto.mapped('fields_lines'):
            if line.col1.name == 'stage_id':
                action_ids += extract_stage_ids(line.value)
        print(f"    action (write) : fields_lines")
    for sid in action_ids:
        flag = resolve(sid)
        print(f"        action stage -> {flag}")
        if 'MANQUANT' in flag:
            missing_found = True
    print()

print("=" * 60)
if missing_found:
    print("RESULTAT : INCOHERENCE — au moins une étape MANQUANT.")
    print("           Ne pas déployer. Réaffecter les automatisations.")
else:
    print("RESULTAT : OK — toutes les étapes référencées existent.")
```

### Annexe B — Lister rapidement les étapes existantes

```python
# Inventaire des project.task.type, triés par séquence
for s in env['project.task.type'].search([], order='sequence, name'):
    print(f"  id={s.id:4d}  seq={s.sequence:3d}  {s.name!r}")
```

### Annexe C — Réaffecter l'action d'une automatisation (exemple)

Exemple de réaffectation appliquée le 15/05/2026 (`53 → 161`). À adapter et
exécuter **uniquement** après audit et test sur staging.

```python
auto = env['base.automation'].browse(5)   # id de l'automatisation
for line in auto.fields_lines:
    if line.col1.name == 'stage_id':
        line.value = '161'                # nouvel ID d'étape cible
env.cr.commit()
```

## 7. Références

- [ADR-012 — Automatisations de changement d'étape sur les tâches](../decisions/ADR-012-task-stage-automations.md)
- [ADR-002 — Nettoyage et consolidation des étapes de tâches](../decisions/ADR-002-task-stage-cleanup.md)
- [Référence — Étapes de tâches GSL](../references/task-stages-reference.md)$md$,
  '1.0', 'Luc Schmitt', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id, updated_at = now();

-- PRO-603 — administration-odoo
INSERT INTO public.procedures
  (number, slug, title, category, category_id, summary, content, version, owner, status)
VALUES (
  'PRO-603', 'so-verrouillage', 'Verrouillage des bons de commande terminés',
  'it', '0e2e89af-1cc1-4132-ad5e-bb8cb4959a49',
  $sum$Définir la procédure de clôture d'un bon de commande (SO) une fois la mission opérationnellement terminée, facturée et payée par le client. Distingue le verrouillage (mission terminée) de l'annulation (annulation commerciale réelle).$sum$,
  $md$# PRO-603 v2 — Verrouillage des bons de commande terminés

> **Statut** : 🟢 Validé
> **Version** : 2.0
> **Date** : 2026-05-09
> **Auteur** : Luc Schmitt
> **ADR de référence** : ADR-011 (convention de clôture des SO)
> **Périmètre** : GSL Fiduciaire + GSL Révision

---

## Objectif

Définir la procédure de clôture d'un bon de commande (SO) une fois la mission opérationnellement terminée, facturée et payée par le client.

## Quand l'appliquer

Un SO doit être verrouillé dès que **toutes** les conditions suivantes sont réunies :

1. ✅ **Mission opérationnellement terminée** — toutes les prestations contractuelles ont été livrées au client
2. ✅ **SO entièrement facturé** — `Statut de facturation = "Entièrement facturé"`
3. ✅ **Toutes les factures sont payées** — chaque facture liée affiche le statut `Payé` (vert)

Si une seule condition manque, **ne pas verrouiller**. Attendre.

## Quand NE PAS appliquer

- ❌ La mission est annulée commercialement (client perdu, devis refusé, erreur de création) → utiliser **Annuler** à la place
- ❌ Une facture est en attente de paiement → demander à Laure de finaliser l'écriture comptable ou la note de crédit avant verrouillage
- ❌ Le SO contient une ligne en montant négatif (note de crédit non régularisée) → traiter d'abord la régularisation comptable

## Procédure pas à pas (UI Odoo)

1. Ouvrir le bon de commande dans **Ventes → Commandes**
2. Vérifier que les 3 conditions ci-dessus sont remplies
3. Cliquer sur **Verrouiller** (bouton en haut à gauche, icône cadenas)
4. Le statut passe à 🔒 **Verrouillé** avec un badge gris
5. Ajouter l'étiquette **Facturé/fermé** dans le champ Étiquettes
6. Vérifier dans le chatter que la trace s'est inscrite : `Non → Oui (Verrouillé)`

> Le bouton **Débloquer** reste disponible si une modification ultérieure devient nécessaire (avoir, refacturation, etc.). Cette action laisse une trace dans le chatter — utiliser uniquement avec accord du Manager ou de Luc.

## Différence importante : Verrouiller vs Annuler

| Action | Quand l'utiliser | État résultant | Réversible ? |
|--------|------------------|----------------|--------------|
| **Verrouiller** 🔒 | Mission terminée + facturée + payée | Bon de commande (sale) + verrouillé | Oui via "Débloquer" |
| **Annuler** ❌ | Annulation commerciale réelle | Annulé (cancel) | Difficile, à éviter |

⚠️ **L'ancienne pratique** (annuler les SO terminés) est obsolète depuis le 09/05/2026. Voir ADR-011.

## Cadence opérationnelle

### Pour Isa P. (Fiduciaire)

- Après chaque **clôture de mission** (mensuelle, trimestrielle, annuelle), passer en revue les SO concernés
- Vérifier les statuts factures avec Laure si besoin
- Verrouiller les SO éligibles

### Pour les Managers Révision (Nathalie, Stéphanie, Lu)

- À la **clôture d'un dossier d'audit**, après émission du rapport final et paiement de la facture
- Verrouiller le SO + ajouter l'étiquette

### Cron mensuel (à planifier)

Un cron mensuel listera les SO éligibles non encore verrouillés et notifiera Isa P. et les managers concernés. Voir backlog roadmap (cron lundi sale_line_id manquant + ce nouveau cron).

## Procédure d'urgence — Verrouillage en masse (shell)

Si un nombre important de SO doit être verrouillé en une seule opération (par exemple migration historique), utiliser le shell Odoo.sh.

> ⚠️ **Réservé à Luc + Claude (assistant IA)**. Toujours tester sur staging avant prod.

### Critères de sélection

```python
env.cr.execute("""
    SELECT id, amount_untaxed
    FROM sale_order
    WHERE company_id = <ID_ENTITE>
      AND state = 'cancel'        -- ou 'sale' selon le besoin
      AND amount_untaxed > 0
      AND EXISTS (
          SELECT 1 FROM account_move am
          WHERE am.invoice_origin = sale_order.name
            AND am.move_type = 'out_invoice'
            AND am.state = 'posted'
            AND am.payment_state = 'paid'
      )
""")
```

### Séquence d'exécution

```python
env.cr.execute("SAVEPOINT batch_lock_so")

for so in env['sale.order'].browse(so_ids):
    so.action_draft()       # uniquement si état actuel = cancel
    so.action_confirm()
    so.write({'locked': True})
    so.tag_ids = [(4, 87)]  # tag "Facturé/fermé"

# Vérifier que les montants n'ont pas changé
# Si OK → RELEASE SAVEPOINT + commit
# Sinon → ROLLBACK TO SAVEPOINT
```

### Vérifications obligatoires avant batch prod

- [ ] Aucune `base_automation` active sur `sale.order` qui déclencherait des emails
- [ ] Paramètre `sale.automatic_invoice` = `False`
- [ ] Aucun module GSL/ITC n'override `_action_confirm` (vérifier le MRO)
- [ ] `intercompany_generate_purchase_orders` = `False` sur toutes les entités
- [ ] Test sur 5 puis 50 SO en staging avec données prod fraîches
- [ ] Comparaison `amount_untaxed` avant/après sur l'ensemble du batch
- [ ] SAVEPOINT actif avec rollback automatique en cas d'anomalie

## Historique

| Version | Date | Auteur | Changement |
|---------|------|--------|------------|
| 1.0 | 27/04/2026 | Luc Schmitt | Procédure initiale (Révision uniquement) |
| 2.0 | 09/05/2026 | Luc Schmitt | Extension Fiduciaire + ADR-011 + section batch |

## Références

- ADR-011 — Convention de clôture des SO Fidu/Révision
- Module Odoo natif `sale` — méthode `action_lock()`
- Tag prod `crm.tag` id=87 — "Facturé/fermé"
- Migration Fidu 09/05/2026 : 290 SO, 937 044,72€$md$,
  '2.0', 'Luc Schmitt', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id, updated_at = now();

-- PRO-604 — administration-odoo
INSERT INTO public.procedures
  (number, slug, title, category, category_id, summary, content, version, owner, status)
VALUES (
  'PRO-604', 'cron-recap-budget',
  'Récap budget hebdomadaire : exploitation, modification, désactivation',
  'it', '0e2e89af-1cc1-4132-ad5e-bb8cb4959a49',
  $sum$Décrit comment exploiter, modifier et désactiver le cron Odoo "Récap budget missions — mardi matin" (ir.cron 84), qui envoie chaque mardi à 7h un récapitulatif de consommation budgétaire des missions actives aux managers et à la Direction.$sum$,
  $md$# PRO-604 — Récap budget hebdomadaire : exploitation, modification, désactivation

| Statut          | 🟢 En vigueur                                       |
|-----------------|------------------------------------------------------|
| Version         | 2.0                                                  |
| Date            | 2026-05-17                                           |
| Auteur          | Luc Schmitt                                          |
| ADR de référence| ADR-013 (paramétrage listes de distribution), ADR-014 (cron budget v4) |
| Périmètre       | GSL Fiduciaire + GSL Révision + GSL Management       |
| Public          | Direction, Administrateurs Odoo                      |

---

## Objet

Cette procédure décrit comment exploiter, modifier et désactiver le cron Odoo **"Récap budget missions — mardi matin"** (`ir.cron(84)`), qui envoie chaque mardi à 7h un récapitulatif de consommation budgétaire des missions actives aux managers et à la Direction.

## Vue d'ensemble

Le cron 84 produit chaque mardi 5 catégories de mails distinctes :

| Bloc | Destinataires | Contenu |
|------|---------------|---------|
| 1 — Fidu+Mgmt anomalies | 1 mail par manager Fidu/Mgmt ayant des projets en anomalie | Missions Fiduciaire + Management dont la consommation ≥ seuil (`fidu_alert_threshold_pct`, 75% par défaut) |
| 2 — Révision par manager | 1 mail par manager Révision ayant des projets | Missions Révision dont l'utilisateur est manager (`user_id`) |
| 3 — Orphelins | Direction (Luc Schmitt par défaut) | Projets actifs sans manager assigné |
| 4 — Direction Révision | Liste paramétrable (Luc seul au 17/05/2026) | Vue consolidée Révision groupée par manager |
| 5 — Direction Fidu+Mgmt | Liste paramétrable `direction_fidu_user_ids` (Luc seul au 17/05/2026) | Toutes les anomalies Fidu+Mgmt consolidées, groupées par manager |

Depuis la v4 (17/05/2026, cf. ADR-014), le bloc Fidu+Mgmt ne remonte plus l'ensemble du portefeuille mais uniquement les missions en anomalie (consommation ≥ seuil paramétrable). Le toggle `SEND_FIDU_MGT_RECAP` est supprimé : le filtre anomalies est devenu permanent.

## Modes opératoires

### Mode 1 — Modifier la liste des destinataires Fidu+Mgmt

**Préconditions** : être administrateur Odoo avec accès Settings → Technical.

1. Aller dans **Settings → Technical → System Parameters**
2. Rechercher la clé `gsl.budget_recap.fidu_user_ids`
3. Modifier la valeur (IDs `res.users` séparés par virgule)
4. Sauvegarder

**Récupérer un ID utilisateur** : Settings → Users & Companies → Users → ouvrir l'utilisateur → l'ID est visible dans l'URL du navigateur (`/odoo/users/120` → ID = 120).

**Exemple** : pour ajouter l'utilisateur ID 145, passer de `120,126,113,122,6` à `120,126,113,122,6,145`.

**Effet** : la modification s'applique à la prochaine exécution du cron (mardi suivant 7h). Aucun redémarrage requis.

### Mode 2 — Modifier la liste Direction Révision

Identique au mode 1, avec la clé `gsl.budget_recap.direction_revision_user_ids`.

### Mode 3 — Ajuster le seuil d'alerte Fidu

Le seuil de consommation déclenchant une alerte Fidu+Mgmt est paramétrable, sans modification de code.

1. Aller dans **Settings → Technical → System Parameters**
2. Rechercher la clé `gsl.budget_recap.fidu_alert_threshold_pct`
3. Modifier la valeur (pourcentage entier, ex. `75`)
4. Sauvegarder

**Effet** : passer le seuil à `90` réduit le bruit (moins de projets remontés) ; le passer à `60` augmente la vigilance. Un seuil à `0` revient à un envoi exhaustif. Applicable à la prochaine exécution du cron (mardi suivant 7h).

### Mode 4 — Désactiver temporairement le cron entier

1. **Settings → Technical → Scheduled Actions**
2. Ouvrir le cron 84
3. Décocher la case **Active**
4. Sauvegarder

Pour réactiver : recocher **Active**. Vérifier que **Next Execution Date** est positionnée à un mardi 5h00 UTC (= 7h Luxembourg en heure d'été, 6h en heure d'hiver).

### Mode 5 — Exécution manuelle (test ou rattrapage)

1. **Settings → Technical → Scheduled Actions**
2. Ouvrir le cron 84
3. Cliquer **Run Manually** (bouton en haut)
4. Les mails partent immédiatement aux destinataires configurés

⚠️ **Attention** : `Run Manually` envoie de vrais mails. Pour un test sans envoi, utiliser un shell Odoo avec savepoint + rollback.

### Mode 6 — Vérifier que les mails ont bien été envoyés

1. **Settings → Technical → Email → Emails**
2. Filtrer sur la date du jour
3. Statut attendu : `Sent`. Statut `Outgoing` = en file d'attente, `Exception` = erreur d'envoi

## Configuration de référence (état au 17/05/2026)

| Paramètre | Valeur | Localisation |
|-----------|--------|--------------|
| Active | True | `ir.cron(84).active` |
| Fréquence | 1 semaine, mardi 5h UTC | `ir.cron(84).interval_*`, `nextcall` |
| Utilisateur d'exécution | SCHMITT Luc | `ir.cron(84).user_id` |
| `gsl.budget_recap.fidu_user_ids` | `120,126,113,122,6` | `ir.config_parameter` |
| `gsl.budget_recap.direction_revision_user_ids` | `6` | `ir.config_parameter` |
| `gsl.budget_recap.direction_fidu_user_ids` | `6` | `ir.config_parameter` |
| `gsl.budget_recap.fidu_alert_threshold_pct` | `75` | `ir.config_parameter` |

## Filtres de sélection des projets

Le cron applique ces filtres dans l'ordre :

1. `stage_id.name NOT IN ('Fait', 'Annulé', 'Template', 'Archive')` — exclut les projets terminés ou archivés
2. `allocated_hours > 0` — exclut les projets sans budget temps
3. **Filtre Python** : exclure les projets dont le SO est `locked=True` (cohérence ADR-011)

## Échéances calendaires

| Échéance | Action | Statut |
|----------|--------|--------|
| 2026-05-19 | Premier envoi de production v4 | À surveiller |
| 2026-08-01 | Réintégrer Julie Iovalone (uid 119) dans `gsl.budget_recap.fidu_user_ids` | Planifié |

## Sécurité et permissions

- Le cron s'exécute en tant que **SCHMITT Luc** (uid 6) — toutes les permissions de cet utilisateur s'appliquent
- Les modifications de `ir.config_parameter` requièrent le groupe **Administration / Settings**
- Les modifications du code du cron requièrent le groupe **Administration / Technical Features**

## Diagnostic en cas d'incident

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| Aucun mail reçu mardi 7h | Cron désactivé ou erreur d'exécution | Vérifier `ir.cron(84).active` et logs serveur |
| Destinataire manquant | ID absent du paramètre `ir.config_parameter` | Vérifier la valeur de la clé concernée |
| Erreur Python à l'exécution | ID utilisateur inexistant dans le paramètre | Corriger le paramètre |
| Mail reçu avec liste vide | Aucun projet ne passe les filtres | Vérifier filtres stages + SO locked |
| Mail Direction Révision absent | Paramètre `direction_revision_user_ids` vide | Renseigner au moins un ID |

## Documents associés

- [ADR-013 — Paramétrage des listes de distribution pour les mails internes automatisés](../../decisions/ADR-013-parametrage-listes-distribution-mails.md)
- [ADR-011 — Convention de clôture des bons de commande](../../decisions/ADR-011-so-closure-convention.md)
- [PRO-603 — Verrouillage des SO terminés](./PRO-603-so-verrouillage.md)

## Historique des versions

| Version | Date | Auteur | Changement |
|---------|------|--------|-----------|
| 1.0 | 2026-05-17 | Luc Schmitt | Création initiale (cron 84 v3 paramétrable) |
| 2.0 | 2026-05-17 | Luc Schmitt | Refonte v4 : filtre anomalies Fidu+Mgmt + Direction Fidu consolidée |$md$,
  '2.0', 'Luc Schmitt', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id, updated_at = now();

-- PRO-605 — administration-odoo
INSERT INTO public.procedures
  (number, slug, title, category, category_id, summary, content, version, owner, status)
VALUES (
  'PRO-605', 'tag-projets-a-allouer', 'Tag « À allouer » : exploitation et arbitrages',
  'it', '0e2e89af-1cc1-4132-ad5e-bb8cb4959a49',
  $sum$Décrit le fonctionnement du tag « À allouer » (id=122 en prod) et des deux crons associés (cron quotidien 86 de tag automatique, cron mensuel 87 de rapport Direction). Précise les modes opératoires de configuration et les arbitrages métier.$sum$,
  $md$# PRO-605 — Tag "À allouer" : exploitation et arbitrages

| Statut          | 🟢 En vigueur                                       |
|-----------------|------------------------------------------------------|
| Version         | 1.0                                                  |
| Date            | 2026-05-17                                           |
| Auteur          | Luc Schmitt                                          |
| ADR de référence| ADR-015 (tag projets à allouer)                      |
| Périmètre       | GSL Fiduciaire + GSL Révision + GSL Management       |
| Public          | Direction, Managers, Administrateurs Odoo            |

---

## Objet

Cette procédure décrit le fonctionnement du système de tag `À allouer` (id=122 en prod) et des deux crons associés (cron quotidien 86 de tag automatique, cron mensuel 87 de rapport Direction). Elle précise les modes opératoires de configuration et les arbitrages métier à effectuer.

## Vue d'ensemble du système

Un projet sans manager assigné (`user_id` vide) est, par convention métier, **une mission gagnée en attente d'allocation manager**. Le tag `À allouer` rend cette dette d'allocation visible et déclenche un suivi automatisé.

Trois composants :

1. **Tag `project.tags`** : id=122 en prod, couleur orange (color=3), nom "À allouer"
2. **Cron 86 quotidien** (6h Luxembourg) : maintient le tag à jour automatiquement
3. **Cron 87 mensuel** (1er du mois 8h Luxembourg) : envoie un rapport HTML classé par ancienneté à la Direction

## Règles de tag

Le cron 86 applique chaque matin les trois règles suivantes, dans l'ordre :

1. **Tagger** : tout projet actif sans manager reçoit le tag (s'il ne l'a pas déjà)
2. **Détagger** : tout projet avec manager perd le tag (s'il l'avait)
3. **Nettoyer** : tout projet taggé mais devenu inactif (stage Fait/Annulé/Template/Archive, ou SO locked conformément à ADR-011) perd le tag

Conséquence : il n'y a aucune action manuelle requise pour maintenir le tag. Pour retirer le tag d'un projet, il suffit d'assigner un manager — le tag se retirera le lendemain matin.

## Modes opératoires

### Mode 1 — Allouer un manager à un projet taggé

1. Ouvrir le projet dans Odoo
2. Champ "Responsable du projet" (`user_id`) → sélectionner un manager
3. Sauvegarder
4. Le tag se retirera automatiquement à l'exécution du cron 86 (lendemain 6h)

### Mode 2 — Clore un projet taggé (mission abandonnée ou non lancée)

1. Ouvrir le projet
2. Changer le stage vers "Annulé" (id=69) ou "Archivé" (id=162)
3. Sauvegarder
4. Le tag se retirera automatiquement au prochain cron 86

### Mode 3 — Modifier la liste des destinataires du rapport mensuel

1. Settings → Technical → System Parameters
2. Rechercher `gsl.tag.to_allocate_report_user_ids`
3. Modifier la valeur (liste d'IDs `res.users` séparés par virgule)
4. Sauvegarder

Effet immédiat à la prochaine exécution du cron 87.

### Mode 4 — Désactiver temporairement le rapport mensuel

1. Settings → Technical → Scheduled Actions
2. Ouvrir "Rapport mensuel — projets à allouer"
3. Décocher **Active** → Sauvegarder

Pour réactiver : recocher **Active**. Vérifier que **Next Execution Date** est positionnée sur le 1er du mois suivant à 06:00 UTC (= 8h Luxembourg en été).

### Mode 5 — Exécution manuelle (test ou rattrapage)

1. Settings → Technical → Scheduled Actions
2. Ouvrir le cron 86 ou 87
3. Cliquer **Run Manually**

⚠️ Pour le cron 87, `Run Manually` envoie un vrai mail aux destinataires configurés. Pour un test sans envoi réel, utiliser un shell Odoo avec savepoint + rollback.

### Mode 6 — Désactivation complète du système

1. Désactiver le cron 86 (mode 4 appliqué au cron 86)
2. Désactiver le cron 87 (mode 4 appliqué au cron 87)
3. Optionnel : retirer le tag de tous les projets via shell :
   ```python
   tagged = env['project.project'].search([('tag_ids', 'in', 122)])
   tagged.write({'tag_ids': [(3, 122)]})
   env.cr.commit()
   ```

## Cas particuliers et arbitrages métier

### Cas 1 — Missions communautaires Fidu (TdC trimestriels)

**Constat au 17/05/2026** : plusieurs TdC trimestriels Fidu sont créés sans manager unique parce qu'ils sont traités collectivement par Sinibaldi et Poirier. Ils apparaissent donc dans le tag "À allouer" alors qu'il n'y a pas vraiment de dette d'allocation.

**Arbitrage à faire avec Isa P.** : soit nommer un manager principal (responsable du dossier) sur chaque TdC, soit définir un mécanisme d'exclusion (par exemple : exclure les projets dont le template est "TdC Trimestriel").

**Décision provisoire** : maintenir le tag sur ces projets, la visibilité prime sur l'optimisation fine. Réviser après discussion Isa P.

### Cas 2 — Missions gagnées non encore lancées

**Constat** : les missions gagnées (SO confirmé) mais non encore lancées (pas de timesheet, pas de travail) attendent légitimement une allocation manager. Le tag les remonte au bon moment.

**Action attendue** : à chaque rapport mensuel, Luc revoit la liste et soit nomme un manager, soit décide de l'abandon de la mission.

### Cas 3 — Missions en transition entre managers

**Constat** : si un manager quitte GSL ou change de fonction, ses projets peuvent perdre temporairement leur `user_id`. Le tag les remonte, ce qui est utile pour ne pas oublier de réallouer.

**Action attendue** : réallouer dans les jours qui suivent la transition.

## Configuration de référence (état au 17/05/2026)

| Paramètre | Valeur | Localisation |
|-----------|--------|--------------|
| Tag "À allouer" | id=122, color=3 (orange) | `project.tags` prod |
| Cron 86 quotidien | Active=True, Next=2026-05-18 04:00 UTC | `ir.cron(86)` |
| Cron 87 mensuel | Active=True, Next=2026-06-01 06:00 UTC | `ir.cron(87)` |
| `gsl.tag.to_allocate_id` | `122` | `ir.config_parameter` |
| `gsl.tag.to_allocate_report_user_ids` | `6` (Luc) | `ir.config_parameter` |

## Échéances calendaires

| Échéance | Action | Statut |
|----------|--------|--------|
| 2026-05-18 06:00 | Première exécution cron 86 — 38 projets seront taggés | À surveiller |
| 2026-05-18 (journée) | Test à blanc cron 87 (Run Manually par Luc) | Planifié |
| 2026-06-01 08:00 | Premier rapport mensuel automatique | Planifié |
| Semaine 20-21 | Discussion Isa P. sur les TdC communautaires | À planifier |

## Diagnostic en cas d'incident

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| Aucun tag posé après le 18/05 | Cron 86 désactivé ou paramètre `gsl.tag.to_allocate_id` absent/incorrect | Vérifier les deux. Re-paramétrer si nécessaire (id=122 en prod). |
| Rapport mensuel vide alors que des projets sont taggés | Filtre Odoo ne trouve pas les projets | Vérifier que les projets ont bien `tag_ids` contenant l'id 122 |
| Erreur Python à l'exécution | Paramètre absent | Logs serveur Odoo + `ir.config_parameter` |
| Le tag réapparaît sur un projet juste après que je l'ai retiré | Le projet n'a pas de manager assigné, et le cron 86 le re-tagge le lendemain | Assigner un manager définitivement (le tag ne reviendra plus) |

## Sécurité et permissions

- Les crons s'exécutent en tant qu'**Administrator** (uid=1)
- Modification des paramètres requiert le groupe **Settings**
- Modification du code des crons requiert le groupe **Technical Features**

## Documents associés

- [ADR-015 — Tag "À allouer" pour le suivi des projets sans manager assigné](../../decisions/ADR-015-tag-projets-a-allouer.md)
- [ADR-011 — Convention de clôture des bons de commande](../../decisions/ADR-011-so-closure-convention.md)
- [PRO-604 — Récap budget hebdomadaire](./PRO-604-cron-recap-budget.md) (cron 84 v4, dont le bloc orphelins est partiellement redondant avec ce système)

## Historique des versions

| Version | Date | Auteur | Changement |
|---------|------|--------|-----------|
| 1.0 | 2026-05-17 | Luc Schmitt | Création initiale, déploiement crons 86 et 87 en prod |$md$,
  '1.0', 'Luc Schmitt', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id, updated_at = now();

-- PRO-DAH-001 — dashboard-rentabilite (déjà en base : mise à jour content/title/summary/category_id ; slug aligné sur la convention fichier)
INSERT INTO public.procedures
  (number, slug, title, category, category_id, summary, content, version, owner, status)
VALUES (
  'PRO-DAH-001', 'acces-dashboard-rentabilite', 'Accès au Dashboard Rentabilité GSL',
  'portal', 'd213450c-9760-46d9-8497-f7c6a5eec110',
  $sum$Permettre à un collaborateur d'accéder au menu « Rentabilité GSL » dans Odoo en lui attribuant le groupe de sécurité correspondant à son niveau de responsabilité (Direction, Manager ou Collaborateur).$sum$,
  $md$> **Statut** : En vigueur | **Version** : 1.0 | **Dernière mise à jour** : 18/05/2026

# PRO-DAH-001 — Accès au Dashboard Rentabilité GSL

## Informations générales

| Champ | Valeur |
|-------|--------|
| Numéro | PRO-DAH-001 |
| Titre | Attribution des droits d'accès au Dashboard Rentabilité |
| Date de création | Mai 2026 |
| Version | 1.0 |
| Propriétaire | Luc Schmitt — Administrateur Odoo |
| Public cible | Administrateur Odoo (Luc) |
| Fréquence | À la demande (nouvel utilisateur ou changement de rôle) |

## 1. Objectif

Permettre à un collaborateur d'accéder au menu **« Rentabilité GSL »** dans
Odoo en lui attribuant le groupe de sécurité correspondant à son niveau de
responsabilité.

## 2. Prérequis

- Accès administrateur Odoo actif.
- Le collaborateur destinataire dispose d'un compte Odoo actif (email +
  mot de passe).
- Connaître le niveau d'accès à attribuer au collaborateur.

## 3. Niveaux d'accès disponibles

| Groupe de sécurité | Public concerné | Périmètre de données |
|--------------------|-----------------|----------------------|
| GSL Dashboard / Direction | Associés, direction | Toutes les sociétés du groupe |
| GSL Dashboard / Manager | Managers, chefs de mission | Ses propres projets uniquement |
| GSL Dashboard / Collaborateur | Collaborateurs | Son activité personnelle uniquement |

**Règle générale** : attribuer le niveau **le plus restrictif** qui couvre les
besoins du collaborateur. En cas de doute, commencer par **Collaborateur** et
élargir sur demande motivée.

## 4. Procédure étape par étape

### Étape 1 — Ouvrir la fiche utilisateur

1. Aller dans **Settings → Users & Companies → Users**.
2. Rechercher le collaborateur concerné.
3. Cliquer sur sa fiche pour l'ouvrir.

### Étape 2 — Attribuer le groupe

1. Ouvrir l'onglet **« Other »**.
2. Repérer la section **« GSL Dashboard »**.
3. Cocher **UNE SEULE** case parmi **Direction**, **Manager** ou
   **Collaborateur**.
4. Cliquer sur **Save**.

### Étape 3 — Vérification

1. Informer le collaborateur que son accès a été attribué.
2. Lui demander de rafraîchir la page (**F5**) ou de se reconnecter.
3. Vérifier que le menu **« Rentabilité GSL »** apparaît bien dans sa
   barre de navigation.

## 5. Résultat attendu

Le menu **« Rentabilité GSL »** apparaît dans la barre de navigation, avec les
vues correspondant au groupe attribué :

- **Direction** : toutes les sociétés, tous les collaborateurs.
- **Manager** : ses projets et son équipe.
- **Collaborateur** : sa vue personnelle.

## 6. Retrait d'accès

Pour retirer l'accès d'un collaborateur :

1. Suivre les **étapes 1 à 3** de la section 4.
2. À l'étape 2, **décocher** la case actuellement cochée.
3. Sauvegarder.

## 7. En cas de problème

| Symptôme | Action corrective |
|----------|-------------------|
| Le menu n'apparaît pas après F5 | Demander une déconnexion / reconnexion complète. |
| Aucun groupe GSL Dashboard visible dans l'onglet « Other » | Vérifier que le module GSL Dashboard est installé (contacter l'administrateur technique). |
| Le collaborateur voit trop peu de données | Vérifier le groupe attribué et les règles RLS du module. |$md$,
  '1.0', 'Luc Schmitt — Administrateur Odoo', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id, updated_at = now();

-- PRO-601 — pas de fichier source : rattachement défensif à rh-paie (déjà effectué en Partie 1).
UPDATE public.procedures
   SET category_id = 'c3e144de-3429-46da-b673-daf9e0d8be81'
 WHERE number = 'PRO-601' AND category_id IS DISTINCT FROM 'c3e144de-3429-46da-b673-daf9e0d8be81';
