export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export function getAuthenticatedUser(
  request: Request,
): AuthenticatedUser | null {
  const id = request.headers.get("oai-authenticated-user-id")?.trim();
  const email = request.headers.get("oai-authenticated-user-email")?.trim();
  if (!id || !email) return null;

  let fullName: string | null = null;
  if (
    request.headers.get("oai-authenticated-user-full-name-encoding") ===
    "percent-encoded-utf-8"
  ) {
    const encoded = request.headers.get("oai-authenticated-user-full-name");
    if (encoded) {
      try {
        fullName = decodeURIComponent(encoded);
      } catch {
        fullName = null;
      }
    }
  }
  return { id, email, fullName };
}

export function unauthorized() {
  return Response.json(
    { ok: false, error: "authentication_required" },
    { status: 401 },
  );
}
