# Guide d'intégration — GSL Applications Portal

## Objectif

Ce document décrit comment adapter une application existante (ex: GSL POS Extractor) pour qu'elle s'intègre visuellement et techniquement dans le **GSL Applications Portal** hébergé sur `https://apps.gsl.lu`.

L'application intégrée doit :
- Avoir le **même look & feel** que le portail (couleurs, typographie, composants UI)
- Utiliser **Supabase Auth** pour l'authentification (SSO via le portail)
- Être accessible depuis le portail via son URL enregistrée
- Supporter le **dark mode** et le **responsive design**

---

## 1. Stack technique du portail (à respecter)

| Technologie | Version |
|---|---|
| **Next.js** | ^16.2.1 |
| **React** | ^19.0.0 |
| **TypeScript** | ^5.8.2 |
| **Tailwind CSS** | ^4.0.14 |
| **Supabase JS** | ^2.49.1 |
| **Supabase SSR** | ^0.6.1 |
| **Radix UI** | Dernières versions (voir section composants) |
| **lucide-react** | ^0.474.0 (icônes) |
| **next-themes** | ^0.4.6 (dark/light mode) |
| **class-variance-authority** | ^0.7.1 |
| **clsx** | ^2.1.1 |
| **tailwind-merge** | ^3.0.2 |

### Installation des dépendances

```bash
npm install next@^16.2.1 react@^19.0.0 react-dom@^19.0.0 \
  @supabase/supabase-js@^2.49.1 @supabase/ssr@^0.6.1 \
  next-themes@^0.4.6 lucide-react@^0.474.0 \
  class-variance-authority@^0.7.1 clsx@^2.1.1 tailwind-merge@^3.0.2 \
  @radix-ui/react-slot@^1.1.2 @radix-ui/react-dialog@^1.1.6 \
  @radix-ui/react-dropdown-menu@^2.1.6 @radix-ui/react-label@^2.1.2 \
  @radix-ui/react-select@^2.1.6 @radix-ui/react-toast@^1.2.6 \
  @radix-ui/react-tooltip@^1.1.8 @radix-ui/react-tabs@^1.1.3 \
  @radix-ui/react-switch@^1.1.3 @radix-ui/react-separator@^1.1.2 \
  @radix-ui/react-avatar@^1.1.3

npm install -D typescript@^5.8.2 @types/react@^19.0.12 @types/react-dom@^19.0.4 \
  @tailwindcss/postcss@^4.0.14 tailwindcss@^4.0.14 postcss@^8.5.3 \
  eslint@^9.22.0 eslint-config-next@15.2.4
```

---

## 2. Variables d'environnement

Créer un fichier `.env.local` :

```env
# Supabase — MÊME instance que le portail
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GSL POS Extractor

# Portail (pour le lien retour)
NEXT_PUBLIC_PORTAL_URL=https://apps.gsl.lu
```

> **IMPORTANT** : L'application DOIT utiliser la **même instance Supabase** que le portail pour que l'authentification SSO fonctionne. Les clés Supabase doivent être identiques.

---

## 3. Design System — Couleurs et thème

### 3.1 CSS Variables (globals.css)

L'application doit utiliser exactement ces variables CSS pour être cohérente avec le portail :

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  /* GSL Brand Colors */
  --color-gsl-red: #e62a34;
  --color-gsl-blue: #67b9e8;
  --color-gsl-dark: #212326;
  --color-gsl-gray: #434549;

  /* Base Colors */
  --background: #ffffff;
  --foreground: #1a1a1f;
  --card: #ffffff;
  --card-foreground: #1a1a1f;
  --popover: #ffffff;
  --popover-foreground: #1a1a1f;
  --primary: #e62a34;
  --primary-foreground: #ffffff;
  --secondary: #f2f2f4;
  --secondary-foreground: #1a1a1f;
  --muted: #f2f2f4;
  --muted-foreground: #71717a;
  --accent: #f2f2f4;
  --accent-foreground: #1a1a1f;
  --destructive: #e62a34;
  --destructive-foreground: #ffffff;
  --border: #e4e4e7;
  --input: #e4e4e7;
  --ring: #e62a34;

  /* Chart Colors */
  --chart-1: #e62a34;
  --chart-2: #67b9e8;
  --chart-3: #cad510;
  --chart-4: #f5a055;
  --chart-5: #434549;

  /* Sidebar */
  --sidebar-background: #fafafa;
  --sidebar-foreground: #434549;
  --sidebar-primary: #e62a34;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f2f2f4;
  --sidebar-accent-foreground: #1a1a1f;
  --sidebar-border: #e4e4e7;
  --sidebar-ring: #e62a34;

  /* Border Radius */
  --radius: 0.625rem;
}

