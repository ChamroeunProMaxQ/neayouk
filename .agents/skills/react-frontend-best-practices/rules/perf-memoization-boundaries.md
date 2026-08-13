---
title: Apply `useMemo`, `useCallback`, and `React.memo` at Costly Render Boundaries
impact: MEDIUM-HIGH
impactDescription: Prevents wasteful recalculations and unnecessary re-renders of heavy downstream components.
tags: performance, react, memoization, useMemo, useCallback
---

## Apply `useMemo`, `useCallback`, and `React.memo` at Costly Render Boundaries

**Impact: MEDIUM-HIGH (Eliminates expensive computation bottlenecking during render cycles)**

Sprinkling `useMemo` and `useCallback` on cheap 2-line functions adds overhead without performance gains. Conversely, failing to memoize heavy filter/sort calculations or failing to wrap large static child components in `React.memo` causes UI jank when parent state updates.

Apply memoization purposefully:
1. **`useMemo`**: Wrap expensive data transformations (e.g. sorting/filtering 1,000+ items or computing heavy statistics).
2. **`useCallback`**: Memoize callback function references passed as props to components wrapped in `React.memo`.
3. **`React.memo`**: Wrap pure presentation components that render large subtrees or heavy DOM elements.

**Incorrect (Unmemoized heavy array operation re-executed on every render):**

```tsx
// ❌ Bad: Filtering 5,000 items recalculates every time unrelated count state increments
export function ProductGrid({ items }: { items: Product[] }) {
  const [count, setCount] = useState(0);

  // Recalculated on EVERY render!
  const sortedItems = items
    .filter((item) => item.inStock)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ItemList items={sortedItems} />
    </div>
  );
}
```

**Correct (Purposeful `useMemo` and `React.memo` boundaries):**

```tsx
import { useMemo, useCallback, memo } from 'react';

// 1. Pure sub-tree component wrapped in React.memo
export const ItemList = memo(function ItemList({
  items,
  onItemClick,
}: {
  items: readonly Product[];
  onItemClick: (id: string) => void;
}) {
  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.id} onClick={() => onItemClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

// 2. Parent component with memoized calculation and callbacks
export function ProductGrid({ items }: { items: Product[] }) {
  const [count, setCount] = useState(0);

  // ✅ Good: Memoize expensive filter/sort; recalculate ONLY when `items` array reference changes
  const sortedItems = useMemo(() => {
    return items
      .filter((item) => item.inStock)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // ✅ Good: Stable callback reference passed to memoized ItemList
  const handleItemClick = useCallback((id: string) => {
    console.log('Selected item:', id);
  }, []);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <ItemList items={sortedItems} onItemClick={handleItemClick} />
    </div>
  );
}
```

Reference: [React Docs - useMemo](https://react.dev/reference/react/useMemo)
