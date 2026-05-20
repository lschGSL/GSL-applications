-- ============================================================
-- Sprint publication — Documentation Agent Fiscal IA
-- Contenu :
--   - 1 catégorie de procédures : "agent-fiscal"
--   - 1 ADR : ADR-017
--   - 3 procédures : PRO-801, PRO-802, PRO-803
--   - 2 formations : F-AF-01, F-AF-02
--
-- Idempotent : ON CONFLICT DO UPDATE / IF NOT EXISTS.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Pré-requis : colonnes & contraintes
-- ------------------------------------------------------------

-- visibility (metadonnée de visibilité éditoriale : 'all', 'managers', 'direction')
-- Colonnes ajoutées idempotamment ; non gardées par les policies RLS actuelles
-- (les policies en vigueur restent : tout authentifié peut lire, admin écrit).
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS visibility text;
ALTER TABLE public.decisions  ADD COLUMN IF NOT EXISTS visibility text;
ALTER TABLE public.formations ADD COLUMN IF NOT EXISTS visibility text;

-- Contrainte UNIQUE sur procedures.number (requise pour ON CONFLICT (number))
-- Déjà posée par sprint-26mai-procedures.sql, mais on la pose ici pour pouvoir
-- exécuter ce seed indépendamment.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'procedures_number_key'
  ) THEN
    ALTER TABLE public.procedures
      ADD CONSTRAINT procedures_number_key UNIQUE (number);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 1. Catégorie "agent-fiscal" dans procedure_categories
-- ------------------------------------------------------------
INSERT INTO public.procedure_categories
  (slug, name, icon, sort_order, published, placeholder)
VALUES
  ('agent-fiscal', 'Agent Fiscal IA', 'sparkles', 90, true, NULL)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  icon        = EXCLUDED.icon,
  sort_order  = EXCLUDED.sort_order,
  published   = EXCLUDED.published,
  placeholder = EXCLUDED.placeholder;

-- ------------------------------------------------------------
-- 2. ADR-017 — Architecture IA Agent Fiscal GSL
-- ------------------------------------------------------------
INSERT INTO public.decisions (number, slug, title, status, visibility, summary, content)
VALUES (
  'ADR-017', 'adr-017-agent-fiscal-ia',
  'ADR-017 — Architecture IA Agent Fiscal GSL', 'Accepté', 'direction',
  $sum$GSL souhaite offrir à ses collaborateurs un assistant fiscal IA de niveau Big4/Atoz pour le marché luxembourgeois, sans externaliser le conseil. La décision retient une architecture multi-agents Hub & Spokes bâtie sur Next.js (App Router, Server Actions), Supabase SSR (Auth + PostgreSQL + RLS) et Anthropic Claude Sonnet, déployée sur Vercel. L'agent expose 5 modes de réponse (Mémo / Note / Brief / Comparateur / Stratégie), trois niveaux de profondeur (Rapide / Standard / Approfondi) et un pipeline d'extended thinking avec peer validation. Conséquences : pile homogène avec le portail GSL, traçabilité complète des prompts/réponses en Supabase, coût maîtrisable par mode, et fondations prêtes pour la Knowledge Base interne.$sum$,
  $md$> 🟢 **Statut** : Accepté | **Date** : 2026-05-20 | **Décideur** : Luc Schmitt

# ADR-017 — Architecture IA Agent Fiscal GSL

| Statut        | 🟢 Accepté |
|---------------|------------|
| Date          | 2026-05-20 |
| Décideur      | Luc Schmitt (Dirigeant GSL Group) |
| Stakeholders  | Direction GSL, Managers Fidu & Révision, Équipe portail |
| Périmètre     | GSL Fiduciaire + GSL Révision |
| Visibilité    | Direction |

---

## Contexte

GSL Group accompagne ses clients luxembourgeois sur l'ensemble du cycle
fiscal (déclarations, TVA, IRC, ICC, prix de transfert, restructurations).
Le besoin métier est double :

1. **Donner aux collaborateurs un niveau de conseil équivalent Big4/Atoz**
   sans dépendre d'un cabinet externe pour chaque question pointue.
2. **Capitaliser sur la connaissance fiscale interne** (jurisprudence
   CAA/Cour adm., circulaires LITL, ECHA, doctrine) sous forme
   réutilisable et traçable.

Les solutions de marché (Big4 portals, plateformes SaaS fiscales) ne
permettent ni la confidentialité requise ni la spécialisation
luxembourgeoise attendue. Une solution propriétaire, intégrée au portail
GSL, est nécessaire.

## Décision

**Adopter une architecture multi-agents "Hub & Spokes" sur la pile suivante :**

| Couche | Choix | Justification |
|--------|-------|---------------|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) | Aligné portail GSL, SSR/RSC pour la fraîcheur des données |
| Langage | TypeScript 5.8 strict | Standard GSL, typage des prompts et schémas |
| UI | Tailwind 4 + shadcn/ui | Identique au portail GSL, cohérence design system |
| Auth & DB | Supabase SSR (`@supabase/ssr ^0.9`) | SSO portail, RLS, traçabilité, partage de schéma |
| LLM | Anthropic Claude Sonnet (extended thinking) | Qualité du raisonnement juridique, contexte long |
| Hébergement | Vercel | Aligné portail, edge runtime, secrets managés |