.dark {
  --background: #141617;
  --foreground: #f2f2f4;
  --card: #1e1f22;
  --card-foreground: #f2f2f4;
  --popover: #1e1f22;
  --popover-foreground: #f2f2f4;
  --primary: #e62a34;
  --primary-foreground: #ffffff;
  --secondary: #2a2b2e;
  --secondary-foreground: #f2f2f4;
  --muted: #2a2b2e;
  --muted-foreground: #a1a1aa;
  --accent: #2a2b2e;
  --accent-foreground: #f2f2f4;
  --destructive: #cc2230;
  --destructive-foreground: #ffffff;
  --border: #3a3b3e;
  --input: #3a3b3e;
  --ring: #e62a34;

  --chart-1: #e62a34;
  --chart-2: #67b9e8;
  --chart-3: #cad510;
  --chart-4: #f5a055;
  --chart-5: #9ca3af;

  --sidebar-background: #1a1b1e;
  --sidebar-foreground: #a1a1aa;
  --sidebar-primary: #e62a34;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #2a2b2e;
  --sidebar-accent-foreground: #f2f2f4;
  --sidebar-border: #3a3b3e;
  --sidebar-ring: #e62a34;
}

/* Base Styles */
body {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  background-color: var(--background);
  color: var(--foreground);
}
```

### 3.2 Couleur primaire

La couleur principale de GSL est **rouge `#e62a34`**. Elle est utilisée pour :
- Les boutons primaires
- Les liens actifs dans la sidebar
- Les accents visuels
- Le focus ring des inputs

### 3.3 Typographie

- **Police** : `Inter` (avec fallback `system-ui`)
- **Tailles** : utiliser les classes Tailwind standard (`text-xs`, `text-sm`, `text-base`, etc.)
- **Border radius** : `0.625rem` (les boutons utilisent `rounded-full`, les cards `rounded-xl`)

---

## 4. Composants UI réutilisables

L'application doit utiliser les mêmes composants UI que le portail. Voici les composants à copier depuis le portail :

### 4.1 Utilitaire `cn()` — `/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-LU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
```

### 4.2 Button — `/src/components/ui/button.tsx`

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-full px-3 text-xs",
        lg: "h-11 rounded-full px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### 4.3 Input — `/src/components/ui/input.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

### 4.4 Card — `/src/components/ui/card.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### 4.5 Badge — `/src/components/ui/badge.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

---

## 5. Authentification Supabase

### 5.1 Client Supabase côté serveur — `/src/lib/supabase/server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components (read-only)
          }
        },
      },
    }
  );
}
```

### 5.2 Client Supabase côté navigateur — `/src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 5.3 Route d'échange de tokens — `/src/app/auth/exchange/route.ts`

> **CRITIQUE** : Cette route doit exister dans votre application. C'est elle qui reçoit les tokens du portail et établit la session locale.

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_PORTAL_URL}/login?message=Missing authentication tokens`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_PORTAL_URL}/login?message=Could not authenticate`
    );
  }

  // Redirige vers la page principale de l'application
  return NextResponse.redirect(`${origin}/`);
}
```

### 5.4 Middleware d'authentification — `/src/middleware.ts`

> **IMPORTANT** : Le middleware DOIT exclure `/auth/exchange` de la vérification d'authentification. Sans cela, le middleware redirige la requête AVANT que le route handler ne puisse traiter les tokens, causant une boucle de redirection vers le portail.

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes qui NE nécessitent PAS d'authentification
const publicPaths = ["/auth/exchange", "/api"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  // Ne PAS bloquer les routes publiques (surtout /auth/exchange !)
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  if (isPublicPath) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rediriger vers le portail si non authentifié
  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_PORTAL_URL}/login?redirect=${encodeURIComponent(request.nextUrl.toString())}`
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

