---
title: Efficiently Manage Dynamic Field Lists using `useFieldArray`
impact: HIGH
impactDescription: Prevents array index shifting bugs and maintains input focus during item addition/deletion.
tags: forms, react-hook-form, useFieldArray, dynamic-forms
---

## Efficiently Manage Dynamic Field Lists using `useFieldArray`

**Impact: HIGH (Prevents input index mismatches and focus loss when adding/removing list rows)**

Managing dynamic array inputs (e.g. adding/removing multiple invoice items, phone numbers, or order rows) using standard `map((item, index))` combined with `useState` arrays causes key collisions and input focus jumping when rows are inserted or reordered.

Use React Hook Form's `useFieldArray` hook, and always assign `field.id` as the React `key` attribute on map iterations.

**Incorrect (Using array index as key for dynamic inputs):**

```tsx
// ❌ Bad: key={index} breaks DOM input identity when items are deleted or swapped
export function InvoiceForm() {
  const [items, setItems] = useState([{ name: '' }]);

  return (
    <div>
      {items.map((item, index) => (
        <input key={index} onChange={(e) => updateItem(index, e.target.value)} />
      ))}
    </div>
  );
}
```

**Correct (Using `useFieldArray` with stable `field.id` keys):**

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

interface InvoiceFormInput {
  clientName: string;
  items: Array<{ description: string; quantity: number; price: number }>;
}

export function InvoiceForm() {
  const { register, control, handleSubmit } = useForm<InvoiceFormInput>({
    defaultValues: {
      clientName: '',
      items: [{ description: '', quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))} className="space-y-4">
      <Input {...register('clientName')} placeholder="Client Name" />

      <div className="space-y-2">
        {fields.map((field, index) => (
          // ✅ Good: Always use field.id as key, NEVER index
          <div key={field.id} className="flex items-center gap-2">
            <Input
              {...register(`items.${index}.description` as const)}
              placeholder="Item Description"
            />
            <Input
              type="number"
              {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
              className="w-20"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => remove(index)}
            >
              &times;
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ description: '', quantity: 1, price: 0 })}
      >
        + Add Item
      </Button>
    </form>
  );
}
```

Reference: [React Hook Form - useFieldArray Guide](https://react-hook-form.com/docs/usefieldarray)