### Topologie "Hub & Spokes"

- **Hub** : orchestrateur principal qui reçoit la question, classe l'intent
  (déclaration, contentieux, planification…), choisit le mode et la
  profondeur, et arbitre entre spokes.
- **Spokes** spécialisés : LITL/circulaires, jurisprudence CAA, prix de
  transfert, TVA UE/LU, planning fiscal. Chaque spoke a son prompt système
  et ses sources prioritaires.
- **Peer validation** : un second appel modèle relit la réponse du Hub
  avant publication, pour challenger les conclusions et lever les flags.

### Cinq modes de réponse

| Mode | Usage | Sortie |
|------|-------|--------|
| **Mémo** | Note interne d'analyse | Markdown structuré avec base légale |
| **Note** | Recommandation courte au dossier | Format conclusion + risques |
| **Brief** | Synthèse exécutive | 5–10 lignes, points clés |
| **Comparateur** | Mise en regard d'options | Tableau d'aide à la décision |
| **Stratégie** | Plan multi-étapes | Roadmap fiscale chronologique |

### Trois profondeurs

| Profondeur | Latence | Tokens raisonnement | Cible |
|------------|---------|---------------------|-------|
| Rapide     | ~20 s         | faible | Vérification, question simple |
| Standard   | 1–2 min       | moyen  | Analyse courante, client connu |
| Approfondi | 3–5 min       | élevé  | Dossier complexe, contentieux |

## Options évaluées

1. **SaaS Big4 (Atoz Connect, EY TaxChat)** — écarté : confidentialité
   insuffisante, pas de spécialisation interne, coûts élevés.
2. **GPT/Gemini hébergé en API tierce** — écarté : la qualité du
   raisonnement long et la gestion du contexte juridique sont supérieures
   chez Claude Sonnet pour ce cas d'usage.
3. **Modèle open-source self-host (Llama/Mistral)** — écarté : coût de
   maintien (GPU, fine-tuning, versions) hors d'échelle GSL.
4. **Statu quo** — écarté : la dette de conseil s'accumule, les
   collaborateurs juniors restent bloqués sur des questions techniques.

## Conséquences

### Positives

- **Pile homogène** avec le portail GSL : auth, RLS, design system.
- **Traçabilité** complète prompt → réponse → validation en Supabase
  (audit RGPD, débogage, futurs analytics).
- **5 modes / 3 profondeurs** permettent de calibrer coût et latence par
  cas d'usage.
- **Peer validation** intégrée dès le départ — fondation de la
  Knowledge Base GSL.

### Neutres

- L'agent reste **un outil de travail interne** : sa sortie est révisée
  par un collaborateur signataire avant tout usage client.
- La pile dépend d'Anthropic (vendor lock-in modéré, mitigé par le
  pipeline modulaire qui peut être pointé sur un autre LLM).

### Négatives / risques résiduels

- **Coût LLM** à surveiller (extended thinking et mode Approfondi
  consomment beaucoup) — voir PRO-803 et l'observabilité.
- **Confidentialité** : les prompts sortent vers Anthropic. PRO-803
  cadre les données client transmissibles.
- **Hallucinations possibles** sur des cas pointus — peer validation
  obligatoire avant insertion en Knowledge Base.

## Documentation associée

- Procédure : PRO-801 — Agent Fiscal IA : guide collaborateur
- Procédure : PRO-802 — Workflow validation peer et Knowledge Base
- Procédure : PRO-803 — Gouvernance IA et confidentialité client
- Formation : F-AF-01 — Onboarding Agent Fiscal IA
- Formation : F-AF-02 — Maîtriser les modes Rapide / Standard / Approfondi
- App : `gsl-agent-fiscal.vercel.app` (slug `agent-fiscal`)$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title, status = EXCLUDED.status,
  visibility = EXCLUDED.visibility, summary = EXCLUDED.summary,
  content = EXCLUDED.content, updated_at = now();

