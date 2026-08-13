---
title: Leverage Uncontrolled Form Performance to Minimize Re-renders During Typing
impact: HIGH
impactDescription: Prevents re-rendering 50+ form input fields on every single keypress.
tags: forms, react-hook-form, performance, uncontrolled-inputs
---

## Leverage Uncontrolled Form Performance to Minimize Re-renders During Typing

**Impact: HIGH (Eliminates typing input latency on large complex forms)**

Binding form text inputs to React component state (`const [value, setValue] = useState('')`) forces the entire component tree to re-render on every keystroke. On large forms containing 20+ inputs or nested fields, this creates noticeable input lag.

React Hook Form uses **uncontrolled input refs** by default. Avoid calling `watch()` globally or calling `useWatch()` at the top-level form component unless explicitly required for dynamic field visibility.

**Incorrect (Using global `watch()` at form root causing keypress re-renders):**

```tsx
// ❌ Bad: Top-level watch() forces whole 30-field form to re-render on every keystroke
export function BigForm() {
  const { register, watch } = useForm();
  const formValues = watch(); // Re-renders component on EVERY keypress!

  return (
    <div>
      <input {...register('firstName')} />
      <input {...register('lastName')} />
      {/* 25 more input fields */}
    </div>
  );
}
```

**Correct (Isolated subscription using target `useWatch` hook):**

```tsx
import { useForm, useWatch, Control } from 'react-hook-form';

// ✅ Good: Only child preview component re-renders when target field changes
function CountryStateSelect({ control }: { control: Control<FormInput> }) {
  // Localized subscription: ONLY this small component re-renders when country changes
  const selectedCountry = useWatch({
    control,
    name: 'country',
  });

  return (
    <div>
      <p>Selected region code: {selectedCountry}</p>
    </div>
  );
}

export function BigForm() {
  const { register, control, handleSubmit } = useForm<FormInput>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} placeholder="First Name" />
      <input {...register('country')} placeholder="Country Code" />
      
      {/* Main form stays fast; child component isolatedly observes target field */}
      <CountryStateSelect control={control} />
    </form>
  );
}
```

Reference: [React Hook Form Performance Comparison](https://react-hook-form.com/advanced-usage#CustomHookwithResolver)
