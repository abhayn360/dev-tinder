import { QueryClient } from '@tanstack/react-query';

// TanStack Query caches server data, refetches when it gets stale,
// and gives every request loading / error states for free.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data counts as fresh for 30s, so no refetch on every mount
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
