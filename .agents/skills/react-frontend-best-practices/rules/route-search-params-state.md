---
title: Synchronize Search and Filter UI State with URL Query Parameters
impact: MEDIUM-HIGH
impactDescription: Enables bookmarking, URL sharing, and browser back/forward history navigation for filtered views.
tags: routing, react-router, search-params, URL-state
---

## Synchronize Search and Filter UI State with URL Query Parameters

**Impact: MEDIUM-HIGH (Enables shareable deep links and accurate browser history navigation)**

Storing search filters, pagination offsets, tab selections, or sort directions only in local `useState` breaks bookmarking and URL sharing—users cannot send links to exact search result pages, and clicking the browser "Back" button resets all active filters.

Synchronize search and filter state directly with the URL query parameters using React Router's `useSearchParams` hook.

**Incorrect (Filter state isolated in useState):**

```tsx
// ❌ Bad: Filtering state lost on refresh or link sharing
export function ProductCatalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  return <FilterUI search={search} category={category} />;
}
```

**Correct (Syncing filter state with `useSearchParams`):**

```tsx
import { useSearchParams } from 'react-router-dom';

export function ProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params (single source of truth)
  const searchQuery = searchParams.get('q') ?? '';
  const selectedCategory = searchParams.get('category') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');

  const updateFilters = (newFilters: { q?: string; category?: string; page?: number }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newFilters.q !== undefined) {
        newFilters.q ? next.set('q', newFilters.q) : next.delete('q');
      }
      if (newFilters.category !== undefined) {
        newFilters.category !== 'all' ? next.set('category', newFilters.category) : next.delete('category');
      }
      if (newFilters.page !== undefined) {
        next.set('page', String(newFilters.page));
      }
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <Input
        value={searchQuery}
        onChange={(e) => updateFilters({ q: e.target.value, page: 1 })}
        placeholder="Search products..."
      />
      <Select
        value={selectedCategory}
        onValueChange={(cat) => updateFilters({ category: cat, page: 1 })}
      >
        <SelectItem value="all">All Categories</SelectItem>
        <SelectItem value="electronics">Electronics</SelectItem>
      </Select>
    </div>
  );
}
```

Reference: [React Router - useSearchParams](https://reactrouter.com/en/main/hooks/use-search-params)
