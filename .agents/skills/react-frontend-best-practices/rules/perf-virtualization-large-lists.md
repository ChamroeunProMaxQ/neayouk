---
title: Virtualize Large Data Lists and Tables using Windowing Techniques
impact: MEDIUM-HIGH
impactDescription: Prevents rendering thousands of un-visible DOM nodes, avoiding browser DOM freeze.
tags: performance, virtualization, list-windowing, tanstack-virtual
---

## Virtualize Large Data Lists and Tables using Windowing Techniques

**Impact: MEDIUM-HIGH (Prevents browser UI freeze when rendering 500+ list elements)**

Attempting to render thousands of DOM nodes simultaneously inside a list or data table overloads the browser's DOM engine, causing severe scrolling lag, high memory consumption, and tab unresponsiveness.

Use **Virtual Scrolling / Windowing** (e.g. TanStack Virtual) to render *only* the slice of items currently visible within the container scroll viewport.

**Incorrect (Rendering 5,000 DOM nodes simultaneously):**

```tsx
// ❌ Bad: Renders 5,000 <div> items directly into DOM, freezing browser scroll
export function UnvirtualizedList({ items }: { items: Product[] }) {
  return (
    <div className="h-[500px] overflow-auto">
      {items.map((item) => (
        <div key={item.id} className="h-[50px] p-2 border-b">
          {item.name} - ${item.price}
        </div>
      ))}
    </div>
  );
}
```

**Correct (Virtual list windowing with TanStack Virtual):**

```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedList({ items }: { items: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  // 1. Configure virtualizer instance
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Height in pixels per item row
    overscan: 5, // Buffer rows rendered outside viewport bounds
  });

  return (
    <div
      ref={parentRef}
      className="h-[500px] w-full overflow-auto rounded-md border"
    >
      {/* 2. Total container height based on calculated virtual dimensions */}
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {/* 3. Render ONLY visible virtual items positioned absolutely */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index]!;
          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 top-0 w-full border-b p-3"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">${item.price}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Reference: [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
