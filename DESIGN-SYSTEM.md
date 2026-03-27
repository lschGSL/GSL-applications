# GSL Design System — Charte graphique

> Reference complete pour toutes les applications de l'ecosysteme GSL.
> A utiliser dans Bank Extractor, POS Extractor, et toute nouvelle app.

---

## 1. Couleurs de marque

### Couleurs principales

| Token | Hex | Usage |
|-------|-----|-------|
| **GSL Red** | `#e62a34` | Couleur primaire, boutons CTA, liens, focus rings |
| **GSL Blue** | `#67b9e8` | Couleur secondaire, graphiques, accents |
| **GSL Dark** | `#212326` | Texte fonce, titres |
| **GSL Gray** | `#434549` | Texte secondaire, sous-titres |

### Palette complete — Light mode

| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| `background` | `#ffffff` | `--color-background` | Fond de page |
| `foreground` | `#1a1a1f` | `--color-foreground` | Texte principal |
| `card` | `#ffffff` | `--color-card` | Fond des cartes |
| `card-foreground` | `#1a1a1f` | `--color-card-foreground` | Texte des cartes |
| `popover` | `#ffffff` | `--color-popover` | Fond des popovers/dropdowns |
| `primary` | `#e62a34` | `--color-primary` | Boutons, liens, accents |
| `primary-foreground` | `#ffffff` | `--color-primary-foreground` | Texte sur primary |
| `secondary` | `#f2f2f4` | `--color-secondary` | Boutons secondaires, badges |
| `secondary-foreground` | `#434549` | `--color-secondary-foreground` | Texte sur secondary |
| `muted` | `#f2f2f4` | `--color-muted` | Fonds subtils, hover |
| `muted-foreground` | `#71717a` | `--color-muted-foreground` | Texte desactive, placeholders |
| `accent` | `#f2f2f4` | `--color-accent` | Hover states, active states |
| `accent-foreground` | `#434549` | `--color-accent-foreground` | Texte sur accent |
| `destructive` | `#e62a34` | `--color-destructive` | Erreurs, suppressions |
| `border` | `#e4e4e7` | `--color-border` | Bordures, separateurs |
| `input` | `#e4e4e7` | `--color-input` | Bordures des inputs |
| `ring` | `#e62a34` | `--color-ring` | Focus ring |

### Palette complete — Dark mode

| Token | Hex | CSS Variable |
|-------|-----|-------------|
| `background` | `#141617` | `--color-background` |
| `foreground` | `#f2f2f4` | `--color-foreground` |
| `card` | `#1e1f22` | `--color-card` |
| `card-foreground` | `#f2f2f4` | `--color-card-foreground` |
| `popover` | `#1e1f22` | `--color-popover` |
| `primary` | `#e62a34` | `--color-primary` |
| `secondary` | `#2a2b2e` | `--color-secondary` |
| `secondary-foreground` | `#f2f2f4` | `--color-secondary-foreground` |
| `muted` | `#2a2b2e` | `--color-muted` |
| `muted-foreground` | `#a1a1aa` | `--color-muted-foreground` |
| `accent` | `#2a2b2e` | `--color-accent` |
| `border` | `#3a3b3e` | `--color-border` |
| `input` | `#3a3b3e` | `--color-input` |

### Sidebar

| Token | Light | Dark |
|-------|-------|------|
| `sidebar-background` | `#fafafa` | `#1a1b1e` |
| `sidebar-foreground` | `#434549` | `#f2f2f4` |
| `sidebar-primary` | `#e62a34` | `#e62a34` |
| `sidebar-accent` | `#f2f2f4` | `#2a2b2e` |
| `sidebar-border` | `#e4e4e7` | `#3a3b3e` |

### Couleurs de graphiques

| Token | Hex | Usage |
|-------|-----|-------|
| `chart-1` | `#e62a34` | Rouge (primaire) |
| `chart-2` | `#67b9e8` | Bleu |
| `chart-3` | `#cad510` | Jaune-vert |
| `chart-4` | `#f5a055` | Orange |
| `chart-5` | `#434549` | Gris |

### Couleurs de statut

| Statut | Fond | Texte light | Texte dark |
|--------|------|-------------|------------|
| **Success** | `emerald-500/15` | `emerald-700` | `emerald-400` |
| **Warning** | `amber-500/15` | `amber-700` | `amber-400` |
| **Destructive** | `#e62a34` | `#ffffff` | `#ffffff` |

### Couleurs des banques (Bank Extractor)

| Banque | Background | Foreground |
|--------|-----------|------------|
| BGL BNP Paribas | `#009a44` | `#ffffff` |
| Banque de Luxembourg | `#1a3a5c` | `#c5a55a` |
| Spuerkeess (BCEE) | `#e30613` | `#ffffff` |
| BIL | `#003399` | `#ffffff` |
| Raiffeisen | `#006633` | `#ffcc00` |
| POST Finance | `#004899` | `#ffcc00` |

