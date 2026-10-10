import type { ApiEnvelope } from "@/lib/backend";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const result = await response.json().catch(() => ({
    success: false,
    message: "The server returned an unreadable response.",
  }));
  if (!response.ok || result.success === false)
    throw new ApiRequestError(
      result.message ?? "The request could not be completed.",
      response.status,
    );
  return result as ApiEnvelope<T>;
}
