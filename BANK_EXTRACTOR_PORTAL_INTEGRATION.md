# GSL Bank Extractor — Integration avec GSL Apps Portal

## Vue d'ensemble

Le GSL Bank Extractor est deploye en tant qu'application web independante qui s'integre avec le portail GSL Apps pour l'authentification. Ce document decrit tout ce qu'il faut savoir pour configurer l'integration cote portail.

---

## URLs de Production

| Composant | URL |
|-----------|-----|
| **Frontend** | `https://gsl-bank-extractor.vercel.app` |
| **API Backend** | `https://gsl-bank-extractor-production.up.railway.app` |
| **API Health** | `https://gsl-bank-extractor-production.up.railway.app/api/health` |
| **Domaine prevu** | `https://bank.gsl.lu` (a configurer dans Vercel + DNS) |
| **Portail prevu** | `https://apps.gsl.lu` (a deployer) |

---

## Supabase — Projet partage

Le Bank Extractor utilise le **meme projet Supabase** que le portail GSL Apps :

- **Project ID:** `kwjgfljzdgpfyqknakmy`
- **Project URL:** `https://kwjgfljzdgpfyqknakmy.supabase.co`

### Schema ajoute par le Bank Extractor

La migration `supabase/migrations/20260323000000_init_bank_extractor.sql` (deja executee) a cree :

**Table `extraction_jobs` :**
```sql
id uuid primary key
user_id uuid references auth.users(id)  -- lie a l'utilisateur du portail
filename text
file_size bigint
bank text                                -- bgl, bcee, bil, bdl, raiffeisen, post
doc_type text                            -- compte, visa, multiline
status text                              -- done, error
transactions_count int
ok_count int
warning_count int
critical_count int
total_debit numeric(15,2)
total_credit numeric(15,2)
net_balance numeric(15,2)
titulaire text
iban text
currency text default 'EUR'
detection jsonb
error text
created_at timestamptz
updated_at timestamptz
```

**RLS :** Chaque utilisateur ne voit que ses propres jobs (`auth.uid() = user_id`).

**Storage buckets :**
- `bank-pdfs` — PDFs uploades (50 Mo max, RLS par user)
- `bank-exports` — Fichiers Excel generes (50 Mo max, RLS par user)
- `bank-logs` — Logs diagnostiques JSON (10 Mo max, upload server-side via service_role)

### Cles Supabase utilisees

| Cle | Ou | Usage |
|-----|-----|-------|
| **Publishable key** (anon) | Vercel (frontend) | Auth browser, lecture jobs, session management |
| **Secret key** (service_role) | Railway (backend) | Ecriture jobs, upload logs storage |
| **Legacy JWT Secret** | Railway (backend) | Validation des JWT dans les requetes API |

---

## Authentification — Flux complet

### Etat actuel
L'authentification est **temporairement desactivee** dans le middleware du Bank Extractor car le portail `apps.gsl.lu` n'est pas encore deploye.

### Condition a retirer
Dans `web/src/middleware.ts`, la condition suivante bypass l'auth :
```typescript
if (!portalUrl || portalUrl.includes("apps.gsl.lu")) {
    return supabaseResponse; // Skip auth
}
```
**A retirer une fois le portail deploye et operationnel.**

### Flux d'authentification cible

```
Utilisateur visite bank.gsl.lu
        |
        v
Middleware verifie cookie Supabase
        |
   [pas de session]
        |
        v
Redirect vers apps.gsl.lu/login?redirect=https://bank.gsl.lu/
        |
        v
Portail affiche login (email/password, SSO, etc.)
        |
   [auth reussie]
        |
        v
Redirect vers bank.gsl.lu/auth/callback?code=XXX
        |
        v
/auth/callback echange le code pour une session Supabase
        |
        v
Redirect vers / (page d'accueil Bank Extractor)
        |
        v
Les requetes API incluent le JWT dans Authorization: Bearer
        |
        v
Railway API valide le JWT et extrait user_id pour la persistance
```

### Ce que le portail doit fournir

1. **Page de login** (`/login`) qui accepte un parametre `redirect` (URL de retour)
2. **Authentification Supabase** standard (email/password, magic link, ou SSO)
3. **Redirect apres login** vers l'URL `redirect` avec le code d'auth Supabase
4. **Gestion des utilisateurs** dans `auth.users` (le Bank Extractor utilise `auth.uid()` pour les RLS)

---

