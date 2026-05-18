-- Seed data for the procedures module.
-- Run manually via Supabase SQL Editor to populate two example procedures
-- and validate the end-to-end rendering. Not part of the numbered migration
-- sequence (idempotent on slug — safe to re-run).

insert into public.procedures (number, slug, title, category, summary, content, version, owner, status)
values
  (
    'PRO-DAH-001',
    'pro-dah-001',
    'Accès au Dashboard Rentabilité GSL',
    'portal',
    'Attribution des droits d''accès au module Dashboard Rentabilité dans Odoo (3 niveaux : Direction, Manager, Collaborateur).',
    E'## 1. Objectif\n\nPermettre à un collaborateur d''accéder au menu **Rentabilité GSL** dans Odoo.\n\n## 2. Prérequis\n\n- Accès administrateur Odoo actif\n- Collaborateur avec compte Odoo existant\n\n## 3. Niveaux d''accès\n\n| Groupe | Périmètre |\n|---|---|\n| Direction | Toutes les companies |\n| Manager | Ses projets uniquement |\n| Collaborateur | Son activité personnelle |\n\n## 4. Procédure\n\n1. Settings → Users → sélectionner l''utilisateur\n2. Onglet **Other** → section GSL Dashboard\n3. Cocher le groupe approprié → Sauvegarder → F5',
    '1.0',
    'Luc Schmitt',
    'published'
  ),
  (
    'PRO-601',
    'pro-601',
    'Mise à jour des coûts horaires (hourly_cost)',
    'rh',
    'Procédure semestrielle (janvier + juillet) de mise à jour des coûts horaires collaborateurs dans Odoo, sur base du dossier KeyPaye.',
    E'## 1. Déclencheur\n\nÀ réception du dossier KeyPaye de Julien Gourdeau (janvier et juillet).\n\n## 2. Base de calcul\n\n1 872 h/an = 2 080h - 208h (26j congés x 8h)\n\nCoût horaire = Coût employeur annuel / 1 872\n\n## 3. Procédure Odoo\n\n1. GSL Dashboard → Contrôle coûts horaires\n2. Vérifier les alertes (hourly_cost = 0 ou > 6 mois)\n3. Mettre à jour manuellement chaque collaborateur',
    '1.0',
    'Luc Schmitt',
    'published'
  )
on conflict (slug) do nothing;
