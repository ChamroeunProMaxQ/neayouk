---
title: Create Type-Safe Component Variants using `cva` and `cn` Utilities
impact: HIGH
impactDescription: Prevents dynamic Tailwind CSS class string concatenation bugs and specificity conflicts.
tags: ui, tailwindcss, cva, clsx, class-variance-authority
---

## Create Type-Safe Component Variants using `cva` and `cn` Utilities

**Impact: HIGH (Eliminates Tailwind class specificity collisions and string interpolation bugs)**

Concatenating Tailwind CSS utility strings dynamically with template literals (`className={\`btn \${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'} \${className}\`}`) creates Tailwind class specificity conflicts (e.g. `p-4` conflicting with `p-2`) and produces untyped variant props.

Use **Class Variance Authority (`cva`)** to define structured, type-safe component variants, and merge runtime class overrides safely using `cn(...)` (`clsx` + `tailwind-merge`).

**Incorrect (Fragile string concatenation prone to specificity bugs):**

```tsx
// ❌ Bad: Static string concatenation fails when duplicate utilities collide (e.g. px-4 vs px-2)
export function Button({ variant, className }: { variant: string; className?: string }) {
  const baseClasses = 'inline-flex items-center px-4 py-2 rounded';
  const variantClass = variant === 'primary' ? 'bg-primary text-white' : 'bg-secondary text-black';

  return <button className={`${baseClasses} ${variantClass} ${className}`} />;
}
```

**Correct (Type-safe `cva` variant definitions and `cn` helper):**

```typescript
// 1. Shared Class Merging Utility (shared/lib/utils.ts)
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 2. Component Variant Definition (components/ui/badge.tsx)
import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.25',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
```

Reference: [Class Variance Authority Documentation](https://cva.style/docs)
