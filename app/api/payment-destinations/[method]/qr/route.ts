import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../../db";
import { paymentDestinations } from "../../../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ method: string }> }) {
  const { method } = await params;
  if (!['yape', 'plin'].includes(method)) return new Response("Not found", { status: 404 });
  const [destination] = await getDb().select({ key: paymentDestinations.qrObjectKey }).from(paymentDestinations)
    .where(and(eq(paymentDestinations.method, method as "yape" | "plin"), eq(paymentDestinations.status, "active"))).limit(1);
  if (!destination?.key) return new Response("Not found", { status: 404 });
  const object = await env.UPLOADS.get(destination.key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=300, stale-while-revalidate=3600");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