---

## 2. Typographie

### Police

```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
```

**Inter** est la police principale. Pas d'import Google Fonts necessaire — elle est resolue via le system-ui fallback de Tailwind.

### Tailles de texte

| Classe | Taille | Ligne | Usage |
|--------|--------|-------|-------|
| `text-xs` | 12px | 16px | Labels, badges, hints |
| `text-sm` | 14px | 20px | Corps de texte, boutons, inputs |
| `text-base` | 16px | 24px | Titres de cartes |
| `text-lg` | 18px | 28px | Sous-titres |
| `text-xl` | 20px | 28px | Titres de section |
| `text-2xl` | 24px | 32px | Titres de page (cartes) |
| `text-3xl` | 30px | 36px | Titres principaux |
| `text-5xl` | 48px | 1 | Hero titre |

### Poids

| Classe | Poids | Usage |
|--------|-------|-------|
| `font-medium` | 500 | Boutons, labels, texte courant important |
| `font-semibold` | 600 | Titres, badges, noms |
| `font-bold` | 700 | Titres principaux (h1) |

### Espacement des lettres

| Classe | Usage |
|--------|-------|
| `tracking-tight` | Titres principaux (h1, hero) |
| `tracking-wider` | Labels uppercase (table headers) |
| `leading-none` | Titres de cartes |

---

## 3. Espacement et mise en page

### Border radius

| Classe | Valeur | Usage |
|--------|--------|-------|
| `rounded-sm` | 2px | Items de dropdown |
| `rounded-md` | 6px | Dropdowns, popovers |
| `rounded-lg` | 8px | Inputs, badges de statut |
| `rounded-xl` | 12px | Cartes |
| `rounded-full` | 9999px | Boutons, badges, avatars |

**Note** : `--radius: 0.625rem` (10px) est le rayon par defaut.

### Ombres

| Classe | Usage |
|--------|-------|
| `shadow-sm` | Boutons, cartes |
| `shadow-md` | Dropdowns, popovers |
| `shadow-lg` | Modals |
| `shadow-xl` | Panneaux lateraux (slide-over) |

### Grille et layout

```
Container: container mx-auto px-4
Grid responsive: grid gap-6 md:grid-cols-2 lg:grid-cols-3
Stack: space-y-8 (sections), space-y-4 (elements), space-y-2 (form fields)
```

---

## 4. Composants

### Boutons

```
Base: inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium
```

