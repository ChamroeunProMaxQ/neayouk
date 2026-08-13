---
title: Leverage React Router Loaders and Actions for Parallel Data Flow
impact: MEDIUM-HIGH
impactDescription: Prevents waterfall fetching cascades by fetching data before component rendering starts.
tags: routing, react-router, loaders, actions, data-flow
---

## Leverage React Router Loaders and Actions for Parallel Data Flow

**Impact: MEDIUM-HIGH (Eliminates request waterfalls and improves page load speed)**

Triggering data fetches inside nested component `useEffect` hooks introduces **request waterfalls**: the parent component mounts, fetches data, renders children, and only *then* do child components initiate their own secondary network requests.

Use React Router `loader` functions to initiate route data fetching in parallel before rendering begins, and use `action` functions for mutation form submissions.

**Incorrect (Waterfall data fetching inside nested useEffect hooks):**

```tsx
// ❌ Bad: Waterfall effect cascade: Parent fetches -> renders Child -> Child fetches
export function UserPage() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  if (!user) return <Spinner />;
  return <UserPosts userId={user.id} />; // UserPosts won't start fetching until user is loaded!
}
```

**Correct (React Router Loader parallel data fetching):**

```tsx
// 1. Route Loader Definition (routes/user-loader.ts)
import { LoaderFunctionArgs } from 'react-router-dom';

export async function userRouteLoader({ params }: LoaderFunctionArgs) {
  const userId = params.userId!;
  // Fetch user profile and posts concurrently in parallel
  const [user, posts] = await Promise.all([
    queryClient.fetchQuery({ queryKey: userKeys.detail(userId), queryFn: () => fetchUser(userId) }),
    queryClient.fetchQuery({ queryKey: postKeys.byUser(userId), queryFn: () => fetchUserPosts(userId) }),
  ]);
  return { user, posts };
}

// 2. Component consumption via useLoaderData
import { useLoaderData } from 'react-router-dom';

export function UserPage() {
  const { user, posts } = useLoaderData() as Awaited<ReturnType<typeof userRouteLoader>>;

  return (
    <div>
      <h1>{user.name}</h1>
      <PostList posts={posts} />
    </div>
  );
}
```

Reference: [React Router - Loaders Guide](https://reactrouter.com/en/main/start/concepts#data-loading)
