import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../../../db";
import { paymentRequests, users } from "../../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [actor] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!actor || !["owner", "admin"].includes(actor.role))
    return Response.json({ ok: false, error: "finance_permission_required" }, { status: 403 });
  const { paymentId } = await params;
  const [payment] = await db.select({ proofUrl: paymentRequests.proofUrl }).from(paymentRequests).where(eq(paymentRequests.id, paymentId)).limit(1);
  if (!payment?.proofUrl) return Response.json({ ok: false, error: "proof_not_found" }, { status: 404 });
  const object = await env.UPLOADS.get(payment.proofUrl);
  if (!object) return Response.json({ ok: false, error: "proof_not_found" }, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "private, no-store");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