| Variant | Classes | Apparence |
|---------|---------|-----------|
| `default` | `bg-primary text-primary-foreground shadow-sm hover:bg-primary/90` | Rouge GSL, texte blanc |
| `destructive` | `bg-destructive text-destructive-foreground shadow-sm` | Rouge, texte blanc |
| `outline` | `border border-input bg-background shadow-sm hover:bg-accent` | Bordure grise, fond transparent |
| `secondary` | `bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80` | Gris clair |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` | Transparent, hover gris |
| `link` | `text-primary underline-offset-4 hover:underline` | Texte rouge, souligne au hover |

| Taille | Hauteur | Padding |
|--------|---------|---------|
| `default` | 40px (h-10) | px-4 py-2 |
| `sm` | 36px (h-9) | px-3, text-xs |
| `lg` | 44px (h-11) | px-8 |
| `icon` | 40x40px | — |

**Forme** : `rounded-full` (boutons en pilule)

### Badges

```
Base: inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
```

| Variant | Apparence |
|---------|-----------|
| `default` | Rouge GSL, texte blanc |
| `secondary` | Gris clair, texte gris fonce |
| `destructive` | Rouge, texte blanc |
| `outline` | Bordure uniquement |
| `success` | Fond emeraude 15%, texte vert |
| `warning` | Fond ambre 15%, texte orange |

### Cartes

```
Container: rounded-xl border bg-card text-card-foreground shadow-sm
Header: flex flex-col space-y-1.5 p-6
Title: text-2xl font-semibold leading-none tracking-tight
Description: text-sm text-muted-foreground
Content: p-6 pt-0
Footer: flex items-center p-6 pt-0
```

### Inputs

```
Base: h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
Focus: ring-2 ring-ring ring-offset-2
Disabled: opacity-50 cursor-not-allowed
Placeholder: text-muted-foreground
```

### Avatars

```
Container: h-10 w-10 rounded-full overflow-hidden
Fallback: bg-muted text-sm font-medium (centered)
```

### Dropdowns

```
Container: rounded-md border bg-popover shadow-md min-w-[8rem] p-1
Item: px-2 py-1.5 text-sm rounded-sm gap-2 cursor-pointer
Item hover: bg-accent text-accent-foreground
Separator: h-px bg-muted my-1
Animation: fade + zoom (95%) + slide from edge
```

### Panneaux lateraux (slide-over)

```
Backdrop: fixed inset-0 z-40 bg-black/50
Panel: fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l bg-background shadow-xl
Header: sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4
Content: p-6 space-y-6
```

### Tables

```
Container: w-full (dans une Card avec p-0)
Header: border-b bg-muted/50
Header cell: px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground
Body row: hover:bg-muted/30 transition-colors cursor-pointer
Body cell: px-4 py-4 text-sm
```

### Modals

```
Backdrop: fixed inset-0 z-50 flex items-center justify-center bg-black/50
Content: Card w-full max-w-lg mx-4
```

---

## 5. Icones

**Librairie** : lucide-react v0.474.0

Tailles standard :
| Contexte | Classe |
|----------|--------|
| Inline text | `h-4 w-4` |
| Boutons | `h-4 w-4` (avec `mr-2`) |
| Cards/features | `h-5 w-5` ou `h-6 w-6` |
| Empty states | `h-12 w-12` |

---

## 6. Dark mode

- Gere par `next-themes` avec `attribute="class"`
- Theme par defaut : `system` (detecte les preferences OS)
- Toggle via `ThemeToggle` component
- Toutes les couleurs ont une variante dark (voir section 1)
- Custom variant CSS : `@custom-variant dark (&:is(.dark *))`

---

## 7. CSS complet (globals.css)

A copier dans toute nouvelle app GSL :

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme {
  --color-background: #ffffff;
  --color-foreground: #1a1a1f;
  --color-card: #ffffff;
  --color-card-foreground: #1a1a1f;
  --color-popover: #ffffff;
  --color-popover-foreground: #1a1a1f;
  --color-primary: #e62a34;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f2f2f4;
  --color-secondary-foreground: #434549;
  --color-muted: #f2f2f4;
  --color-muted-foreground: #71717a;
  --color-accent: #f2f2f4;
  --color-accent-foreground: #434549;
  --color-destructive: #e62a34;
  --color-destructive-foreground: #ffffff;
  --color-border: #e4e4e7;
  --color-input: #e4e4e7;
  --color-ring: #e62a34;
  --color-chart-1: #e62a34;
  --color-chart-2: #67b9e8;
  --color-chart-3: #cad510;
  --color-chart-4: #f5a055;
  --color-chart-5: #434549;
  --color-sidebar-background: #fafafa;
  --color-sidebar-foreground: #434549;
  --color-sidebar-primary: #e62a34;
  --color-sidebar-primary-foreground: #ffffff;
  --color-sidebar-accent: #f2f2f4;
  --color-sidebar-accent-foreground: #434549;
  --color-sidebar-border: #e4e4e7;
  --color-sidebar-ring: #e62a34;
  --radius: 0.625rem;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --color-gsl-red: #e62a34;
  --color-gsl-blue: #67b9e8;
  --color-gsl-dark: #212326;
  --color-gsl-gray: #434549;
}

@layer base {
  .dark {
    --color-background: #141617;
    --color-foreground: #f2f2f4;
    --color-card: #1e1f22;
    --color-card-foreground: #f2f2f4;
    --color-popover: #1e1f22;
    --color-popover-foreground: #f2f2f4;
    --color-primary: #e62a34;
    --color-primary-foreground: #ffffff;
    --color-secondary: #2a2b2e;
    --color-secondary-foreground: #f2f2f4;
    --color-muted: #2a2b2e;
    --color-muted-foreground: #a1a1aa;
    --color-accent: #2a2b2e;
    --color-accent-foreground: #f2f2f4;
    --color-destructive: #e62a34;
    --color-destructive-foreground: #ffffff;
    --color-border: #3a3b3e;
    --color-input: #3a3b3e;
    --color-ring: #e62a34;
    --color-sidebar-background: #1a1b1e;
    --color-sidebar-foreground: #f2f2f4;
    --color-sidebar-primary: #e62a34;
    --color-sidebar-primary-foreground: #ffffff;
    --color-sidebar-accent: #2a2b2e;
    --color-sidebar-accent-foreground: #f2f2f4;
    --color-sidebar-border: #3a3b3e;
    --color-sidebar-ring: #e62a34;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

---

## 8. Dependencies requises

```json
{
  "dependencies": {
    "next": "^16.2.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.49.1",
    "@supabase/ssr": "^0.6.1",
    "next-themes": "^0.4.6",
    "lucide-react": "^0.474.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@radix-ui/react-toast": "^1.2.6"
  },
  "devDependencies": {
    "typescript": "^5.8.2",
    "@tailwindcss/postcss": "^4.0.14",
    "tailwindcss": "^4.0.14",
    "postcss": "^8.5.3"
  }
}
```

---

## 9. Securite (headers HTTP)

```typescript
headers: [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
]
```

---

## 10. Utility function `cn()`

Combine `clsx` + `tailwind-merge` pour la composition de classes :

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

A copier dans `src/lib/utils.ts` de chaque app.
