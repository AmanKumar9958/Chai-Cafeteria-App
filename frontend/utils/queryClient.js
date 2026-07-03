import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance for the app.
 *
 * - staleTime: 2 minutes — data is considered fresh for 2 min,
 *   so navigating back to a screen won't trigger a refetch.
 * - gcTime (cacheTime): 10 minutes — cached data is kept in memory
 *   for 10 min after the last subscriber unmounts.
 * - retry: 2 — retries failed queries twice before throwing.
 * - refetchOnWindowFocus: false — prevents refetch when the app
 *   is foregrounded (mobile apps don't benefit from this).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
