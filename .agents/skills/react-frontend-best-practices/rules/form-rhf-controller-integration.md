---
title: Wrap Custom UI Components (shadcn/ui, Radix) with RHF `Controller`
impact: HIGH
impactDescription: Enables seamless form validation integration for non-native inputs like Select, DatePicker, and Switch.
tags: forms, react-hook-form, shadcn-ui, controller
---

## Wrap Custom UI Components (shadcn/ui, Radix) with RHF `Controller`

**Impact: HIGH (Prevents broken form state bindings on custom controlled UI primitives)**

Custom UI components built on Radix UI / shadcn/ui primitives (such as `<Select>`, `<DatePicker>`, `<Switch>`, or `<Combobox>`) do not expose standard HTML `<input>` DOM refs. Passing `{...register('name')}` directly to these components fails to register input changes or trigger validation.

Wrap custom UI inputs using React Hook Form's `<Controller>` component or `useController` custom hook to bind `value`, `onChange`, and `onBlur` handlers cleanly.

**Incorrect (Passing native register props directly to custom Radix Select component):**

```tsx
// ❌ Bad: register() expects native HTML input ref; fails silently on custom Radix Select
export function RoleForm() {
  const { register } = useForm();
  return (
    <Select {...register('role')}>
      <SelectOption value="admin">Admin</SelectOption>
    </Select>
  );
}
```

**Correct (Using RHF `<Controller>` with shadcn/ui Form primitives):**

```tsx
import { useForm, Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormInput {
  role: 'admin' | 'user' | 'editor';
}

export function RoleForm() {
  const { control, handleSubmit } = useForm<FormInput>({
    defaultValues: { role: 'user' },
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <Controller
        name="role"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">User Role</label>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error.message}</p>}
          </div>
        )}
      />
    </form>
  );
}
```

Reference: [React Hook Form - Controller Documentation](https://react-hook-form.com/docs/usecontroller/controller)
