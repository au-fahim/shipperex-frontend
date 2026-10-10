import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/backend";

type WorkspaceRole = "customer" | "admin" | "manager" | "courier";
type RolePayload = { data?: User };

const apiBase = (process.env.BACKEND_API_URL ?? "http://localhost:5000/api/v1").replace(/\/$/, "");

function homeFor(user: User) {
  if (user.role === "ADMIN") return "/admin";
  if (user.role === "CUSTOMER") return "/dashboard";
  return user.staffProfile?.staffType === "COURIER" ? "/courier" : "/manager";
}

function canOpen(user: User, expected: WorkspaceRole) {
  if (expected === "customer") return user.role === "CUSTOMER";
  if (expected === "admin") return user.role === "ADMIN";
  return user.role === "STAFF" && user.staffProfile?.staffType === (expected === "courier" ? "COURIER" : "MANAGER");
}

export async function requireWorkspaceRole(expected: WorkspaceRole) {
  const jar = await cookies();
  const accessToken = jar.get("shipperex_access")?.value;
  const refreshToken = jar.get("shipperex_refresh")?.value;
  if (!accessToken) redirect(`/login?next=/${expected === "customer" ? "dashboard" : expected}`);

  let response: Response;
  try {
    response = await fetch(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    return;
  }

  // Let the browser-side BFF refresh an expired access token when a refresh cookie exists.
  if ((response.status === 401 || response.status === 403) && refreshToken) return;
  if (response.status === 401 || response.status === 403) redirect(`/login?next=/${expected === "customer" ? "dashboard" : expected}`);
  if (!response.ok) return;

  const payload = await response.json().catch(() => null) as RolePayload | null;
  const user = payload?.data;
  if (user && !canOpen(user, expected)) redirect(homeFor(user));
}

export async function getSignedInHome() {
  const jar = await cookies();
  const accessToken = jar.get("shipperex_access")?.value;
  if (!accessToken) return null;
  try {
    const response = await fetch(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null) as RolePayload | null;
    return payload?.data ? homeFor(payload.data) : null;
  } catch {
    return null;
  }
}
