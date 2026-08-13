---
title: Extend shadcn/ui Primitives Without Breaking Radix Accessibility
impact: HIGH
impactDescription: Preserves full WAI-ARIA keyboard navigation, screen reader accessibility, and focus management.
tags: ui, shadcn-ui, radix-ui, accessibility, WAI-ARIA
---

## Extend shadcn/ui Primitives Without Breaking Radix Accessibility

**Impact: HIGH (Guarantees screen reader support and keyboard focus accessibility compliance)**

Modifying shadcn/ui component primitives (built on Radix UI) by stripping out ARIA attributes, replacing native trigger buttons with `<div>` click listeners, or overriding focus rings creates accessible compliance failures and breaks keyboard navigation (`Tab`, `Escape`, `Arrow` keys).

Extend shadcn/ui components by wrapping them or composing props while preserving Radix accessibility primitives (e.g. `DialogPrimitive.Root`, `DialogPrimitive.Trigger`, `DialogPrimitive.Content`).

**Incorrect (Stripping Radix accessibility primitives with custom div clicks):**

```tsx
// ❌ Bad: Replacing Radix DialogTrigger with non-accessible div click event
export function BadModal() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div onClick={() => setOpen(true)}>Open Modal</div> {/* Missing role, tabIndex, ARIA */}
      {open && (
        <div className="modal-overlay">
          <div>Modal Content</div>
        </div>
      )}
    </div>
  );
}
```

**Correct (Preserving Radix UI headless accessibility in shadcn/ui wrapper):**

```tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/shared/lib/utils';

// ✅ Good: Accessible Dialog Primitive Extension
export function ConfirmModal({
  title,
  description,
  triggerText,
  onConfirm,
}: {
  title: string;
  description: string;
  triggerText: string;
  onConfirm: () => void;
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        {/* asChild forwards focus ring & ARIA attributes to Button */}
        <Button variant="outline">{triggerText}</Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg bg-background p-6 shadow-lg focus:outline-none">
          <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
            {description}
          </DialogPrimitive.Description>

          <div className="mt-6 flex justify-end gap-3">
            <DialogPrimitive.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogPrimitive.Close>
            <Button onClick={onConfirm}>Confirm</Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

Reference: [Radix UI Accessibility Principles](https://www.radix-ui.com/primitives/docs/overview/accessibility)
