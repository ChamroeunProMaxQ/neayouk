---
name: prefer-shadcn-ui
description: Enforce using shadcn/ui components instead of vanilla HTML elements in React components whenever possible. Provides element-to-component mappings, form integration rules, and CLI auto-installation directives.
---

# Prefer shadcn/ui Over Vanilla HTML

This skill enforces preferring **shadcn/ui** components over native, vanilla HTML elements when building or refactoring React components. Modern UI applications benefit from consistent accessibility (ARIA), keyboard navigation, theme variable support, and unified design tokens provided by shadcn/ui primitives.

---

## Core Directives

1. **Never use raw form inputs or interactive native HTML elements** (`<button>`, `<input>`, `<textarea>`, `<select>`, `<option>`, `<label>`, `<dialog>`, `<table>`, `<hr>`, `<progress>`) when a shadcn/ui component exists or can be added.
2. **Auto-addition / Installation**: If a required shadcn component is missing from `@/components/ui/` (or the project's component path), run the shadcn CLI to generate it:
   ```bash
   npx shadcn@latest add <component-name>
   ```
3. **Form Integration**: Integrate shadcn form controls with `react-hook-form` and `@hookform/resolvers/zod` using the `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormDescription>`, and `<FormMessage>` pattern.
4. **Radix & Accessibility**: Retain underlying Radix UI primitive props for keyboard navigation, focus trap, dynamic positioning, and screen reader announcements.
5. **Theme Consistency**: Utilize CSS variables (`bg-background`, `text-foreground`, `bg-muted`, `bg-primary`, etc.) instead of hardcoded hex colors or direct inline styles.

---

## Vanilla HTML to shadcn/ui Component Mapping

| Vanilla HTML Element / Pattern | shadcn/ui Component | Component Import Path | Notes & Variants |
|---|---|---|---|
| `<button>` | `Button` | `@/components/ui/button` | Use `variant` (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and `size` (`default`, `sm`, `lg`, `icon`) |
| `<input type="text/email/password/number">` | `Input` | `@/components/ui/input` | Wrap in `<FormItem>` / `<FormControl>` inside forms |
| `<textarea>` | `Textarea` | `@/components/ui/textarea` | Supports auto-resize, custom rows |
| `<select>` / `<option>` | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` | `@/components/ui/select` | Provides custom styled dropdowns with Radix accessibility |
| `<input type="checkbox">` | `Checkbox` | `@/components/ui/checkbox` | Accessible checkbox primitive |
| `<input type="radio">` | `RadioGroup`, `RadioGroupItem` | `@/components/ui/radio-group` | Type-safe group state |
| `<input type="checkbox">` (toggle style) | `Switch` | `@/components/ui/switch` | On/off toggle switch control |
| `<input type="range">` | `Slider` | `@/components/ui/slider` | Custom range slider component |
| `<dialog>` / Modal div overlay | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` | `@/components/ui/dialog` | Accessible overlay modal with backdrop |
| `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | `@/components/ui/table` | Flexible data grid styling (integrate with TanStack Table for data operations) |
| `<hr>` | `Separator` | `@/components/ui/separator` | Supports `orientation="horizontal\|vertical"` |
| `<label>` | `Label` | `@/components/ui/label` | Accessible label tied to input fields |
| `<progress>` | `Progress` | `@/components/ui/progress` | Animated progress indicator bar |
| `<details>` / `<summary>` | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | `@/components/ui/accordion` | Smooth expanding collapse content |
| `title="..."` attribute or tooltip div | `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` | `@/components/ui/tooltip` | Accessible hover popover tooltip |
| `<span>` tag / badge box | `Badge` | `@/components/ui/badge` | Small pill badge for status/tags (`default`, `secondary`, `destructive`, `outline`) |
| `<img>` user avatar / profile pic | `Avatar`, `AvatarImage`, `AvatarFallback` | `@/components/ui/avatar` | User profile avatar with fallback initials |
| Loading placeholder div | `Skeleton` | `@/components/ui/skeleton` | Pulse loading placeholder skeleton |
| Alert box / banner | `Alert`, `AlertTitle`, `AlertDescription` | `@/components/ui/alert` | Callout alerts (`default`, `destructive`) |
| Tabbed navigation panels | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `@/components/ui/tabs` | Accessible tab switcher |
| Card layout container `<div>` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `@/components/ui/card` | Structured container shell |

---

## Code Examples: Anti-Pattern vs Recommended Pattern

### 1. Buttons

❌ **Incorrect (Vanilla HTML)**:
```tsx
<button 
  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" 
  onClick={handleSubmit}
>
  Submit Order
</button>
```

✅ **Correct (shadcn/ui)**:
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="default" onClick={handleSubmit}>
  Submit Order
</Button>
```

---

### 2. Form Input Fields with Labels

❌ **Incorrect (Vanilla HTML)**:
```tsx
<div className="flex flex-col gap-1">
  <label htmlFor="email" className="text-sm font-medium">Email Address</label>
  <input 
    type="email" 
    id="email" 
    placeholder="user@example.com" 
    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
  />
</div>
```

✅ **Correct (shadcn/ui + Label/Input)**:
```tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

<div className="grid gap-2">
  <Label htmlFor="email">Email Address</Label>
  <Input type="email" id="email" placeholder="user@example.com" />
</div>
```

---

### 3. Select Dropdowns

❌ **Incorrect (Vanilla HTML)**:
```tsx
<select className="border rounded p-2 text-sm">
  <option value="light">Light Theme</option>
  <option value="dark">Dark Theme</option>
  <option value="system">System Preference</option>
</select>
```

✅ **Correct (shadcn/ui Select)**:
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select defaultValue="light">
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select theme" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="light">Light Theme</SelectItem>
    <SelectItem value="dark">Dark Theme</SelectItem>
    <SelectItem value="system">System Preference</SelectItem>
  </SelectContent>
</Select>
```

---

### 4. Dialog / Modal Windows

❌ **Incorrect (Vanilla HTML `<dialog>` or custom state Modal `<div>`)**:
```tsx
{isOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg max-w-md w-full">
      <h3 className="text-lg font-semibold">Confirm Action</h3>
      <p className="text-sm text-gray-600 mt-2">Are you sure you want to proceed?</p>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
      </div>
    </div>
  </div>
)}
```

✅ **Correct (shadcn/ui Dialog)**:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>Are you sure you want to proceed?</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={onConfirm}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## When Native HTML is Permissible

The following native semantic tags remain appropriate when structuring layout and typography, provided they are styled with Tailwind design tokens:
- **Structural Containers**: `<div>`, `<section>`, `<header>`, `<footer>`, `<main>`, `<aside>`, `<article>`, `<nav>`
- **Typography & Content**: `<h1>` - `<h6>`, `<p>`, `<span>`, `<ul>`, `<ol>`, `<li>`, `<code>`, `<pre>`
- **Media**: `<img>` (or `next/image`), `<svg>`, `<video>`, `<audio>`

However, if a dedicated component like `Card`, `Badge`, `Avatar`, `Skeleton`, or `Separator` fits the UI pattern, prioritize the shadcn/ui primitive over raw styled HTML elements.
