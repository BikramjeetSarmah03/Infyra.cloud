import { queryOptions, useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const activeOrganizationKey = ["auth", "active-organization"] as const;

/**
 * The organization the current session is acting in. Read from the server
 * rather than the session cookie so a freshly created org is reflected without
 * a re-login. Returns null when the user has no organization yet, which is the
 * signal the onboarding gate keys off.
 */
export const activeOrganizationQueryOptions = queryOptions({
  queryKey: activeOrganizationKey,
  queryFn: async () => {
    const { data } = await authClient.organization.getFullOrganization();
    return data ?? null;
  },
  staleTime: FIFTEEN_MINUTES,
  gcTime: FIFTEEN_MINUTES,
});

export function useActiveOrganization() {
  return useQuery(activeOrganizationQueryOptions);
}
