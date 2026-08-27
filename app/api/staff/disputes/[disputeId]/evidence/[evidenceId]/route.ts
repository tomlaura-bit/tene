import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../../../../db";
import { disputeEvidence, users } from "../../../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ disputeId: string; evidenceId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [actor] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!actor || !["owner", "admin", "mod"].includes(actor.role)) return Response.json({ ok: false, error: "staff_required" }, { status: 403 });
  const { disputeId, evidenceId } = await params;
  const [record] = await db.select().from(disputeEvidence).where(and(eq(disputeEvidence.id, evidenceId), eq(disputeEvidence.disputeId, disputeId))).limit(1);
  if (!record?.storageKey) return Response.json({ ok: false, error: "evidence_not_found" }, { status: 404 });
  const object = await env.UPLOADS.get(record.storageKey);
  if (!object) return Response.json({ ok: false, error: "evidence_not_found" }, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "private, no-store");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
