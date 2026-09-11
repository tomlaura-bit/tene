import { getD1 } from "../../db";

export function outboxStatement(input: { topic: string; aggregateType: string; aggregateId: string; payload: unknown; deduplicationKey: string }) {
  const d1 = getD1();
  const now = Math.floor(Date.now() / 1000);
  return d1.prepare(`INSERT OR IGNORE INTO outbox_events
    (id, deduplication_key, topic, aggregate_type, aggregate_id, payload_json, status, attempts, available_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`)
    .bind(`out_${crypto.randomUUID()}`, input.deduplicationKey, input.topic, input.aggregateType, input.aggregateId, JSON.stringify(input.payload), now, now);
}

export async function processOutbox(handler: (event: { topic: string; payload: unknown }) => Promise<void>, limit = 20) {
  const d1 = getD1();
  const now = Math.floor(Date.now() / 1000);
  const pending = await d1.prepare("SELECT id, topic, payload_json FROM outbox_events WHERE status IN ('pending','failed') AND available_at <= ? AND attempts < 10 ORDER BY created_at LIMIT ?").bind(now, limit).all<{ id: string; topic: string; payload_json: string }>();
  let completed = 0;
  for (const event of pending.results) {
    const claimed = await d1.prepare("UPDATE outbox_events SET status = 'processing', locked_at = ?, attempts = attempts + 1 WHERE id = ? AND status IN ('pending','failed')").bind(now, event.id).run();
    if (!claimed.meta.changes) continue;
    try {
      await handler({ topic: event.topic, payload: JSON.parse(event.payload_json) });
      await d1.prepare("UPDATE outbox_events SET status = 'completed', completed_at = ?, last_error = NULL WHERE id = ?").bind(Math.floor(Date.now() / 1000), event.id).run();
      completed += 1;
    } catch (error) {
      const delay = Math.min(3600, 2 ** Math.min(10, Number(claimed.meta.changes) + 1));
      await d1.prepare("UPDATE outbox_events SET status = 'failed', available_at = ?, last_error = ? WHERE id = ?").bind(now + delay, String(error).slice(0, 500), event.id).run();
    }
  }
  return { inspected: pending.results.length, completed };
}
