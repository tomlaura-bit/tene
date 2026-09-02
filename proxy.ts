import { NextResponse, type NextRequest } from "next/server";

const headers: Record<string, string> = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' https: data: blob:; media-src 'self' blob:; connect-src 'self' https://api.steampowered.com https://steamcommunity.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; upgrade-insecure-requests",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

export function proxy(request: NextRequest) {
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const isWebhook = request.nextUrl.pathname.startsWith("/api/integrations/");
  const fetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    isMutation &&
    !isWebhook &&
    (fetchSite === "cross-site" || (origin && origin !== request.nextUrl.origin))
  ) {
    return NextResponse.json(
      { ok: false, error: "cross_site_request_blocked" },
      { status: 403 },
    );
  }
  const response = NextResponse.next();
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  if (request.nextUrl.pathname.startsWith("/api/")) response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: "/:path*" };
