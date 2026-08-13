---
title: Enforce Semantic Color Tokens and Dark Mode via Design System Variables
impact: HIGH
impactDescription: Prevents hardcoded hex colors and enables seamless theme switching across the UI.
tags: ui, tailwindcss, design-system, dark-mode, css-variables
---

## Enforce Semantic Color Tokens and Dark Mode via Design System Variables

**Impact: HIGH (Enables seamless dark mode theme switching and centralized color token management)**

Hardcoding raw hex color strings (`bg-[#1e293b]`, `text-[#0f172a]`) across components makes theme toggling impossible and breaks design system consistency when colors change.

Use **Semantic Design Tokens** mapped to CSS variables (e.g. `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`) configured in Tailwind CSS and index CSS files.

**Incorrect (Hardcoding explicit hex colors inline):**

```tsx
// ❌ Bad: Hardcoded hex colors prevent dark mode theme transitions
export function Card() {
  return (
    <div className="bg-[#ffffff] text-[#0f172a] border-[#e2e8f0] border p-4 shadow">
      <h2 className="text-[#3b82f6]">Title</h2>
    </div>
  );
}
```

**Correct (Semantic CSS variables with HSL color tokens):**

```css
/* index.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --muted-foreground: 215 20.2% 65.1%;
    --border: 217.2 32.6% 17.5%;
  }
}
```

```tsx
// ✅ Good: Component uses semantic design system token utilities
export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
```

Reference: [shadcn/ui - Theming Guide](https://ui.shadcn.com/docs/theming)
