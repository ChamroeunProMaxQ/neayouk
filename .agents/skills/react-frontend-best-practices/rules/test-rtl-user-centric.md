---
title: Write User-Centric Component Tests with RTL and Accessible Queries
impact: MEDIUM-HIGH
impactDescription: Prevents fragile component implementation detail testing and guarantees accessibility.
tags: testing, vitest, react-testing-library, user-event, accessibility
---

## Write User-Centric Component Tests with RTL and Accessible Queries

**Impact: MEDIUM-HIGH (Ensures tests don't break on refactoring internal implementation details)**

Testing component implementation details—such as querying internal state variables, checking component class names, or firing artificial `fireEvent.change` events—creates brittle tests that break during harmless refactoring even when user functionality remains unchanged.

Write **User-Centric Component Tests** using `@testing-library/react` and `@testing-library/user-event`. Query elements by ARIA roles (`getByRole`), labels (`getByLabelText`), or text content (`getByText`) exactly as an end-user or screen reader interacts with the application.

**Incorrect (Testing internal implementation details and class names):**

```tsx
// ❌ Bad: Querying CSS classes and firing artificial synthetic events
test('submits form', () => {
  const { container } = render(<LoginForm onSubmit={jest.fn()} />);
  const input = container.querySelector('.input-email'); // Fragile CSS selector!
  fireEvent.change(input, { target: { value: 'user@test.com' } });
  fireEvent.click(container.querySelector('button'));
});
```

**Correct (User-centric testing with `@testing-library/user-event` and ARIA queries):**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './login-form';

describe('LoginForm Component', () => {
  it('submits valid user credentials successfully', async () => {
    // 1. Setup user event instance
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    // 2. Render component
    render(<LoginForm onSubmit={handleSubmit} />);

    // 3. Query elements by accessible role and label
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // 4. Perform realistic user typing and click actions
    await user.type(emailInput, 'alex@example.com');
    await user.type(passwordInput, 'SecurePassword123!');
    await user.click(submitButton);

    // 5. Assert user behavior outcome
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'SecurePassword123!',
      rememberMe: false,
    });
  });
});
```

Reference: [Testing Library - Guiding Principles](https://testing-library.com/docs/guiding-principles)
