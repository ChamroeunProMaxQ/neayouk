# Prefer Axios Over `fetch` API for Frontend HTTP Requests

This rule enforces using **Axios** over native `fetch` API for all HTTP network requests in frontend React applications.

---

## Core Directives

1. **Prohibit Direct `fetch()` Usage**: Never use `fetch()` or `window.fetch()` in frontend application code or hooks.
2. **Centralized Axios Instance**: All network requests route through centralized `axiosClient` configured with `baseURL`, headers, and timeouts.
3. **Attach Interceptors**: Use request interceptors for Authorization token injection and response interceptors for standardized error handling and 401 handling.
4. **TanStack Query Integration**: Pass Axios client calls and `AbortSignal` directly into TanStack Query `queryFn` and `mutationFn`.
