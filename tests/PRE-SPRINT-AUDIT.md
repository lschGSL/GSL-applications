# PRE-SPRINT AUDIT — Sprint publication 26/05/2026
Généré le : 2026-05-18

Auteur : Claude Code (orchestré par Luc Schmitt)
Branche : `claude/sprint-publication-26mai`
Repo : `C:\Users\LucSchmitt\GSL-applications`
Supabase project : `kwjgfljzdgpfyqknakmy`

---

## 0. Méthode & limites de l'audit

| Source d'audit | Disponible | Détail |
|----------------|-----------|--------|
| Système de fichiers du repo | ✅ Oui | Audit complet réalisé |
| Schéma Supabase **live** | ❌ Non | Voir §7 — aucun outil d'accès DB disponible |
| Historique migrations repo | ✅ Oui | `supabase/migrations/001` → `011` |

**Conséquence importante** : l'inspection du schéma Supabase *en base* (colonnes réelles,
RLS actives, présence de la table `procedures`) n'a **pas pu être réalisée**. Les sections
1 et 2 ci-dessous sont donc reconstituées à partir des **fichiers de migration du repo**,
qui ne reflètent pas forcément l'état réel de la base (cf. §7, ambiguïté majeure n°2).

---

## 1. Tables Supabase pertinentes (d'après les migrations du repo)

> ⚠️ Reconstitué depuis `supabase/migrations/`, **non vérifié en base**.

### Table : `profiles` (migration 001 + 003)
| Colonne | Type | Nullable | Défaut | Contrainte |
|---------|------|----------|--------|-----------|
| id | uuid | non | — | PK, FK → auth.users |
| email | text | non | — | — |
| full_name | text | oui | — | — |
| avatar_url | text | oui | — | — |
| role | text/enum | non | `member` | `admin\|manager\|member\|viewer\|client` |
| entity | text | oui | — | `gsl_fiduciaire\|gsl_revision\|both` |
| is_active | boolean | non | true | — |
| created_at | timestamptz | non | now() | — |
| updated_at | timestamptz | non | now() | — |

→ Pertinent : les policies RLS du sprint s'appuient sur `profiles.role IN ('admin','manager')`.

### Table : `applications` (migration 001 + 003)
Colonnes : `id, name, slug, description, url, icon_url, visibility, entity, is_active, created_at, updated_at`.
Sert de **modèle de référence** pour le pattern CRUD admin (voir §5).

### Table : `procedure_categories`
**N'EXISTE PAS** — aucune migration. À créer (Étape 1).

### Table `procedures` : **STATUT INDÉTERMINÉ**
- Aucune migration `procedures` dans le repo (`001` → `011`).
- Le mot `procedure` n'apparaît dans `001_initial_schema.sql` que dans la syntaxe
  Postgres `EXECUTE PROCEDURE` (triggers), **pas** comme table.
- **MAIS** le brief affirme que `PRO-DAH-001` et `PRO-601` sont « déjà en base ».
- → Une table `procedures` existe donc probablement **en base, hors historique de migration repo**.
- → Son schéma exact est **inconnu** (impossible à lister, cf. §7). **Delta avec le schéma cible non calculable.**

---

## 2. RLS Policies actives

❌ **Non vérifiable** — pas d'accès au schéma live (cf. §7).

D'après les migrations repo (`001`, `006`…), le projet utilise systématiquement RLS
(`ENABLE ROW LEVEL SECURITY` sur toutes les tables). Le brief prévoit pour les nouvelles tables :
- Lecture : `authenticated` (`USING (true)`)
- Écriture : `admin` + `manager` via sous-requête `profiles`

Statut lecture publique : **NON** (réservé `authenticated`).
Statut admin_only en écriture : **OUI** (`admin`/`manager`).
Ces policies sont **à créer** ; rien ne les bloque côté repo.

---

## 3. Sidebar actuelle

### Fichier : `src/components/layout/sidebar.tsx`
Structure : 3 tableaux de navigation déclarés en tête de fichier —
- `navigation` (3 entrées : dashboard, applications, security)
- `adminNavigation` (7 entrées : userManagement, clientManagement, appManagement, auditLog, authLogs, analytics, settings)
- `clientNavigation` (2 entrées : myDocuments, security)

Chaque entrée = `{ key: "nav.xxx", href, icon }`. Icônes `lucide-react`.
Le groupe admin ne s'affiche que si `role ∈ {admin, manager}`.

### Fichier : `src/components/layout/mobile-sidebar.tsx`
**Identique** : les trois mêmes tableaux sont **dupliqués** à l'identique. Toute entrée
ajoutée à la sidebar desktop doit être ajoutée **aussi** ici (pas de source partagée).

Clés i18n utilisées (toutes via `nav.*`) : `main, administration, dashboard, applications,
security, userManagement, clientManagement, appManagement, auditLog, authLogs, analytics,
settings, myDocuments`.

