"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { User } from "@/lib/backend";

export const currentUserQueryKey = ["auth", "current-user"] as const;

type CurrentUserQueryOptions = {
  retry?: boolean | number;
  staleTime?: number;
};

export function useCurrentUser(options: CurrentUserQueryOptions = {}) {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => apiRequest<User>("users/me"),
    ...options,
  });
}
