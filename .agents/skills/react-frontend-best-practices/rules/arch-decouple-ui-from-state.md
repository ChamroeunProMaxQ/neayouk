---
title: Decouple Pure UI Components from Complex Application State
impact: HIGH
impactDescription: Maximizes component reusability and simplifies unit testing with storybooks/mocks.
tags: architecture, components, props, state
---

## Decouple Pure UI Components from Complex Application State

**Impact: HIGH (Improves component testability and design system reusability)**

UI components should focus on rendering layout, markup, accessibility attributes, and user interaction callbacks. When components directly reference global Zustand stores, router params, or server queries, they become tightly coupled to specific execution contexts and cannot be reused or rendered easily in isolated environments (e.g. Storybook, unit tests, or preview cards).

Separate your components into:
- **Container / Screen Components**: Connect to router, Zustand stores, and TanStack Query hooks. Pass slice state down as explicit props.
- **Presenter / UI Components**: Accept pure props and callbacks, performing zero direct side effects or global store subscriptions.

**Incorrect (UI component coupled to Zustand and Query hooks):**

```tsx
// ❌ Bad: ProductCard cannot be rendered without active TanStack Query + Zustand providers
import { useCartStore } from '@/stores/cart-store';
import { useProductQuery } from '@/hooks/use-product-query';

export function ProductCard({ productId }: { productId: string }) {
  const { data: product } = useProductQuery(productId);
  const addToCart = useCartStore((s) => s.addItem);

  if (!product) return null;

  return (
    <div className="card">
      <h3>{product.name}</h3>
      <button onClick={() => addToCart(product)}>Add to Cart</button>
    </div>
  );
}
```

**Correct (Container passes clean props to Presenter component):**

```tsx
// 1. Presenter Component (pure, reusable UI)
interface ProductCardProps {
  name: string;
  price: string;
  imageUrl: string;
  onAddToCart: () => void;
  isAdding?: boolean;
}

export function ProductCard({
  name,
  price,
  imageUrl,
  onAddToCart,
  isAdding = false,
}: ProductCardProps) {
  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <img src={imageUrl} alt={name} className="h-48 w-full object-cover" />
      <h3 className="mt-2 font-semibold text-foreground">{name}</h3>
      <p className="text-sm text-muted-foreground">{price}</p>
      <Button 
        onClick={onAddToCart} 
        disabled={isAdding} 
        className="mt-4 w-full"
      >
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  );
}

// 2. Container / Smart Component
export function ProductCardContainer({ productId }: { productId: string }) {
  const { data: product, isLoading } = useProductQuery(productId);
  const addToCart = useCartStore((s) => s.addItem);

  if (isLoading || !product) return <ProductCardSkeleton />;

  return (
    <ProductCard
      name={product.title}
      price={formatCurrency(product.priceAmount)}
      imageUrl={product.thumbnail}
      onAddToCart={() => addToCart({ id: product.id, title: product.title })}
    />
  );
}
```

Reference: [Presentational and Container Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)
