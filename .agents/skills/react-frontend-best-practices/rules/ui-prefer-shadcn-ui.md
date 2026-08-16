# Prefer shadcn/ui Over Vanilla HTML Elements

This rule enforces using **shadcn/ui** components over native vanilla HTML elements when building or refactoring React UI components.

---

## Core Directives

1. **No Raw Form Controls**: Avoid raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>`, `<table>`, `<progress>`, `<hr>` when shadcn/ui components exist.
2. **Auto-Installation**: Install missing components via CLI (`npx shadcn@latest add <component>`).
3. **Radix Primitives & Accessibility**: Retain accessibility, focus trap, and ARIA primitives provided by Radix/shadcn.
4. **Theme Design Tokens**: Use CSS variables (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`) for styling consistency.
