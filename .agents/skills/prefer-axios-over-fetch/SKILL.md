---
name: prefer-axios-over-fetch
description: Enforce using Axios over standard window.fetch API for all frontend HTTP requests. Provides guidelines for centralized Axios client instances, request/response interceptors, auth token injection, automatic error handling, TypeScript generics, request cancellation, and TanStack Query integration.
---

# Prefer Axios Over `fetch` API for Frontend HTTP Requests

This skill enforces using **Axios** over the native `fetch` API for all frontend HTTP network requests. While `fetch` is built into browsers, Axios provides built-in HTTP status error rejection, automatic JSON parsing, request/response interceptors, request timeout support, upload progress tracking, and cleaner integration with TypeScript and TanStack Query.

---

## Core Directives

1. **Prohibit Direct `fetch()` Usage**:
   Never use `fetch()` or `window.fetch()` in frontend application code, component hooks, or API service modules.

2. **Centralize Axios Client Configuration**:
   All HTTP requests must route through a centralized, configured Axios instance (e.g., `@/lib/api-client.ts` or `@/services/api.ts`). Never call `axios.get()` or `axios.post()` directly without a configured client instance.

3. **Attach Request & Response Interceptors**:
   - **Request Interceptor**: Automatically inject authorization headers (e.g., `Bearer <token>`), language headers (`Accept-Language`), and request IDs.
   - **Response Interceptor**: Normalize response data, catch global HTTP error statuses (e.g., 401 Unauthorized token refresh/redirect, 403 Forbidden, 500 Server Error toasts), and standardize error formats.

4. **Enforce Type Safety with Generics**:
   Always specify TypeScript generics for request payloads and response data. Use standardized API wrapper types (e.g., `ApiResponse<T>`).

5. **Integrate with TanStack Query**:
   Pass Axios client methods to `useQuery` / `useMutation` query functions. Pass the `signal` from `QueryFunctionContext` directly to Axios `signal` for automatic request cancellation.

6. **Standardize Error Handling**:
   Use `axios.isAxiosError(error)` to extract backend validation errors, status codes, and user-friendly error messages consistently across the application.

---

## Quick Comparison: `fetch` vs Axios

| Feature / Behavior | Native `fetch` ❌ | Axios Client (Recommended) ✅ |
|---|---|---|
| **HTTP Error Rejection** | Does NOT reject on 4xx/5xx errors (`res.ok` check required manually) | Automatically rejects Promise on non-2xx status codes |
| **JSON Serialization** | Manual two-step process: `await fetch(...)` then `await res.json()` | Automatic JSON request/response transformation in `response.data` |
| **Interceptors** | Requires custom fetch wrapper functions | Built-in `interceptors.request` and `interceptors.response` pipeline |
| **Request Timeout** | Requires complex `AbortSignal.timeout()` or `Promise.race` | Native `timeout: 15000` configuration option |
| **Auth Headers** | Manual header duplication across every single API call | Centralized injection via request interceptor |
| **Upload / Download Progress** | Not supported for uploads out of the box | Built-in `onUploadProgress` and `onDownloadProgress` callbacks |
| **Request Cancellation** | Manual `AbortController` binding | Native support for `signal: abortController.signal` |
| **CSRF & Cookie Credentials** | Manual `credentials: 'include'` on every call | Set `withCredentials: true` globally on client instance |

---

## Architecture & Implementation Patterns

### 1. Centralized Axios Client (`src/lib/api-client.ts`)

```typescript
import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from "axios";

// Standard API Response Envelope
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Custom API Error Interface
export interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Create configured Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Global Error & Auth Handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const status = error.response.status;

      // Handle 401 Unauthorized (e.g., redirect to login or trigger token refresh)
      if (status === 401) {
        localStorage.removeItem("auth_token");
        if (window.location.pathname !== "/login") {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error("Access Forbidden:", error.response.data.message);
      }
    } else if (error.request) {
      // Network Error / Timeout
      console.error("Network connectivity issue or request timed out");
    }

    return Promise.reject(error);
  }
);
```

---

### 2. Type-Safe API Service Layer (`src/services/user-service.ts`)

```typescript
import { apiClient, type ApiResponse } from "@/lib/api-client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: "admin" | "user";
}

export const userService = {
  // GET request with query params & signal for cancellation
  getUsers: async (params?: { page?: number; limit?: number }, signal?: AbortSignal): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>("/users", {
      params,
      signal,
    });
    return response.data.data;
  },

  // GET request by ID
  getUserById: async (id: string, signal?: AbortSignal): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`, { signal });
    return response.data.data;
  },

  // POST request with payload
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>("/users", payload);
    return response.data.data;
  },

  // PUT / PATCH request
  updateUser: async (id: string, payload: Partial<CreateUserPayload>): Promise<User> => {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return response.data.data;
  },

  // DELETE request
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
```

---

### 3. TanStack Query Integration (`src/hooks/use-users.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, type CreateUserPayload } from "@/services/user-service";
import axios from "axios";
import type { ApiErrorResponse } from "@/lib/api-client";

// Query Hook with AbortSignal cancellation support
export function useUsers(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["users", page, limit],
    queryFn: ({ signal }) => userService.getUsers({ page, limit }, signal),
  });
}

// Mutation Hook with Error Extraction
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newUserData: CreateUserPayload) => userService.createUser(newUserData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const message = error.response?.data?.message || "Failed to create user";
        console.error("Axios Mutation Error:", message, error.response?.data?.errors);
      }
    },
  });
}
```

---

## Code Examples: Anti-Pattern vs Recommended Pattern

### ❌ Anti-Pattern: Using Native `fetch`

```tsx
// DO NOT DO THIS
import { useState, useEffect } from "react";

export function UserList() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // ❌ Raw fetch call, manual headers, manual json parsing, missed 4xx/5xx errors
    fetch("https://api.example.com/v1/users", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        // ❌ Manual res.ok check required because fetch doesn't throw on HTTP errors
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json(); // ❌ Manual json decoding step
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message));
  }, []);

  return <div>{/* UI rendering */}</div>;
}
```

---

### ✅ Recommended Pattern: Centralized Axios + Service + Query Hook

```tsx
import { useUsers } from "@/hooks/use-users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function UserList() {
  const { data: users, isLoading, isError, error } = useUsers();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading users</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : "An unexpected error occurred"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users?.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Why Axios Over `fetch` Matters

1. **Automatic Error Handling for Status Codes**: Native `fetch()` resolves successfully even if the backend returns `404 Not Found`, `422 Unprocessable Entity`, or `500 Internal Server Error`. Developers frequently forget to inspect `response.ok`. Axios automatically rejects the promise on any HTTP status outside the 2xx range.
2. **Centralized Interceptor Pipeline**: Essential security concerns like injecting bearer JWT tokens, refreshing expired tokens, and appending standard correlation headers happen seamlessly in one place, avoiding repetitive boilerplate.
3. **Automatic Data Transformation**: Axios automatically serializes outgoing request bodies to JSON and parses incoming JSON responses into `response.data`.
4. **Native Timeout Configuration**: Prevents requests from hanging indefinitely when backend servers stall or network drops occur.
5. **Unified Type Safety & Error Guards**: Provides type helpers like `axios.isAxiosError<T>(error)` that allow safe extraction of backend error structures with full TypeScript IDE autocomplete.