-- ------------------------------------------------------------
-- 3. PRO-801 — Agent Fiscal IA : guide collaborateur
-- ------------------------------------------------------------
INSERT INTO public.procedures
  (number, slug, title, category, category_id, visibility, summary, content, version, owner, status)
VALUES (
  'PRO-801', 'pro-801-agent-fiscal-guide',
  'PRO-801 — Agent Fiscal IA : guide collaborateur',
  'portal',
  (SELECT id FROM public.procedure_categories WHERE slug = 'agent-fiscal'),
  'managers',
  $sum$Mode d'emploi de l'Agent Fiscal IA pour tout collaborateur GSL : accès via apps.gsl.lu, choix du mode de réponse (Rapide / Standard / Approfondi), choix du type de sortie (Mémo / Note / Brief / Comparateur / Stratégie), ajout d'un PDF client en pièce jointe, lecture de la synthèse, de la base légale et des opportunités fiscales détectées, export en PDF ou Word.$sum$,
  $md$> **Statut** : En vigueur | **Version** : 1.0 | **Dernière mise à jour** : 2026-05-20

# PRO-801 — Agent Fiscal IA : guide collaborateur

## Informations générales

| Champ | Valeur |
|-------|--------|
| Code | PRO-801 |
| Domaine | Portail GSL / Agent Fiscal IA |
| Version | 1.0 |
| Date de création | 2026-05-20 |
| Dernière mise à jour | 2026-05-20 |
| Auteur | Luc Schmitt |
| Validé par | Luc Schmitt |
| Visibilité | Managers |
| Fréquence d'application | À chaque utilisation de l'agent |
| Temps de lecture | 5 min |

## Objectif

Permettre à tout collaborateur GSL de tirer parti de l'Agent Fiscal IA
dès la première utilisation : poser une question fiscale, choisir le bon
mode, lire la réponse correctement, et l'exporter pour un dossier client.

Cette procédure complète l'[ADR-017](../decisions/adr-017-agent-fiscal-ia)
qui pose le cadre architectural.

## Périmètre

- **S'applique à** : tout utilisateur du portail GSL ayant un accès actif
  à l'application "Agent Fiscal" (par défaut : tous les collaborateurs
  internes).
- **Ne s'applique PAS à** : les clients (les clients n'ont pas accès à
  l'agent ; cf. PRO-803 sur la gouvernance).

## Étape 1 — Accéder à l'application

1. Se connecter à `https://apps.gsl.lu`.
2. Sur le dashboard, cliquer sur la carte **Agent Fiscal**.
3. L'agent s'ouvre via SSO — pas besoin de se reconnecter.

URL directe : `https://gsl-agent-fiscal.vercel.app`.

## Étape 2 — Choisir le mode de réponse

Trois profondeurs sont disponibles, à choisir avant d'envoyer la question :

| Mode       | Latence    | Quand l'utiliser |
|------------|------------|------------------|
| **Rapide**     | ~20 s      | Vérification rapide, point précis, question fermée |
| **Standard**   | 1–2 min    | Analyse courante, client connu, mémo de travail |
| **Approfondi** | 3–5 min    | Dossier complexe, contentieux, planning fiscal |

Voir aussi la formation F-AF-02 pour des exemples détaillés.

## Étape 3 — Choisir le type de sortie

Cinq types de sortie sont proposés ; le bon choix dépend de l'usage final :

| Type           | Pour quoi faire ? |
|----------------|-------------------|
| **Mémo**       | Note interne d'analyse au dossier |
| **Note**       | Recommandation courte au client (à révéler après revue) |
| **Brief**      | Synthèse exécutive 5–10 lignes |
| **Comparateur**| Comparer 2+ options (régime A vs B) |
| **Stratégie**  | Plan d'action fiscal multi-étapes |

## Étape 4 — Joindre un PDF client (optionnel)

L'agent accepte un PDF en pièce jointe (déclaration, statuts, contrat,
etc.) :

1. Cliquer sur l'icône **trombone** dans la zone de saisie.
2. Sélectionner le fichier (< 20 Mo, PDF/Word/Excel).
3. Le contenu est analysé localement avant envoi à l'agent.

⚠️ **Ne jamais joindre** : RIB, copie carte d'identité, données ultra-
sensibles non anonymisées. Voir PRO-803.

## Étape 5 — Lire la réponse

