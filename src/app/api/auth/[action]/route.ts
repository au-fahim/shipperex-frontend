import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/backend";

const isSecure = process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";

function setTokens(response: NextResponse, data: { accessToken?: string; refreshToken?: string }) {
  if (data.accessToken) response.cookies.set("shipperex_access", data.accessToken, { httpOnly: true, secure: isSecure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  if (data.refreshToken) response.cookies.set("shipperex_refresh", data.refreshToken, { httpOnly: true, secure: isSecure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  const body = await request.json().catch(() => ({}));
  const jar = request.cookies;
  const endpoint = action === "login" ? "auth/login" : action === "register" ? "auth/register" : action === "refresh" ? "auth/refresh-token" : action === "logout" ? "auth/logout" : null;
  if (!endpoint) return NextResponse.json({ success: false, message: "Unknown authentication action." }, { status: 404 });
  const payload = action === "refresh" ? { refreshToken: jar.get("shipperex_refresh")?.value } : action === "logout" ? { refreshToken: jar.get("shipperex_refresh")?.value } : body;
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
    const data = await response.json().catch(() => ({ success: false, message: "The backend returned an unreadable response." }));
    const result = NextResponse.json(data, { status: response.status });
    if (response.ok && (action === "login" || action === "register" || action === "refresh")) setTokens(result, data.data ?? {});
    if (action === "logout" || (action === "refresh" && !response.ok)) {
      result.cookies.set("shipperex_access", "", { httpOnly: true, secure: isSecure, sameSite: "lax", path: "/", maxAge: 0 });
      result.cookies.set("shipperex_refresh", "", { httpOnly: true, secure: isSecure, sameSite: "lax", path: "/", maxAge: 0 });
    }
    return result;
  } catch {
    return NextResponse.json({ success: false, message: "ShipperEx could not reach the backend. Check that the API is running and try again." }, { status: 503 });
  }
}
