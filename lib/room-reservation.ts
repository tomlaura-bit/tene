export const ROOM_CAPACITY = 10;

export const claimRoomSlotSql = `
WITH slots(slot_number) AS (
  VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10)
)
INSERT INTO room_players
  (id, room_id, user_id, team, is_captain, slot_number, joined_at)
SELECT ?1, ?2, ?3, 'pool', 0, slots.slot_number, ?4
FROM slots
WHERE NOT EXISTS (
  SELECT 1 FROM room_players WHERE room_id = ?2 AND user_id = ?3
)
AND NOT EXISTS (
  SELECT 1 FROM room_players
  WHERE room_id = ?2 AND slot_number = slots.slot_number
)
ORDER BY slots.slot_number
LIMIT 1
ON CONFLICT DO NOTHING
RETURNING slot_number
`;

export async function claimRoomSlot(
  d1: D1Database,
  input: { id: string; roomId: string; userId: string; joinedAt?: number },
) {
  const row = await d1
    .prepare(claimRoomSlotSql)
    .bind(
      input.id,
      input.roomId,
      input.userId,
      input.joinedAt ?? Math.floor(Date.now() / 1000),
    )
    .first<{ slot_number: number }>();
  return row?.slot_number ?? null;
}

export async function releaseRoomSlot(d1: D1Database, reservationId: string) {
  await d1
    .prepare("DELETE FROM room_players WHERE id = ?1")
    .bind(reservationId)
    .run();
}

export function roomProgress(playerCount: number) {
  const safeCount = Math.min(ROOM_CAPACITY, Math.max(0, playerCount));
  return (safeCount / ROOM_CAPACITY) * 100;
}
