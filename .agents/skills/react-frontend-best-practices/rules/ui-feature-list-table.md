# Feature List Table Best Practices & Architecture

This rule defines the mandatory standards for creating data list table features in the web application (`apps/web/src/features/*`). Every feature list table component MUST strictly adhere to the patterns established in [`user-list-table.tsx`](file:///e:/work/neayouk/apps/web/src/features/users/components/user-list-table.tsx).

---

## Architecture & Directory Structure

A feature list table is part of a modular feature package under `apps/web/src/features/<feature-name>/`:

```
src/features/<feature-name>/
├── components/
│   ├── <entity>-list-table.tsx   # Main container & table presentation component
│   ├── <entity>-form-dialog.tsx  # Create / Edit modal dialog component
│   └── delete-<entity>-dialog.tsx# Deletion confirmation modal component
├── hooks/
│   ├── use-<entities>-query.ts   # Infinite query & standard query TanStack Query hooks
│   └── use-<entity>-mutations.ts # Create, update, and delete mutation hooks
└── index.ts                      # Feature module public exports
```

---

## Mandatory Technical & Architectural Directives

### 1. URL State Synchronization (`useUrlFilters`)
- All list filters (search terms, dropdown filters, sort key, sort order) **MUST** be synchronized with URL query parameters using `useUrlFilters(ZodSchema)`.
- Use the contract schema from `@repo/contracts` (e.g. `FindUsersSchema`) to validate search parameters.
- Text search inputs **MUST** be debounced (using `useDebounce(search, 800)`) before triggering query parameter updates to prevent API request spam.

```tsx
const { values, setValue, setValues } = useUrlFilters(FindEntitySchema);
const { search, entityType, sortBy, sortOrder } = values;

// Debounce search input
const debouncedSearch = useDebounce(search, 800);

// Build memoized query parameters
const queryParams = useMemo(
  () => ({
    ...values,
    search: debouncedSearch,
    pageSize: 20,
  }),
  [debouncedSearch, values]
);
```

### 2. Infinite Scroll Data Fetching (`useInfiniteQuery`)
- Data fetching **MUST** use an infinite query hook (e.g. `useUsersInfiniteQuery`).
- Derive table rows by flattening `data.pages` using `useMemo`:
  ```tsx
  const accumulatedData = useMemo<EntityAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );
  ```
- Attach `sentinelRef` returned by `useInfiniteScroll` to a bottom element right below the table.
- Extract the total item count from `data?.pages[0]?.pagination?.totalCount`.

### 3. Server-Side Sorting via URL & TanStack Table
- Pass `manualSorting: true` to `useReactTable`.
- Implement sorting on column headers using a ghost `Button` that toggles `sortOrder` (`ASC` vs `DESC`) or `sortBy` field via `setValues`:

```tsx
const handleSort = (field: keyof EntityType) => {
  const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
  setValues({
    sortBy: field,
    sortOrder: nextOrder,
  });
};
```

- Column header sort indicator states:
  - `ArrowUp` (ASC) or `ArrowDown` (DESC) in theme green (`#45AC5E`) when column is currently sorted.
  - Neutral `ArrowUpDown` (`text-slate-400`) when column is not sorted.

### 4. Contract Schema & Type Safety (`@repo/contracts`)
- Use types, DTOs, schemas, and enums exported from `@repo/contracts` for:
  - Table row entity attributes (`UserAttribute`)
  - Query parameters (`FindUsersDto`)
  - Status/Role enums (`UserStatusEnum`, `UserTypeEnum`)
  - API endpoint paths (`API_ROUTE`)

### 5. Dialog State & CRUD Mutations Management
- Keep dialog targets in component state (`entityToEdit`, `entityToDelete`, `isFormDialogOpen`, `isDeleteDialogOpen`).
- Separate modal presentation into dedicated components (`<EntityFormDialog>`, `<DeleteEntityDialog>`).
- Submit handlers MUST await mutation calls and reset modal state:
  ```tsx
  const handleFormSubmit = async (formValues: EntityFormValues) => {
    if (entityToEdit) {
      await updateMutation.mutateAsync({ id: entityToEdit.id, dto: formValues });
    } else {
      await createMutation.mutateAsync(formValues);
    }
    setIsFormDialogOpen(false);
    setEntityToEdit(null);
  };
  ```
- Mutation hooks MUST update TanStack Query cache (`setQueriesData` / `invalidateQueries`) upon `onSuccess`.

### 6. Component Presentation & UI/UX Standards (shadcn UI + Tailwind)
- **Top Controls Toolbar**:
  - Left side: Search `Input` with `Search` icon inside relative wrapper + Filter `<select>` dropdowns.
  - Right side: Action buttons (e.g. "Add Entity") styled with theme green (`bg-[#45AC5E] hover:bg-[#389350]`) and Lucide icon.
- **Table Structure**: Wrap shadcn UI components (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) inside a rounded container (`overflow-x-auto rounded-lg border border-slate-100`).
- **Badge Styling**: Render badges for statuses and types using semantic Tailwind classes (Emerald for active/admin, Amber for pending/inactive, Rose for deleted/error, Indigo for special roles).
- **All State Views Handled**:
  - *Initial Loading*: `Loader2` spin indicator inside table body when `accumulatedData.length === 0 && isLoading`.
  - *Empty State*: Clear message ("No records found matching filter criteria.") when data array is empty.
  - *Error State*: Alert banner displaying `error.message` when `isError` is true.
  - *Bottom Sentinel*: Shows `Loader2` when `isFetchingNextPage` or "All {totalCount} items loaded" when `!hasNextPage`.

---

## Canonical Implementation Reference

Always refer to [`user-list-table.tsx`](file:///e:/work/neayouk/apps/web/src/features/users/components/user-list-table.tsx) for the complete reference code structure.
