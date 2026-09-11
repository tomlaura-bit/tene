import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { paymentDestinations } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const destinations = await getDb()
    .select({ method: paymentDestinations.method, displayName: paymentDestinations.displayName, phone: paymentDestinations.phone, hasQr: paymentDestinations.qrObjectKey, version: paymentDestinations.version })
    .from(paymentDestinations)
    .where(eq(paymentDestinations.status, "active"))
    .orderBy(asc(paymentDestinations.method));
  return Response.json({
    ok: true,
    destinations: destinations.map((item) => ({ ...item, hasQr: Boolean(item.hasQr), qrUrl: item.hasQr ? `/api/payment-destinations/${item.method}/qr?v=${item.version}` : null })),
  }, { headers: { "cache-control": "private, no-store" } });
}
