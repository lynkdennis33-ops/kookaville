"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * QueryProvider — wraps the application with a TanStack React Query client.
 *
 * Using useState to create the QueryClient ensures each browser tab/session
 * gets its own isolated cache, and that the client is not recreated on
 * every render.
 *
 * Default query options:
 *   - staleTime: 60 s  — data is considered fresh for 1 minute
 *   - retry: 1         — one automatic retry on failure
 *   - refetchOnWindowFocus: false — avoids surprise refetches during dev
 */
export function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
