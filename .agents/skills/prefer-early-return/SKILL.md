---
name: prefer-early-return
description: Enforce using guard clauses and early returns to reduce indentation nesting, eliminate unnecessary else blocks, handle edge cases first, and improve code legibility across all functions, components, and handlers.
---

# Prefer Early Return and Guard Clauses

This skill enforces the **Early Return Pattern** (Guard Clauses / Bouncer Pattern) across all TypeScript, JavaScript, React components, and backend service methods. Functions should validate prerequisites and edge cases at the very beginning and exit immediately (`return`, `throw`, `continue`, or `break`), leaving the primary "happy path" un-indented at the bottom.

---

## Core Directives

1. **Bouncer Pattern at Function Entry**:
   Place validations, type guards, permission checks, and null/undefined checks at the very top of the function. Exit early if conditions are not met.

2. **Eliminate Unnecessary `else` / `else if` Blocks**:
   If an `if` block ends with a `return`, `throw`, `break`, or `continue`, do **not** use an `else` block. Place the subsequent logic immediately after the `if` block.

3. **Flatten the Happy Path**:
   The primary execution logic (happy path) must remain at the top level of indentation in the function, rather than wrapped inside nested `if` blocks.

4. **Max 1–2 Indentation Levels**:
   Avoid the "Pyramid of Doom" / Arrow anti-pattern where code indents 3, 4, or 5 levels deep inside nested conditional blocks.

5. **Early Exit in Loops**:
   Inside loops, check invalid conditions first and use `continue` or `break` to skip execution early instead of wrapping the entire loop body in an `if` statement.

6. **Early Return in React Components & Hooks**:
   Return early for loading states, error states, null/empty data, or unauthenticated views before rendering the main UI tree.

---

## Quick Reference Comparison

| Anti-Pattern (Nested `if/else`) ❌ | Standard Early Return (Recommended) ✅ |
|---|---|
| Deeply nested `if` structures | Guard clauses evaluated first at the top |
| Trailing `else` blocks after `return` | No `else` required after early `return` / `throw` |
| Happy path hidden deep inside nested blocks | Happy path flat at the lowest indentation level |
| Loop body wrapped inside `if (valid) { ... }` | Loop skips early with `if (!valid) continue;` |
| JSX wrapped in `return isLoading ? <Spinner/> : (...)` | `if (isLoading) return <Spinner />;` at top of component |

---

## Code Examples

### 1. Basic Function Logic

#### ❌ Anti-Pattern: Nested `if/else` (Pyramid of Doom)

```typescript
function processOrder(user: User | null, order: Order | null) {
  if (user) {
    if (user.isActive) {
      if (order) {
        if (order.items.length > 0) {
          // Main logic hidden deep inside 4 levels of nesting
          const total = calculateTotal(order);
          saveOrder(user.id, total);
          return { success: true, total };
        } else {
          throw new Error("Order has no items");
        }
      } else {
        throw new Error("Order is required");
      }
    } else {
      throw new Error("User account is inactive");
    }
  } else {
    throw new Error("User is required");
  }
}
```

#### ✅ Recommended Pattern: Guard Clauses & Early Return

```typescript
function processOrder(user: User | null, order: Order | null) {
  // 1. Guard clauses (Edge cases & validation first)
  if (!user) {
    throw new Error("User is required");
  }

  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  if (!order) {
    throw new Error("Order is required");
  }

  if (order.items.length === 0) {
    throw new Error("Order has no items");
  }

  // 2. Happy path (Flat, un-nested logic)
  const total = calculateTotal(order);
  saveOrder(user.id, total);
  return { success: true, total };
}
```

---

### 2. Eliminating Unnecessary `else` Blocks

#### ❌ Anti-Pattern: Redundant `else`

```typescript
function getDiscountRate(customerType: string): number {
  if (customerType === "VIP") {
    return 0.2;
  } else if (customerType === "REGULAR") {
    return 0.1;
  } else {
    return 0.0;
  }
}
```

#### ✅ Recommended Pattern: Clean Fallthrough

```typescript
function getDiscountRate(customerType: string): number {
  if (customerType === "VIP") return 0.2;
  if (customerType === "REGULAR") return 0.1;

  return 0.0;
}
```

---

### 3. Early Return in React Components

#### ❌ Anti-Pattern: Nested Ternaries in JSX

```tsx
export const UserDashboard = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, error } = useUser(userId);

  return (
    <div className="container">
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : user ? (
        <div>
          <h1>Welcome, {user.name}</h1>
          <UserProfileData user={user} />
        </div>
      ) : (
        <div>No user data found</div>
      )}
    </div>
  );
};
```

#### ✅ Recommended Pattern: Early Return UI Guard Clauses

```tsx
export const UserDashboard = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, error } = useUser(userId);

  // Guard Clause 1: Loading
  if (isLoading) {
    return <Spinner />;
  }

  // Guard Clause 2: Error
  if (error) {
    return <ErrorMessage error={error} />;
  }

  // Guard Clause 3: Missing Data
  if (!user) {
    return <div>No user data found</div>;
  }

  // Main UI Tree (Happy path)
  return (
    <div className="container">
      <h1>Welcome, {user.name}</h1>
      <UserProfileData user={user} />
    </div>
  );
};
```

---

### 4. Loops & Array Iteration

#### ❌ Anti-Pattern: Wrapping Loop Body in `if`

```typescript
function processNotifications(notifications: Notification[]) {
  for (const notification of notifications) {
    if (notification.unread) {
      if (!notification.archived) {
        if (userHasPermission(notification.type)) {
          sendPushNotification(notification);
          markAsDelivered(notification.id);
        }
      }
    }
  }
}
```

#### ✅ Recommended Pattern: Early `continue`

```typescript
function processNotifications(notifications: Notification[]) {
  for (const notification of notifications) {
    if (!notification.unread) continue;
    if (notification.archived) continue;
    if (!userHasPermission(notification.type)) continue;

    // Process valid notification
    sendPushNotification(notification);
    markAsDelivered(notification.id);
  }
}
```

---

### 5. Async Functions & API Handlers

#### ❌ Anti-Pattern: Deep Nesting in Async Handler

```typescript
async function handlePaymentRequest(req: Request, res: Response) {
  const session = await getSession(req);
  if (session) {
    const payment = await fetchPayment(req.params.id);
    if (payment) {
      if (payment.status === "pending") {
        const result = await processPayment(payment);
        return res.json(result);
      } else {
        return res.status(400).json({ error: "Payment already processed" });
      }
    } else {
      return res.status(404).json({ error: "Payment not found" });
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
```

#### ✅ Recommended Pattern: Flat Async Guard Clauses

```typescript
async function handlePaymentRequest(req: Request, res: Response) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payment = await fetchPayment(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  if (payment.status !== "pending") {
    return res.status(400).json({ error: "Payment already processed" });
  }

  const result = await processPayment(payment);
  return res.json(result);
}
```

---

## Why This Matters

1. **Drastically Reduces Cognitive Load**:
   Developers don't need to keep long lists of nested conditions in working memory when reading through a function. Once an edge case is checked and returned, it is out of mind.

2. **Maintains Left-Aligned Code**:
   Code that aligns near the left margin is exponentially easier to read and scan than code that drifts to the right across multiple levels of indentation.

3. **Simplifies Diff Reviews**:
   Modifying or adding a new validation check only alters 2-3 lines at the top of the function rather than shifting 50 lines of code by an extra indentation level.

4. **Lower Cyclomatic Complexity**:
   Isolating preconditions into independent guard clauses reduces test branching complexity and makes unit testing straight-forward.
