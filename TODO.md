# TODO.md — GSL Applications Portal

> Etat complet du projet au 30 mars 2026.

---

## Phase 1 — Securite critique ✅ COMPLETE

- [x] MFA/2FA (TOTP) — QR code enrollment, verification post-login, page settings
- [x] Politique de mots de passe — 12 chars, majuscule, chiffre, special + indicateur visuel
- [x] Timeout de session — 30 min inactivite, avertissement 2 min avant
- [x] Rate limiting — 5 login / 3 signup / 3 forgot-password par 15 min par IP
- [x] Bandeau MFA dashboard — rappel pour les users sans 2FA
- [ ] IP whitelisting admin (optionnel, non prioritaire)

---

## Phase 2 — Experience collaborateur GSL ✅ COMPLETE

- [x] Notifications email (Resend) — demande d'acces, acces accorde/revoque, invitation
- [x] Invitations utilisateur — admin invite avec role/entite predefini
- [x] Creation directe d'utilisateurs — admin cree un compte avec email/password/role
- [x] Recherche et filtres — apps (recherche + acces), users (role/entity/status), audit log (action)
- [x] Multi-entite GSL — champ entity sur profiles et applications (Fiduciaire/Revision)
- [x] Icones des applications — auto-generees via ui-avatars.com + icon_url personnalisable
- [x] i18n FR/EN/DE — ~300 cles par locale, toutes pages et composants traduits
- [x] Panneau detail apps — slide-over avec edit, archive, delete, visibility, entity
- [x] FilterBar reutilisable — chips cliquables, URL params, composable avec recherche

---

## Phase 3 — Portail client / documents ✅ COMPLETE

- [x] Espace client securise — role `client`, dashboard simplifie, redirect auto
- [x] Upload/download documents — Supabase Storage, PDF/Excel/images, max 50MB
- [x] Dossiers par mandat/exercice — type (bilan, TVA, salaires, general, other) + annee
- [x] Gestion admin des clients — page /admin/clients + panneau detail avec docs
- [x] DocumentBrowser — navigation dossiers, breadcrumbs, tableau fichiers, icones MIME
- [x] Approve/reject documents — workflow admin avec badges de statut
- [x] Demandes de documents — workflow email GSL → client → upload → review
- [x] Notifications client — email quand doc approuve/rejete
- [x] Signatures electroniques simples — SHA-256, password re-verification, audit trail
- [x] Multi-signataires — admin envoie doc a plusieurs signataires, chacun signe independamment
- [x] Demande de signature — admin clique "Envoyer pour signature", client recoit email
- [ ] **Audit trail client** — le client voit qui a consulte/telecharge ses documents et quand
- [ ] **Integration LuxTrust** — signature qualifiee eIDAS (necessite contrat LuxTrust)
- [ ] **Integration DocuSign** — alternative a LuxTrust (necessite compte DocuSign)
- [ ] **Notifications in-app** — centre de notifications dans le portail (pas juste email)

---

## Phase 4 — Ops & monitoring ✅ COMPLETE

- [x] Health check endpoint `/api/health` — DB check, latency, version (SHA commit)
- [x] Export audit log CSV — download complet, UTF-8 BOM pour Excel
- [x] Analytics dashboard — 8 stats, activite 24h/7j, top apps, logins recents
- [x] Webhooks Slack/Teams — 5 types d'events, fire-and-forget, dual support
- [ ] **Monitoring uptime** — integration avec UptimeRobot ou Vercel monitoring
- [ ] **Alertes email automatiques** — quand health check echoue
- [ ] **Logs structures** — integration avec un service de logging (Vercel Logs, Axiom)

---

## Phase 5 — Integration applications ✅ COMPLETE

- [x] Bank Extractor — SSO, catalogue, acces auto, domaine bank.gsl.lu
- [x] POS Extractor — integration existante dans le catalogue
- [x] GSL News — integration existante dans le catalogue
- [x] Agent Fiscal — SSO, catalogue, acces auto
- [ ] **XML Invoice Converter** — a integrer quand pret (slug: `xml-invoice-converter`)
- [ ] **Domaine custom Agent Fiscal** — configurer agent-fiscal.gsl.lu (DNS + Vercel)
- [ ] **Domaine custom POS Extractor** — configurer pos.gsl.lu (DNS + Vercel)

---

## Phase 6 — Ameliorations futures (non planifie)

