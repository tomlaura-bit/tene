import { env } from "cloudflare:workers";
import { LedgerService, type PostLedgerTransaction } from "../../../../lib/finance/ledger-service";
import { processOutbox } from "../../../../lib/finance/outbox";
import { secureEqual } from "../../../../lib/webhook-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = (env as unknown as Record<string, string | undefined>).CRON_SECRET;
  if (!secret || !(await secureEqual(request.headers.get("authorization"), `Bearer ${secret}`)))
    return Response.json({ ok: false, error: "invalid_cron_secret" }, { status: 401 });

  const result = await processOutbox(async (event) => {
    if (event.topic !== "ledger.post") throw new Error(`unsupported_outbox_topic:${event.topic}`);
    await new LedgerService().post(event.payload as PostLedgerTransaction);
  }, 50);
  return Response.json({ ok: true, ...result });
}
