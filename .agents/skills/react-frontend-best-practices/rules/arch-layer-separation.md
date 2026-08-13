---
title: Enforce Strict Layer-Based Architecture Separation
impact: CRITICAL
impactDescription: Prevents tight coupling between UI, state management, domain logic, and API protocols.
tags: architecture, layering, clean-code
---

## Enforce Strict Layer-Based Architecture Separation

**Impact: CRITICAL (Prevents monolith components and enables isolated testing)**

In a production React application, mixing API calls, state mutation, business rules, and UI rendering inside single component files leads to unmaintainable, untestable code. A Layer-based architecture strictly separates four core layers:
1. **Presentation Layer (`components/` / `views/`)**: Pure UI components rendering props and layout.
2. **Application / State Layer (`hooks/` / `stores/`)**: Custom hooks orchestrating Zustand state, forms, and queries.
3. **Domain Layer (`types/` / `domain/`)**: Pure TypeScript functions, business rules, and validation schemas.
4. **Data / Infrastructure Layer (`api/` / `services/`)**: API clients, HTTP fetchers, and backend request mappings.

**Incorrect (Mixing presentation, API calls, and business logic):**

```tsx
// ❌ Bad: Component directly fetches, transforms domain data, and handles state mutations
import { useEffect, useState } from 'react';
import axios from 'axios';

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    axios.get(`/api/users/${userId}`).then(res => {
      // Direct domain calculation inside UI
      const fullName = `${res.data.firstName} ${res.data.lastName}`;
      const isVIP = res.data.spent > 10000;
      setUser({ ...res.data, fullName, isVIP });
    });
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.fullName}</h1>
      {user.isVIP && <span className="badge">VIP Customer</span>}
    </div>
  );
}
```

**Correct (Strict layer separation):**

```tsx
// 1. Data Layer (api/user-api.ts)
export async function fetchUserById(userId: string): Promise<UserDTO> {
  const response = await apiClient.get<UserDTO>(`/users/${userId}`);
  return response.data;
}

// 2. Domain Layer (domain/user-domain.ts)
export interface UserDomain {
  id: string;
  fullName: string;
  isVIP: boolean;
}

export function mapUserDTOToDomain(dto: UserDTO): UserDomain {
  return {
    id: dto.id,
    fullName: `${dto.firstName} ${dto.lastName}`,
    isVIP: dto.spentAmount >= 10000,
  };
}

// 3. Application Layer (hooks/use-user-profile.ts)
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      const dto = await fetchUserById(userId);
      return mapUserDTOToDomain(dto);
    },
  });
}

// 4. Presentation Layer (components/user-profile.tsx)
export function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUserProfile(userId);

  if (isLoading || !user) return <UserProfileSkeleton />;

  return (
    <div className="flex items-center gap-4">
      <h1 className="text-xl font-bold">{user.fullName}</h1>
      {user.isVIP && <Badge variant="secondary">VIP Customer</Badge>}
    </div>
  );
}
```

Reference: [Clean Architecture on Frontend](https://martinfowler.com/articles/enterprise-rails.html)