→ Ajout prévu : `{ key: "nav.procedures", href: "/admin/procedures", icon: BookOpen }`
dans `adminNavigation` des **deux** fichiers.

### Système i18n
Fichiers de traduction : `src/lib/i18n/locales/{fr,en,de}.json` (fr = défaut).
Moteur : `src/lib/i18n/index.ts` — fonction `t(dict, key)` qui découpe la clé sur `.`
et **parcourt des objets imbriqués**. Les clés de nav sont donc dans un objet `"nav": { … }`,
**pas** des clés plates `"nav.xxx"`.

Clés `nav.*` existantes : voir liste ci-dessus (identiques dans fr/en/de).
Clés **manquantes** pour ce sprint : `nav.procedures` (et, si Partie 2 :
`nav.decisions`, `nav.formations`).

→ **Système extensible sans refactoring** : il suffit d'ajouter une clé dans l'objet `nav`
des 3 fichiers JSON. Ambiguïté **mineure** seulement.

---

## 4. Routes `/procedures/`, `/decisions/`, `/formations/`

Recherche dans `src/app/(portal)/` :
- `/procedures/` → **ABSENT**
- `/decisions/` → **ABSENT**
- `/formations/` → **ABSENT**

→ **Aucun conflit de routes.** Champ libre pour la structure cible.

---

## 5. Page admin `/admin/procedures`

**N'EXISTE PAS.** Routes admin actuelles : `users`, `clients`, `apps`, `audit-log`,
`auth-logs`, `analytics`, `settings`, `users/import`.

Pattern à réutiliser (référence : `src/app/api/admin/apps/route.ts`) :
- API route : `import { createClient } from "@/lib/supabase/server"`
- Auth : `supabase.auth.getUser()` → 401 si absent
- Autorisation : `select role from profiles where id = user.id` → 403 si `role ∉ {admin,manager}`
- Mutations loguées dans `audit_logs` (action, resource_type, resource_id, ip, user_agent)
- `(portal)/layout.tsx` ne protège **que** l'authentification ; les pages admin se
  protègent **au niveau page** (confirmé CLAUDE.md).

→ La page `/admin/procedures` est à **créer intégralement** (Étape 2).

---

## 6. Migrations existantes

Format `NNN_description.sql` dans `supabase/migrations/` :

| Fichier | Description |
|---------|-------------|
| 001_initial_schema.sql | Profiles, applications, app_access, audit_logs, RLS, triggers |
| 002_seed_gsl_news_app.sql | Seed GSL News |
| 003_multi_entity.sql | Colonne `entity` |
| 004_invitations.sql | Table invitations |
| 005_default_app_icons.sql | Icônes par défaut |
| 006_client_documents.sql | Rôle client, document_folders, documents |
| 007_document_requests.sql | Demandes de documents |
| 008_document_signatures.sql | Signatures électroniques |
| 009_signature_requests.sql | Multi-signataires |
| 010_seed_bank_extractor.sql | Seed Bank Extractor |
| 011_seed_agent_fiscal.sql | Seed Agent Fiscal |

