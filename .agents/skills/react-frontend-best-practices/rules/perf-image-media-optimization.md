---
title: Load Optimized Images Lazily with Explicit Layout Dimensions
impact: MEDIUM-HIGH
impactDescription: Eliminates Cumulative Layout Shift (CLS) and reduces unnecessary image payload downloads.
tags: performance, images, CLS, lazy-loading, media
---

## Load Optimized Images Lazily with Explicit Layout Dimensions

**Impact: MEDIUM-HIGH (Eliminates Cumulative Layout Shift (CLS) and saves user bandwidth)**

Serving uncompressed 4MB PNG images, omitting explicit `width` and `height` dimensions, or omitting `loading="lazy"` causes page layout content to shift abruptly as images load (high Cumulative Layout Shift), degrading Core Web Vitals scores.

Optimize media assets:
1. **Modern formats**: Use WebP or AVIF image formats over raw PNG/JPEG.
2. **Explicit dimensions**: Always provide explicit `aspect-ratio` or `width` and `height` attributes to reserve layout space.
3. **Native Lazy Loading**: Add `loading="lazy"` and `decoding="async"` for below-the-fold images.
4. **SVG Sprites**: Inline or group icon vectors instead of making separate HTTP requests for dozens of tiny SVG files.

**Incorrect (Un-dimensioned raw PNG causing Cumulative Layout Shift):**

```tsx
// ❌ Bad: No explicit width/height causes page content jumping when loaded; uncompressed PNG payload
export function Banner() {
  return <img src="/hero.png" alt="Hero banner" />;
}
```

**Correct (Dimensioned responsive WebP image with lazy loading):**

```tsx
// ✅ Good: Reserved layout aspect ratio, modern format, and lazy loading
export function Banner({
  src,
  alt,
  width = 800,
  height = 400,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg bg-muted"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-opacity duration-300"
      />
    </div>
  );
}
```

Reference: [web.dev - Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