Une réponse complète comporte typiquement trois blocs :

1. **Synthèse** — la conclusion de l'agent, en tête.
2. **Base légale** — articles LITL/LIR/LICC, circulaires, jurisprudence
   citées avec références exactes.
3. **Opportunités fiscales détectées** — points que l'agent a remarqués
   en lisant la pièce jointe (déductions oubliées, régime alternatif,
   risque de redressement…).

Des **flags colorés** (rouge / orange / jaune / vert / bleu / gris)
signalent les points à vérifier — voir PRO-802 pour leur signification.

## Étape 6 — Exporter

Deux formats d'export sont disponibles via le menu **⋯** en haut à droite
de la réponse :

- **PDF** : pour archivage au dossier client (DMS / dossier mandat).
- **Word (.docx)** : pour intégration dans un livrable plus large
  (mémo, note de cadrage, slide deck).

L'export conserve la mise en forme, les références juridiques cliquables
et un footer "Document généré par Agent Fiscal IA — révision GSL requise".

## Pièges fréquents

- **Question trop large** : "que penses-tu de cette société ?" donne une
  réponse vague. Préciser le régime, l'exercice, le sujet.
- **Mode Rapide sur dossier complexe** : la latence est plus courte mais
  l'agent ne creuse pas. Pour un contentieux, toujours Approfondi.
- **Oubli du PDF** : si le mandat dispose d'un bilan ou statuts utiles,
  les joindre — l'agent en tirera des opportunités fiscales.
- **Recopie directe au client** : interdit sans révision. Voir PRO-803.

## Références

- [ADR-017 — Architecture IA Agent Fiscal GSL](../decisions/adr-017-agent-fiscal-ia)
- PRO-802 — Workflow validation peer et Knowledge Base
- PRO-803 — Gouvernance IA et confidentialité client
- F-AF-01 — Onboarding Agent Fiscal IA (30 min)
- F-AF-02 — Maîtriser les modes Rapide / Standard / Approfondi$md$,
  '1.0', 'Luc Schmitt', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  visibility = EXCLUDED.visibility, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id,
  status = EXCLUDED.status, updated_at = now();

-- ------------------------------------------------------------
-- 4. PRO-802 — Workflow validation peer et Knowledge Base
-- ------------------------------------------------------------
INSERT INTO public.procedures
  (number, slug, title, category, category_id, visibility, summary, content, version, owner, status)
