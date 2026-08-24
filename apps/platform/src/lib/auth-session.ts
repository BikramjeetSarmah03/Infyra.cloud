import { queryOptions, useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const authSessionKey = ["auth", "session"] as const;

export const authSessionQueryOptions = queryOptions({
  queryKey: authSessionKey,
  queryFn: async () => {
    const { data } = await authClient.getSession();
    return data;
  },
  staleTime: FIFTEEN_MINUTES,
  gcTime: FIFTEEN_MINUTES,
});

export function useAuthSession() {
  return useQuery(authSessionQueryOptions);
}
