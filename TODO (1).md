# TODO — GSL Agent Fiscal IA
> Mis à jour : 30 mars 2026 | Commit : 8e72c08

---

## 🔴 P1 — Cette semaine

- [ ] **Layout GSL Fiduciaire** (instruction A overnight)
  - Écran d'accueil charte bleue #5BAFD6
  - Logo GSL intégré
  - Header, sidebar, zone saisie refondus
  
- [ ] **Qualité IA multi-passes** (instruction B overnight)
  - Draft → critique → amélioration
  - Quality badge visible
  - Profils clients persistants
  - Retrieval sémantique sources
  - Grille 12 points system prompt

- [ ] **Mettre à jour CLAUDE.md** (v6.0 → v8.0)
  - Ajouter architecture streaming actuelle
  - Ajouter StreamingText + MarkdownRenderer
  - Ajouter tables Supabase nouvelles
  - Mettre à jour le plan de phases

---

## 🟡 P2 — Avant go live (avril 2026)

- [ ] Workflow validation F1 visible dans l'UI
- [ ] Tests Playwright e2e (markdown render navigateur réel)
- [ ] Export PDF : fix derniers caractères spéciaux
- [ ] Export Word : validation styles finaux
- [ ] Performance : lazy loading sidebar historique
- [ ] Gestion erreurs API robuste (retry automatique)

---

## 🟢 P3 — Post go live

- [ ] Simulateurs fiscaux accessibles depuis les réponses
- [ ] Collaboration multi-utilisateurs (partage de conversation)
- [ ] Responsive mobile complet
- [ ] Opportunités proactives inline (sans cliquer Approfondir)
- [ ] Mode hors-ligne basique (cache dernières réponses)

---

## 📋 BACKLOG

- [ ] **Intégration Odoo.sh**
  - Créer tâches depuis réponse agent
  - Assigner collaborateurs
  - Variables : ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY

- [ ] **LexNow watcher**
  - Créer boîte gsl-lexnow@gsl.lu (IT GSL)
  - Configurer IMAP dans .env.local
  - Configurer Streams LexNow → notifications vers cette boîte
  - Lancer lexnow_watcher.py en production

- [ ] **Veille documentaire automatique**
  - veille_legilux.py — nouvelles lois LIR/TVA/ICC
  - veille_eurlex.py — nouvelles directives UE
  - veille_acd.py — nouvelles circulaires ACD
  - Notifications collaborateurs avec lien de téléchargement

- [ ] **Bloc E — 12 documents internes GSL**
  - Mémos de procédure internes
  - Guides clients GSL
  - Templates déclarations

- [ ] **Embeddings pgvector**
  - Activer extension vector dans Supabase
  - Générer embeddings pour 93 sources
  - Retrieval sémantique réel (pas keyword)

---

## ✅ TERMINÉ

- [x] SSE streaming avec ___METADATA___
- [x] StreamingText (sans flickering)
- [x] MarkdownRenderer (rendu stable)
- [x] Badge confiance + citations cliquables
- [x] Alerte validité sources
- [x] Opportunités fiscales chiffrées
- [x] ThinkingIndicator logo Anthropic
- [x] Export PDF (react-pdf, téléchargement direct)
- [x] Export Word (.docx avec styles)
- [x] Upload et analyse PDF native Anthropic
- [x] Historique conversations + titres auto
- [x] Sidebar groupée par période
- [x] Expand/collapse réponses longues
- [x] 5 simulateurs fiscaux TypeScript
- [x] Admin CRUD questionnaires
- [x] Profils clients (dropdown)
- [x] 5 modes de réponse
- [x] SSO apps.gsl.lu
- [x] 93 sources indexées
- [x] 98 tests Vitest verts