VALUES (
  'PRO-802', 'pro-802-validation-peer',
  'PRO-802 — Workflow validation peer et Knowledge Base',
  'portal',
  (SELECT id FROM public.procedure_categories WHERE slug = 'agent-fiscal'),
  'managers',
  $sum$Comment lever les flags colorés produits par l'Agent Fiscal IA, auto-valider sa réponse, demander une revue à un collègue et contribuer à la Knowledge Base après validation. Définit les trois niveaux de confiance (CERTAIN / PROBABLE / À CONFIRMER) et la sémantique des 6 couleurs de flags.$sum$,
  $md$> **Statut** : En vigueur | **Version** : 1.0 | **Dernière mise à jour** : 2026-05-20

# PRO-802 — Workflow validation peer et Knowledge Base

## Informations générales

| Champ | Valeur |
|-------|--------|
| Code | PRO-802 |
| Domaine | Portail GSL / Agent Fiscal IA |
| Version | 1.0 |
| Date de création | 2026-05-20 |
| Dernière mise à jour | 2026-05-20 |
| Auteur | Luc Schmitt |
| Validé par | Luc Schmitt |
| Visibilité | Managers |

## Objectif

Définir comment un collaborateur lève les **flags colorés** produits par
l'Agent Fiscal IA, à quel moment il s'auto-valide, quand demander une
revue à un collègue, et comment contribuer à la **Knowledge Base** GSL
après validation peer.

## Sémantique des 6 couleurs de flags

L'agent appose un drapeau coloré à chaque point qui mérite vérification
humaine :

| Couleur     | Signification | Action attendue |
|-------------|---------------|-----------------|
| 🔴 **Rouge** | Risque de redressement / point bloquant | Vérification obligatoire avant tout usage |
| 🟠 **Orange**| Interprétation discutable | Lecture critique, second avis si dossier sensible |
| 🟡 **Jaune** | Donnée chiffrée à recouper | Recoupement avec le dossier source |
| 🟢 **Vert**  | Conclusion solide | Validation rapide possible |
| 🔵 **Bleu**  | Information factuelle / contextuelle | Vérification optionnelle |
| ⚪ **Gris**  | Hors périmètre / hors fiscal | À ignorer pour le sujet courant |

## Niveaux de confiance

À chaque conclusion, l'agent attache un niveau :

- **CERTAIN** — appui légal direct (article + circulaire + jurisprudence).
  Validation peer rapide possible.
- **PROBABLE** — interprétation cohérente sans appui direct. Validation
  peer recommandée.
- **À CONFIRMER** — zone grise, doctrine partagée, ou absence de
  jurisprudence. Validation peer **obligatoire**.

## Étape 1 — Auto-validation par l'auteur

L'auteur de la requête relit la réponse :

1. Pour chaque flag rouge ou orange, vérifier la source citée.
2. Pour chaque flag jaune, recouper la donnée chiffrée avec le dossier.
3. Si tout est levé et confiance ≥ PROBABLE : cliquer sur **✅ Validée
   par l'auteur**.

## Étape 2 — Demande de revue à un collègue

Si confiance = À CONFIRMER, ou si un flag rouge subsiste après
auto-validation :

1. Cliquer sur **👥 Demander une revue**.
2. Sélectionner un manager ou collègue spécialiste (TVA, prix de
   transfert, contentieux, etc.).
3. Le collègue reçoit une notification ; il dispose de 48 h pour
   répondre.
4. Il statue : **Validée**, **À retravailler** (commentaire requis) ou
   **Rejetée** (la réponse ne sera pas Knowledge Base).

## Étape 3 — Contribution à la Knowledge Base

Une réponse **Validée par un peer** peut être proposée à la Knowledge
Base GSL :

1. Cliquer sur **📚 Proposer à la KB**.
2. Tagger : domaine (LITL, TVA, IRC, contentieux…), client type, exercice.
3. Le contenu est anonymisé automatiquement (suppression des noms client,
   numéros, montants identifiants).
4. La KB devient alors une source pour les futures requêtes de l'agent
   (RAG).

## Étape 4 — Suivi des validations

Le tableau de bord de l'agent affiche :

- ⏳ Mes requêtes en attente de revue
- ✅ Mes requêtes validées
- 🚫 Mes requêtes rejetées (et le commentaire)

## Pièges fréquents

- **Auto-validation hâtive** : un flag rouge ne se "valide" pas — il se
  **lève** par vérification de la source.
- **Confondre confiance et flag** : un flag vert + confiance À CONFIRMER
  reste à confirmer.
- **Oublier d'anonymiser** : la KB doit pouvoir être partagée largement
  en interne. Le bouton "Proposer à la KB" anonymise, mais relire avant.

## Références

- [ADR-017 — Architecture IA Agent Fiscal GSL](../decisions/adr-017-agent-fiscal-ia)
- PRO-801 — Agent Fiscal IA : guide collaborateur
- PRO-803 — Gouvernance IA et confidentialité client$md$,
  '1.0', 'Luc Schmitt', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  visibility = EXCLUDED.visibility, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id,
  status = EXCLUDED.status, updated_at = now();

-- ------------------------------------------------------------
-- 5. PRO-803 — Gouvernance IA et confidentialité client
-- ------------------------------------------------------------
INSERT INTO public.procedures
  (number, slug, title, category, category_id, visibility, summary, content, version, owner, status)
VALUES (
  'PRO-803', 'pro-803-gouvernance-ia',
  'PRO-803 — Gouvernance IA et confidentialité client',
  'portal',
  (SELECT id FROM public.procedure_categories WHERE slug = 'agent-fiscal'),
  'managers',
  $sum$Cadre de gouvernance d'usage de l'Agent Fiscal IA : l'agent produit des analyses de travail interne et ne doit jamais être envoyé directement au client sans révision ; la responsabilité reste celle du collaborateur signataire ; les données client transmises à Anthropic doivent respecter le RGPD ; règles strictes sur les données ultra-sensibles (RIB, identité, numéros).$sum$,
  $md$> **Statut** : En vigueur | **Version** : 1.0 | **Dernière mise à jour** : 2026-05-20

# PRO-803 — Gouvernance IA et confidentialité client

## Informations générales

| Champ | Valeur |
|-------|--------|
| Code | PRO-803 |
| Domaine | Portail GSL / Conformité IA |
| Version | 1.0 |
| Date de création | 2026-05-20 |
| Dernière mise à jour | 2026-05-20 |
| Auteur | Luc Schmitt |
| Validé par | Luc Schmitt |
| Visibilité | Managers |

## Objectif

Cadrer l'usage de l'Agent Fiscal IA dans le respect du secret
professionnel, du RGPD et de la responsabilité signataire du
collaborateur GSL.

## Règle d'or n°1 — Document de travail interne uniquement

L'Agent Fiscal IA produit des **analyses de travail interne**.

- ✅ **Autorisé** : utiliser la sortie pour préparer un mémo, structurer
  un raisonnement, retrouver une référence légale, comparer des options.
- ❌ **Interdit** : envoyer la réponse brute au client (mail, livrable,
  PDF signé) sans révision approfondie par un collaborateur signataire.

Tous les exports portent le footer : *"Document généré par Agent Fiscal
IA — révision GSL requise"*. Ce footer ne doit jamais être retiré sur un
document non révisé.

## Règle d'or n°2 — Responsabilité du collaborateur signataire

Le collaborateur qui signe un livrable (mémo, note, déclaration) en
**assume l'entière responsabilité professionnelle**, même si l'analyse
provient initialement de l'agent.

Cela implique :

- Vérifier les bases légales citées (article + circulaire + JP).
- Recouper les chiffres avec les pièces du dossier.
- Lever tous les flags rouges et oranges (cf. PRO-802).
- Tracer dans le dossier la part IA / la part humaine si pertinent.

L'agent n'est **pas** un avis fiscal au sens de l'art. 22 LITL.

## Règle d'or n°3 — RGPD et confidentialité client

Les prompts et pièces jointes envoyés à l'agent transitent par l'API
Anthropic. Les conditions contractuelles GSL ↔ Anthropic prévoient :

- Pas d'entraînement du modèle sur les données client GSL.
- Conservation logs limitée (30 jours) sauf incident sécurité.
- Conformité RGPD au sens DPA standard.

Côté GSL :

- ✅ **Acceptable** : nom de société, secteur, structure capitalistique,
  données financières agrégées, extraits de statuts.
- ⚠️ **À pseudonymiser** : noms de personnes physiques, dates de
  naissance, adresses privées.
- ❌ **Strictement interdit en clair** :
  - Numéros de compte bancaire (RIB, IBAN).
  - Numéros de carte d'identité / passeport.
  - Numéros de matricule national luxembourgeois.
  - Mots de passe, clés d'accès, secrets techniques.
  - Données médicales ou pénales.

Si le PDF source contient ces données, **les caviarder** avant upload.

## Règle d'or n°4 — Traçabilité

Toutes les requêtes (prompt, réponse, validation peer) sont stockées en
Supabase avec horodatage et identifiant collaborateur. Cette
traçabilité :

- Permet une revue post-incident (qui a demandé quoi, quand).
- Sert d'historique pour la Knowledge Base.
- Reste interne — non accessible aux clients.

## Que faire en cas de doute

- **Cas client sensible** (contentieux, restructuration majeure) :
  consulter un manager avant la première requête à l'agent.
- **Données ultra-sensibles dans le PDF** : passer par caviardage ou
  retraitement avant upload — voir Direction si besoin.
- **Suspicion de fuite ou d'incident** : signalement immédiat à la
  Direction GSL + DPO.

## Références

- [ADR-017 — Architecture IA Agent Fiscal GSL](../decisions/adr-017-agent-fiscal-ia)
- PRO-801 — Agent Fiscal IA : guide collaborateur
- PRO-802 — Workflow validation peer et Knowledge Base
- DPA Anthropic GSL (archivé Direction)$md$,
  '1.0', 'Luc Schmitt', 'published'
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  visibility = EXCLUDED.visibility, summary = EXCLUDED.summary,
  content = EXCLUDED.content, category_id = EXCLUDED.category_id,
  status = EXCLUDED.status, updated_at = now();

-- ------------------------------------------------------------
-- 6. F-AF-01 — Onboarding Agent Fiscal IA (30 min)
-- ------------------------------------------------------------
INSERT INTO public.formations (number, slug, title, duration_min, visibility, content)
VALUES (
  'F-AF-01', 'f-af-01-onboarding-agent-fiscal',
  'F-AF-01 — Onboarding Agent Fiscal IA (30 min)', 30, 'all',
  $md$> **Durée de la session** : 30 min | **Visibilité** : tous les collaborateurs

# F-AF-01 — Onboarding Agent Fiscal IA (30 min)

## Objectifs pédagogiques

À la fin de cette session, le collaborateur sait :

1. **Poser sa première question** à l'Agent Fiscal IA depuis le portail.
2. **Choisir le bon mode** parmi Rapide / Standard / Approfondi.
3. **Lire une réponse** : synthèse, base légale, opportunités fiscales,
   flags colorés.
4. **Exporter** au format PDF ou Word pour archivage dossier.

## Pré-requis

- Compte actif sur `apps.gsl.lu`.
- Accès à l'application "Agent Fiscal" (par défaut, accordé à tout
  collaborateur interne).
- Avoir lu PRO-801 (guide collaborateur) et PRO-803 (gouvernance).

## Étapes guidées (25 min)

### Étape 1 — Accéder à l'agent (2 min)

1. Ouvrir `https://apps.gsl.lu`.
2. Cliquer sur la carte **Agent Fiscal**.
3. L'app s'ouvre via SSO.

### Étape 2 — Première question en mode Rapide (5 min)

**Question type** :

> "Quelle est la limite de déductibilité des intérêts notionnels pour
> une SARL luxembourgeoise détenant des participations qualifiées en 2025 ?"

- Sélectionner **mode Rapide** + **type Brief**.
- Envoyer.
- Lire la réponse en ~20 s.
- Identifier la base légale citée (article LIR).

### Étape 3 — Question avec contexte client en mode Standard (8 min)

**Question type** :

> "Mon client est une SARL holding LU détenant 95 % d'une filiale
> opérationnelle française. Il envisage de payer un dividende à l'unique
> associé personne physique résident LU. Quelle est l'option fiscale
> optimale ?"

- Joindre éventuellement les statuts en PDF.
- Sélectionner **mode Standard** + **type Comparateur**.
- Lire le tableau comparatif des options.

### Étape 4 — Lecture des flags et niveaux de confiance (5 min)

- Identifier au moins un flag de chaque couleur dans la réponse.
- Repérer le niveau de confiance affiché (CERTAIN / PROBABLE /
  À CONFIRMER).
- Voir PRO-802 pour la sémantique complète.

### Étape 5 — Export PDF + archivage (5 min)

- Cliquer sur **⋯ → Exporter PDF**.
- Vérifier le footer "Document généré par Agent Fiscal IA — révision
  GSL requise".
- Sauvegarder dans le dossier mandat (DMS).

## Conseils pratiques

- **Soyez précis dans la question** : régime visé, exercice fiscal,
  forme juridique, nationalité des associés. Plus le prompt est précis,
  plus la réponse est utile.
- **Mentionnez le contexte client** : type de mandat, secteur, taille.
  L'agent adapte le ton et le niveau de détail.
- **Joignez le PDF si disponible** : statuts, bilan, déclaration
  précédente. L'agent y détecte souvent des opportunités fiscales que
  vous n'auriez pas cherchées.
- **Ne copiez jamais une réponse directement vers le client** : voir
  PRO-803.

## Évaluation

À la fin de la session, le collaborateur doit avoir :

- [x] Posé au moins 2 questions fiscales luxembourgeoises.
- [x] Utilisé au moins 2 modes différents.
- [x] Exporté une réponse en PDF.
- [x] Repéré au moins un flag coloré et un niveau de confiance.

## Références

- [ADR-017 — Architecture IA Agent Fiscal GSL](../decisions/adr-017-agent-fiscal-ia)
- PRO-801 — Agent Fiscal IA : guide collaborateur
- PRO-802 — Workflow validation peer et Knowledge Base
- PRO-803 — Gouvernance IA et confidentialité client
- F-AF-02 — Maîtriser les modes Rapide / Standard / Approfondi$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min, visibility = EXCLUDED.visibility,
  content = EXCLUDED.content, updated_at = now();

-- ------------------------------------------------------------
-- 7. F-AF-02 — Maîtriser les modes Rapide / Standard / Approfondi
-- ------------------------------------------------------------
INSERT INTO public.formations (number, slug, title, duration_min, visibility, content)
VALUES (
  'F-AF-02', 'f-af-02-modes-reponse',
  'F-AF-02 — Maîtriser les modes Rapide / Standard / Approfondi', 20, 'all',
  $md$> **Durée de la session** : 20 min | **Visibilité** : tous les collaborateurs

# F-AF-02 — Maîtriser les modes Rapide / Standard / Approfondi

## Objectif

Choisir à coup sûr le bon mode de réponse de l'Agent Fiscal IA selon le
cas d'usage : économiser du temps sur les questions simples, mobiliser
toute la puissance de l'extended thinking pour les dossiers complexes.

## Tableau comparatif des 3 modes

| Critère                  | 🟢 Rapide       | 🟡 Standard      | 🔴 Approfondi     |
|--------------------------|----------------|------------------|-------------------|
| **Latence**              | ~20 s          | 1–2 min          | 3–5 min           |
| **Tokens raisonnement**  | Faible         | Moyen            | Élevé             |
| **Coût indicatif**       | €              | €€               | €€€               |
| **Profondeur**           | Réponse directe | Analyse structurée | Raisonnement multi-étapes |
| **Peer validation**      | Optionnelle    | Recommandée      | Quasi-obligatoire |
| **Cas type**             | Vérif. ponctuelle | Mémo de travail | Contentieux, planning |

## Quand utiliser **Rapide** (~20 s)

**Cas d'usage**

- Vérification rapide d'une référence légale.
- Question fermée avec une réponse factuelle attendue.
- Rappel d'un taux, d'un seuil, d'une date.
- Première vue d'ensemble avant d'aller plus loin.

**Exemples de questions**

> "Quel est le taux de TVA réduit applicable aux livres au Luxembourg
> en 2025 ?"

> "À quelle date doit être déposée la déclaration IRC 500 pour
> l'exercice 2024 ?"

> "Une plus-value sur cession de participation qualifiée est-elle
> exonérée d'IRC selon l'art. 166 LIR ?"

## Quand utiliser **Standard** (1–2 min)

**Cas d'usage**

- Analyse courante sur un client connu, dossier de complexité moyenne.
- Mémo de travail pour préparer une discussion.
- Comparaison entre 2 options classiques.
- Lecture critique d'un document (PDF joint).

**Exemples de questions**

> "Mon client SARL HoldCo détient 30 % d'une opérationnelle, il envisage
> de descendre à 8 %. Impact fiscal côté HoldCo et côté associé ?"

> "Voici les statuts d'une nouvelle SOPARFI [PDF joint] : quelles sont
> les obligations déclaratives pour le premier exercice ?"

> "Compare le régime LITL des intérêts notionnels et le régime PEX pour
> une holding LU détenant > 10 % en filiale UE."

## Quand utiliser **Approfondi** (3–5 min)

**Cas d'usage**

- Dossier complexe : restructuration, fusion, scission, apport en nature.
- Contentieux fiscal (avant rédaction d'une réponse à l'administration).
- Planning fiscal pluriannuel (prix de transfert, sortie de cycle,
  liquidation).
- Question sans précédent direct, où l'agent doit construire un
  raisonnement à partir de plusieurs sources.

**Exemples de questions**

> "Restructuration : un groupe luxembourgeois avec une HoldCo LU,
> une OpCo FR et une SubCo BE souhaite remonter la SubCo BE directement
> sous HoldCo LU. Étapes fiscales, neutralité, risques de redressement
> dans chaque juridiction ? [statuts + bilan joints]"

> "L'administration luxembourgeoise conteste la déductibilité d'une
> redevance intra-groupe versée à une filiale chypriote, en s'appuyant
> sur les principes de l'art. 56 LIR et la doctrine OECD. Préparer une
> réponse argumentée."

> "Plan fiscal 5 ans pour la sortie progressive d'un actionnaire
> minoritaire d'une OpCo industrielle LU, avec optimisation de la
> plus-value et préservation du régime PEX pour la HoldCo."

## Choisir vite : arbre de décision

```
La question tient-elle en une phrase + réponse factuelle ?
├── OUI → Rapide
└── NON → S'agit-il d'un dossier client multi-paramètres ?
         ├── NON → Standard
         └── OUI → Y a-t-il contentieux / restructuration / planning ?
                  ├── NON → Standard
                  └── OUI → Approfondi
```

## Erreurs fréquentes

- **Tout passer en Approfondi "par sécurité"** : explose le coût et la
  latence, sans valeur ajoutée sur les questions simples.
- **Vouloir un contentieux en Rapide** : la réponse sera incomplète,
  l'agent ne creusera pas la jurisprudence.
- **Oublier de joindre les pièces** en mode Approfondi : on perd 80 %
  de l'intérêt du mode (la lecture critique des documents).

## Références

- [ADR-017 — Architecture IA Agent Fiscal GSL](../decisions/adr-017-agent-fiscal-ia)
- PRO-801 — Agent Fiscal IA : guide collaborateur
- PRO-802 — Workflow validation peer et Knowledge Base
- F-AF-01 — Onboarding Agent Fiscal IA (30 min)$md$
)
ON CONFLICT (number) DO UPDATE SET
  slug = EXCLUDED.slug, title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min, visibility = EXCLUDED.visibility,
  content = EXCLUDED.content, updated_at = now();