> **Note** : Si l'utilisateur n'est pas authentifié, il est redirigé vers la page de login du **portail** (`apps.gsl.lu/login`), pas vers une page de login locale. Le portail envoie ensuite l'utilisateur vers `/auth/exchange` avec les tokens pour établir la session.

---

## 6. Layout de l'application

### 6.1 Structure recommandée

L'application intégrée n'a **pas besoin** de sidebar ni de navigation complète (c'est le portail qui gère ça). Elle a besoin :
- D'un **header minimaliste** avec le nom de l'app et un lien retour vers le portail
- Du **theme provider** pour le dark mode
- D'un **main content area** responsive

### 6.2 Root Layout — `/src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GSL POS Extractor",
  description: "Extract and analyze POS data",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 6.3 Theme Provider — `/src/components/theme-provider.tsx`

```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### 6.4 Theme Toggle — `/src/components/theme-toggle.tsx`

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

### 6.5 App Header recommandé

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <a href={process.env.NEXT_PUBLIC_PORTAL_URL || "https://apps.gsl.lu"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portal
          </a>
        </Button>
        <span className="text-sm font-semibold text-foreground">
          GSL POS Extractor
        </span>
      </div>
      <ThemeToggle />
    </header>
  );
}
```

---

## 7. Base de données — Tables du portail

L'application peut lire les tables du portail via Supabase (même instance). Voici les types TypeScript :

```typescript
// /src/types/database.ts

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "manager" | "member" | "viewer";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  icon_url: string | null;
  visibility: "internal" | "external" | "both";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppAccess {
  id: string;
  user_id: string;
  app_id: string;
  granted_by: string | null;
  granted_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
```

---

## 8. Configuration Next.js

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
};

export default nextConfig;
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### postcss.config.mjs

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

---

## 9. Structure de fichiers recommandée

```
src/
├── app/
│   ├── layout.tsx              # Root layout avec ThemeProvider
│   ├── globals.css             # Variables CSS GSL (section 3.1)
│   ├── page.tsx                # Page principale de l'app
│   └── api/                    # Routes API de l'app
├── components/
│   ├── ui/                     # Composants UI copiés du portail
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── app-header.tsx          # Header avec lien retour portail
├── lib/
│   ├── utils.ts                # cn() helper
│   └── supabase/
│       ├── client.ts           # Client navigateur
│       └── server.ts           # Client serveur
├── types/
│   └── database.ts             # Types Supabase
└── middleware.ts                # Auth middleware
```

---

## 10. Checklist d'intégration

- [ ] **Stack** : Next.js 16+ / React 19 / Tailwind 4
- [ ] **Couleurs** : Variables CSS GSL copiées (section 3.1)
- [ ] **Police** : Inter avec fallback system-ui
- [ ] **Composants UI** : Button, Input, Card, Badge identiques au portail
- [ ] **Boutons** : `rounded-full`, couleur primaire `#e62a34`
- [ ] **Cards** : `rounded-xl` avec border et shadow-sm
- [ ] **Dark mode** : Supporté via `next-themes` et classes CSS `.dark`
- [ ] **Responsive** : Mobile-first, breakpoints Tailwind standards
- [ ] **Auth** : Même instance Supabase, middleware de session
- [ ] **Header** : Lien retour vers `apps.gsl.lu`
- [ ] **Security headers** : X-Frame-Options, HSTS, etc.
- [ ] **Env vars** : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PORTAL_URL`
- [ ] **Icônes** : lucide-react uniquement
- [ ] **Dates** : Format `fr-LU` via `formatDate()` helper

---

## 11. Ce qu'il ne faut PAS faire

- **Ne pas** créer de page login/register dans l'app — l'auth est gérée par le portail
- **Ne pas** utiliser une instance Supabase différente
- **Ne pas** utiliser des couleurs ou polices différentes du design system GSL
- **Ne pas** utiliser Material UI, Ant Design, ou d'autres librairies UI — uniquement Radix UI + Tailwind
- **Ne pas** utiliser Font Awesome ou d'autres packs d'icônes — uniquement `lucide-react`
- **Ne pas** hardcoder des couleurs — utiliser les variables CSS (`bg-primary`, `text-muted-foreground`, etc.)
- **Ne pas** ignorer le dark mode — tester les deux thèmes
