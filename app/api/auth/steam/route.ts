import { getAuthenticatedUser } from "../../../../lib/auth";
import { steamLoginUrl } from "../../../../lib/steam";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!getAuthenticatedUser(request))
    return Response.redirect(
      new URL("/signin-with-chatgpt?return_to=/api/auth/steam", request.url),
      302,
    );
  return Response.redirect(steamLoginUrl(), 302);
}