Trigger `updated_at` du projet : fonction **`public.update_updated_at()`** (déjà définie
en 001 — CLAUDE.md insiste : ce n'est PAS `update_updated_at_column()`).
→ La migration du sprint doit **réutiliser** `update_updated_at()` plutôt que créer
un doublon `set_updated_at()` (le brief propose `set_updated_at()` — divergence mineure,
résolution proposée : réutiliser l'existante).

Le brief demande un fichier `20260518_sprint_26mai.sql` (format date Supabase) — diffère
du format `NNN_` du repo. CLAUDE.md note d'ailleurs : « Futur : migrer vers format
Supabase `YYYYMMDDHHMMSS_…` ». → Acceptable, ambiguïté mineure.

---

## 7. Ambiguïtés détectées

### Ambiguïtés MAJEURES

**1. Aucun outil d'accès à la base Supabase live — opérations DB impossibles**
- Le brief impose : « Utiliser le Supabase MCP pour toutes les opérations DB ».
- Constat : **aucun MCP Supabase n'est installé** dans cet environnement Claude Code
  (seuls Gmail / Google Calendar / Google Drive sont présents).
- Supabase CLI : **non installé** ; `npx supabase` refuse de l'installer (pas de mode YES).
- `psql` : **non installé**.
- Tentative d'accès via l'API Management Supabase (`api.supabase.com`, token présent dans
  `.env.local`) : **refusée par le classifieur de permissions** — motif : le brief impose
  explicitement le passage par le MCP, un appel `curl` direct contourne cette contrainte.
- **Impact** : impossible de lister le schéma réel, d'appliquer la migration (Étape 1)
  ou d'exécuter le seed (Étape 3).
- **Question pour Luc** : voir « Décision requise » ci-dessous.

**2. Table `procedures` : divergence repo ↔ base, schéma réel inconnu**
- Le brief affirme `PRO-DAH-001` et `PRO-601` « déjà en base », mais **aucune migration
  `procedures`** n'existe dans le repo (`001`→`011`).
- Donc une table `procedures` existe vraisemblablement en base, créée **hors** du
  versioning du repo. Son schéma exact (colonnes, types, contraintes) est **inconnu**.
- **Impact** : impossible de trancher entre **CAS A** (table absente → CREATE) et
  **CAS B** (table partielle → ALTER), ni d'exclure des colonnes incompatibles.
- Règle absolue n°1 du brief : « Ne jamais modifier le schéma de tables existant sans
  avoir d'abord listé les colonnes actuelles » → **bloquant** tant que §7.1 n'est pas levé.
- **Question pour Luc** : voir « Décision requise ».

**3. Ouverture de la PR impossible avec les outils disponibles**
- Le brief impose : « Utiliser le GitHub MCP pour ouvrir la PR ».
- Constat : **aucun MCP GitHub** installé ; `gh` CLI **non installé**.
- `git push` lui-même n'est pas garanti (auth HTTPS à vérifier).
- **Impact** : la PR finale ne peut pas être créée automatiquement.
- **Question pour Luc** : voir « Décision requise ».

> Total ambiguïtés majeures : **3** (toutes d'origine **opérationnelle / outillage**,
> aucune d'origine architecturale). Le seuil de STOP automatique du brief (« > 3 ») n'est
> pas atteint, mais les 3 blocages empêchent l'exécution des Étapes 1 et 3 et de l'ouverture
> de PR telles que spécifiées.

### Ambiguïtés MINEURES

1. **i18n imbriqué** — clés `nav` dans un objet, pas plates. Résolution : ajouter
   `"procedures"` dans l'objet `nav` des 3 JSON. Aucun refactoring.
2. **Fonction trigger** — le brief crée `set_updated_at()`, le repo utilise déjà
   `update_updated_at()`. Résolution proposée : réutiliser `update_updated_at()`.
3. **Nom de fichier migration** — `20260518_sprint_26mai.sql` (format date) vs `NNN_`
   du repo. Résolution : conserver le nom demandé par le brief (cohérent avec la cible
   future documentée dans CLAUDE.md).
4. **Sidebar dupliquée** — `sidebar.tsx` et `mobile-sidebar.tsx` répliquent les tableaux
   de nav. Résolution : modifier les deux fichiers à l'identique.

---

## 8. Verdict

### Architecture : ✅ PROCÉDER
Le code du repo est **parfaitement compatible** avec le plan du sprint :
- aucune route `/procedures` `/decisions` `/formations` en conflit ;
- pas de page `/admin/procedures` existante ;
- sidebar et i18n extensibles sans refactoring ;
- pattern CRUD admin clair et réutilisable (`api/admin/apps`).

### Exécution : ⛔ BLOCAGE OPÉRATIONNEL — validation de Luc requise
Les 3 ambiguïtés majeures (§7) sont **toutes** dues à l'absence des outils imposés par le
brief (Supabase MCP, GitHub MCP) et non à l'architecture. En l'état, il est **impossible** :
- d'inspecter le schéma `procedures` réel (→ règle absolue n°1 non satisfaisable) ;
- d'appliquer la migration (Étape 1) et le seed (Étape 3) en base ;
- d'ouvrir la PR automatiquement.

**Conformément à la règle « Diagnostic complet avant toute modification » et à la règle
absolue n°1, aucune écriture de migration `procedures` ni aucune opération DB n'est
effectuée avant arbitrage de Luc.**

### Décision requise de Luc — 3 options

| Option | Description | Conséquence |
|--------|-------------|-------------|
| **A** | Installer/activer le **Supabase MCP** et le **GitHub MCP** dans Claude Code | Reprise nominale des Étapes 1→3 + PR, comme prévu au brief |
| **B** | Autoriser l'usage de l'**API Management Supabase** + **API GitHub** via les tokens présents dans `.env.local` (ajout d'une règle de permission Bash) | Reprise possible sans MCP, mais hors contrainte « MCP only » du brief |
| **C** | Travail **code uniquement** : Claude écrit le fichier de migration (défensif `CREATE … IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`), l'UI admin et le SQL de seed comme **fichiers** versionnés ; **Luc applique** la migration + seed via le dashboard Supabase et **ouvre la PR** manuellement | Livraison de ~90 % de la valeur sans toucher la base ; Luc garde la main sur la DB |

Pour les options B et C, Luc doit aussi fournir (ou Claude devra inspecter) le **schéma
réel de la table `procedures`** afin de lever l'ambiguïté §7.2 et choisir CAS A vs CAS B
en sécurité.

**→ En attente de l'arbitrage de Luc avant de poursuivre les Étapes 1, 2 et 3.**
