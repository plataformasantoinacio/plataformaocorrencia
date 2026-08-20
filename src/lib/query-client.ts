/**
 * query-client.ts
 * Singleton do QueryClient — compartilhado entre o Provider React
 * e as funções imperativas fora de componentes.
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
