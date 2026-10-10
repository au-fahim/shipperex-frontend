import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/backend";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (
    request.method === "PATCH" &&
    path.length === 4 &&
    path[0] === "admin" &&
    path[1] === "users" &&
    path[3] === "role"
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "User roles cannot be changed after account creation.",
      },
      { status: 403 },
    );
  }
  const url = `${API_BASE_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  let accessToken = request.cookies.get("shipperex_access")?.value;
  const refreshToken = request.cookies.get("shipperex_refresh")?.value;
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  try {
    const send = (token?: string) => {
      if (token) headers.set("authorization", `Bearer ${token}`);
      else headers.delete("authorization");
      return fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      });
    };
    let upstream = await send(accessToken);
    let freshTokens: { accessToken?: string; refreshToken?: string } | undefined;
    if (upstream.status === 401 && refreshToken) {
      const renewed = await fetch(`${API_BASE_URL}/auth/refresh-token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }), cache: "no-store" });
      const refreshed = await renewed.json().catch(() => null);
      freshTokens = refreshed?.data;
      if (renewed.ok && freshTokens?.accessToken) upstream = await send(freshTokens.accessToken);
    }
    const responseHeaders = new Headers({ "Content-Type": upstream.headers.get("content-type") ?? "application/json" });
    const response = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
    const secure = process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
    if (freshTokens?.accessToken) response.cookies.set("shipperex_access", freshTokens.accessToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
    if (freshTokens?.refreshToken) response.cookies.set("shipperex_refresh", freshTokens.refreshToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    if (upstream.status === 401 && refreshToken) {
      response.cookies.set("shipperex_access", "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
      response.cookies.set("shipperex_refresh", "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "ShipperEx could not reach the backend. Check that the API is running and try again." }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