## Integration dans le Portail — Catalogue d'applications

Le Bank Extractor doit apparaitre dans le catalogue d'applications du portail.

### Donnees a enregistrer

```json
{
  "name": "Bank Extractor",
  "slug": "bank-extractor",
  "description": "Extraction de transactions bancaires depuis des releves PDF luxembourgeois",
  "url": "https://gsl-bank-extractor.vercel.app",
  "icon_url": "/icons/bank-extractor.png",
  "visibility": "internal",
  "is_active": true
}
```

### Acces utilisateurs

Tous les collaborateurs GSL doivent avoir acces au Bank Extractor. L'application ne fait pas de controle d'acces supplementaire — si l'utilisateur est authentifie via Supabase, il peut utiliser l'app.

Si le portail gere des `app_access` granulaires, accorder l'acces a tous les utilisateurs actifs.

---

## API Backend — Reference pour le Portail

Le portail peut optionnellement afficher des stats ou des liens vers le Bank Extractor.

### Health Check
```
GET https://gsl-bank-extractor-production.up.railway.app/api/health
```
Reponse :
```json
{
  "status": "ok",
  "version": "3.3.0",
  "api_version": "1.2.0",
  "ocr_available": true,
  "supabase_connected": true,
  "runtime": "railway"
}
```

### Historique des jobs (via Supabase directement)
Le portail peut lire les jobs d'un utilisateur directement depuis Supabase :
```sql
SELECT * FROM extraction_jobs
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

Ou afficher des stats globales (admin) :
```sql
SELECT bank, COUNT(*) as jobs, SUM(transactions_count) as total_tx
FROM extraction_jobs
WHERE status = 'done'
GROUP BY bank
ORDER BY jobs DESC;
```

---

## Design System — Coherence visuelle

Le Bank Extractor utilise le design system GSL :

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#e62a34` (GSL Red) | `#e62a34` |
| Background | `#ffffff` | `#141617` |
| Card | `#ffffff` | `#1e1f22` |
| Muted | `#f2f2f4` | `#2a2b2e` |
| Border | `#e4e4e7` | `#3a3b3e` |

Le portail devrait utiliser les memes tokens pour une experience coherente.

### Couleurs des banques (pour les badges)
```
BGL BNP Paribas:     bg=#009a44 fg=#ffffff
Banque de Luxembourg: bg=#1a3a5c fg=#c5a55a
Spuerkeess (BCEE):   bg=#e30613 fg=#ffffff
BIL:                 bg=#003399 fg=#ffffff
Raiffeisen:          bg=#006633 fg=#ffcc00
POST Finance:        bg=#004899 fg=#ffcc00
```

---

## Domaine custom — Configuration DNS

### bank.gsl.lu (Bank Extractor frontend)
1. Dans Vercel > Project Settings > Domains > ajouter `bank.gsl.lu`
2. Vercel fournira un CNAME : `cname.vercel-dns.com`
3. Ajouter dans le DNS GSL : `bank.gsl.lu CNAME cname.vercel-dns.com`
4. Mettre a jour `NEXT_PUBLIC_APP_URL` dans Railway : `https://bank.gsl.lu`

### apps.gsl.lu (Portail GSL Apps)
A configurer selon la plateforme de deploiement du portail.

---

## Checklist d'integration

- [ ] Deployer le portail GSL Apps sur `apps.gsl.lu`
- [ ] Configurer la page `/login` avec support du parametre `redirect`
- [ ] Ajouter le Bank Extractor au catalogue d'applications
- [ ] Accorder l'acces a tous les utilisateurs GSL
- [ ] Retirer le bypass d'auth dans `web/src/middleware.ts` du Bank Extractor
- [ ] Configurer le domaine `bank.gsl.lu` (Vercel + DNS)
- [ ] Configurer le domaine `apps.gsl.lu` (portail + DNS)
- [ ] Mettre a jour `NEXT_PUBLIC_APP_URL` dans Railway avec `https://bank.gsl.lu`
- [ ] Tester le flux complet : portail login -> Bank Extractor -> extraction -> export
- [ ] Verifier les RLS : chaque utilisateur ne voit que ses propres jobs

---

## Contact technique

**Repo GitHub :** `lschGSL/gsl-bank-extractor`
**Developpeur :** Luc Schmitt (luc.schmitt@gsl.lu)
**Projet Supabase :** GSL Portal (`kwjgfljzdgpfyqknakmy`)
