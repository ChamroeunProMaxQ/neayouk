---
title: Define Explicit Component Prop Interfaces and Generics
impact: HIGH
impactDescription: Prevents type errors when consuming generic components like DataTables, Selects, and Lists.
tags: typescript, generics, components, props
---

## Define Explicit Component Prop Interfaces and Generics

**Impact: HIGH (Guarantees component interface type safety and reusable generic components)**

Components that handle arbitrary item lists (like custom Select dropdowns, DataTables, or Autocomplete inputs) should leverage TypeScript generics to ensure that selection callbacks receive exact item types without type casting.

Always declare explicit `Props` interfaces and use generic component signatures (`function Select<T extends { id: string }>(...)`).

**Incorrect (Loose non-generic component accepting `any` items):**

```tsx
// ❌ Bad: Item is any, so onChange callback loses type safety
interface SelectProps {
  items: any[];
  onSelect: (item: any) => void;
}

export function Select({ items, onSelect }: SelectProps) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} onClick={() => onSelect(item)}>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

**Correct (Generic type-safe component):**

```tsx
// ✅ Good: Generic component maintaining item type contract
export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectProps<T extends SelectOption> {
  items: readonly T[];
  selectedId?: string;
  onSelect: (item: T) => void;
  renderCustomLabel?: (item: T) => React.ReactNode;
}

export function Select<T extends SelectOption>({
  items,
  selectedId,
  onSelect,
  renderCustomLabel,
}: SelectProps<T>) {
  return (
    <ul role="listbox" className="divide-y rounded-md border">
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <li
            key={item.id}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(item)}
            className={cn(
              'cursor-pointer p-3 text-sm hover:bg-accent',
              isSelected && 'bg-accent font-medium text-accent-foreground'
            )}
          >
            {renderCustomLabel ? renderCustomLabel(item) : item.label}
          </li>
        );
      })}
    </ul>
  );
}
```

Reference: [React TypeScript Cheatsheet - Generics](https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#generic-components)
