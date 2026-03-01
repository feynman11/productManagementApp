# UI/UX: Tailwind CSS v4 + Shadcn UI

## Overview

The UI layer uses **Tailwind CSS v4** with the `@tailwindcss/vite` plugin and **Shadcn UI** components. All configuration is CSS-first -- there is no `tailwind.config.ts` or `postcss.config.js`.

## Setup

### Dependencies

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.395.0",
    "tw-animate-css": "latest"
  },
  "devDependencies": {
    "tailwindcss": "^4.1.18",
    "@tailwindcss/vite": "^4.1.18"
  }
}
```

### Vite Configuration

```typescript
// vite.config.ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart(),
    viteReact(),
  ],
  ssr: {
    noExternal: ['@clerk/tanstack-react-start'],
  },
})
```

### Shadcn components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/app.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "~/components",
    "utils": "~/lib/utils",
    "ui": "~/components/ui",
    "lib": "~/lib",
    "hooks": "~/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Utility Function

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Global Stylesheet

The complete `src/styles/app.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Key Differences from Tailwind v3

| Aspect | Tailwind v3 | Tailwind v4 |
|--------|------------|------------|
| Config | `tailwind.config.ts` | CSS `@theme inline` |
| Imports | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Colors | HSL channels (`0 0% 100%`) | OKLCH (`oklch(1 0 0)`) |
| Dark mode | `darkMode: "class"` in JS | `@custom-variant dark` in CSS |
| Animations | `tailwindcss-animate` plugin | `tw-animate-css` (CSS import) |
| Vite plugin | `@tailwindcss/postcss` | `@tailwindcss/vite` |

## Dark Mode

### ThemeProvider Component

```typescript
// src/components/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

const ThemeProviderContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({ theme: 'system', setTheme: () => null })

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'productplan-theme',
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light'
      root.classList.add(sys)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme: (t: Theme) => { localStorage.setItem(storageKey, t); setTheme(t) },
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeProviderContext)
```

## Component Library

### Initial Shadcn Components

Install these first:

```bash
bunx shadcn@latest init
bunx shadcn@latest add button input dialog card table dropdown-menu select form toast alert-dialog sidebar
```

### Component Patterns

All Shadcn v4 components use:
- `React.ComponentProps<>` instead of `React.forwardRef`
- `data-slot` attributes for styling hooks
- OKLCH colors via CSS variables
- `tw-animate-css` for animations

## Layout Structure

```
┌──────────────────────────────────────────────┐
│ Header (UserButton, OrgSwitcher, ThemeToggle)│
├──────────┬───────────────────────────────────┤
│          │                                   │
│ Sidebar  │         Main Content              │
│          │                                   │
│ - Dash   │   ┌───────────────────────────┐   │
│ - Prods  │   │  Module-specific content  │   │
│ - Ideas  │   │                           │   │
│ - Road   │   │                           │   │
│ - Issues │   └───────────────────────────┘   │
│ - Set    │                                   │
│          │                                   │
└──────────┴───────────────────────────────────┘
```

- Responsive: sidebar collapses to hamburger menu on mobile
- Consistent navigation across all client pages
- Super Admin has a separate layout without the product sidebar

## Client Branding (Future)

CSS variables allow per-client branding by overriding `--primary` and related tokens at runtime:

```typescript
// Applied in ClientLayout based on client settings
document.documentElement.style.setProperty('--primary', client.brandColor)
```