### UX / UI
- [ ] Pagination page Users (actuellement pas de pagination)
- [ ] Theme personnalise par entite (Fiduciaire vs Revision)
- [ ] Notifications in-app (badge + centre de notifications)
- [ ] Dashboard client ameliore (stats, activite recente, graphiques)
- [ ] Mode offline / PWA
- [ ] Recherche globale (Cmd+K) dans le portail

### Securite
- [ ] IP whitelisting admin
- [ ] Logs de connexion visibles par l'utilisateur
- [ ] Detection de connexion suspecte (nouveau device, geo inhabituelle)
- [ ] Content Security Policy (CSP) strict
- [ ] Rate limiting Redis (au lieu de in-memory) pour multi-instance

### Documents
- [ ] Audit trail client (qui a consulte quoi)
- [ ] Versionning de documents (historique des versions)
- [ ] Commentaires sur les documents
- [ ] Preview PDF dans le navigateur (sans telecharger)
- [ ] Archivage automatique des anciens documents
- [ ] Templates de dossiers par type de client

### Signatures
- [ ] Integration LuxTrust (signature qualifiee eIDAS)
- [ ] Integration DocuSign
- [ ] Certificat de signature PDF genere (resume, horodatage, hash)
- [ ] Rappels automatiques pour signatures en attente

### Admin
- [ ] Tableau de bord admin ameliore (graphiques, tendances)
- [ ] Gestion des roles plus granulaire (permissions par feature)
- [ ] Bulk actions (desactiver/activer/inviter plusieurs users)
- [ ] Import/export utilisateurs CSV
- [ ] Parametres portail editables en UI (pas juste env vars)

### Integration
- [ ] API publique du portail (REST ou GraphQL) pour apps externes
- [ ] Webhook configurable par l'admin (pas juste env vars)
- [ ] SSO SAML/OIDC pour clients enterprise
- [ ] Integration Microsoft 365 / Google Workspace

### Infrastructure
- [ ] Domaine apps.gsl.lu — ajouter aux Supabase redirect URLs
- [ ] CI/CD pipeline (tests automatises avant deploy)
- [ ] Staging environment
- [ ] Database backups automatises
- [ ] CDN pour les assets statiques

---

## Domaines configures

| Domaine | Projet | Statut |
|---------|--------|--------|
| `apps.gsl.lu` | GSL Portal | ✅ Active |
| `bank.gsl.lu` | Bank Extractor | ✅ Active |
| `gsl-applications.vercel.app` | GSL Portal | ✅ Active |
| `gsl-bank-extractor.vercel.app` | Bank Extractor | ✅ Active |
| `gsl-agent-fiscal.vercel.app` | Agent Fiscal | ✅ Active |
| `gsl-pos-extractor.vercel.app` | POS Extractor | ✅ Active |
| `gsl-news-portal.vercel.app` | GSL News | ✅ Active |

---

## Migrations executees

| # | Migration | Statut |
|---|-----------|--------|
| 001 | Schema initial (profiles, apps, access, audit, RLS) | ✅ |
| 002 | Seed GSL News | ✅ |
| 003 | Multi-entite (entity sur profiles + applications) | ✅ |
| 004 | Invitations (token, role, entity, expiry) | ✅ |
| 005 | Icones par defaut (ui-avatars.com) | ✅ |
| 006 | Client role + document_folders + documents + RLS | ✅ |
| 007 | Document requests (workflow GSL → client) | ✅ |
| 008 | Document signatures + signature_required/signed_at | ✅ |
| 009 | Signature requests (multi-signataires) | ✅ |
| 010 | Seed Bank Extractor + grant all users | ✅ |
| 011 | Seed Agent Fiscal + grant all users | ✅ |

---

## Services externes configures

| Service | Statut | Notes |
|---------|--------|-------|
| Supabase (Auth + DB + Storage) | ✅ | Projet `kwjgfljzdgpfyqknakmy` |
| Vercel (hosting) | ✅ | 4 projets deployes |
| Resend (email) | ✅ | Domaine `gsl.lu` verifie, DKIM + SPF |
| Slack webhooks | ✅ | Channel configure |
| DNS vo.lu | ✅ | CNAME apps + bank configures |
| Supabase Storage bucket `documents` | ✅ | Prive, pas de restriction MIME |
| Supabase Redirect URLs | ✅ | Portal + Bank Extractor + Agent Fiscal |
