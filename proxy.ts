import { NextRequest, NextResponse } from "next/server";

const protectedRoots = ["/dashboard", "/admin", "/manager", "/courier"];
const authEntryPages = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (authEntryPages.has(path) && (request.cookies.has("shipperex_access") || request.cookies.has("shipperex_refresh"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isProtected = protectedRoots.some((root) => path === root || path.startsWith(`${root}/`));
  if (isProtected && !request.cookies.has("shipperex_access")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/login", "/register", "/dashboard/:path*", "/admin/:path*", "/manager/:path*", "/courier/:path*"] };
