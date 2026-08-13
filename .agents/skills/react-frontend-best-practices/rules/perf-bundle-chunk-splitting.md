---
title: Configure Dynamic Module Imports and Vendor Chunk Splitting
impact: MEDIUM-HIGH
impactDescription: Prevents monolithic bundle sizes and leverages long-term browser caching for vendor libraries.
tags: performance, bundling, code-splitting, vite, vendor-chunks
---

## Configure Dynamic Module Imports and Vendor Chunk Splitting

**Impact: MEDIUM-HIGH (Speeds up repeat application page loads via browser vendor caching)**

Shipping all third-party npm dependencies (`react`, `react-dom`, `recharts`, `lucide-react`, `zod`) into a single output JavaScript chunk invalidates the browser cache every time any tiny application source file changes.

Configure bundler manual chunk splitting (e.g. in `vite.config.ts` or bundler config) to split stable vendor packages into long-term cached chunks, and use dynamic `import()` for heavy conditionally rendered modules.

**Incorrect (Single output bundle invalidates entire cache on any change):**

```typescript
// ❌ Bad: Default single vendor chunk forces full re-download on every small release
```

**Correct (Vite manual chunk splitting configuration):**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split React core libraries into dedicated vendor chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Split router and query libraries
          if (id.includes('node_modules/@tanstack/') || id.includes('node_modules/react-router-dom/')) {
            return 'query-router-vendor';
          }
          // Split UI primitives
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-vendor';
          }
        },
      },
    },
  },
});
```

**Dynamic Import for Heavy On-Demand Libraries:**

```typescript
// ✅ Good: Dynamic import loads heavy export/PDF engine only when user clicks export
export function ExportButton() {
  const handleExportPDF = async () => {
    // Dynamic import defers loading 200KB PDF engine until button click
    const { generatePDF } = await import('@/lib/pdf-generator');
    await generatePDF();
  };

  return <Button onClick={handleExportPDF}>Export PDF Report</Button>;
}
```

Reference: [Vite - Building for Production Manual Chunks](https://vitejs.dev/guide/build.html#chunking-strategy)
