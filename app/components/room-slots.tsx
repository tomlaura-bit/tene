import { ROOM_CAPACITY, roomProgress } from "../../lib/room-reservation";
import type { ReactNode } from "react";

export function RoomSlots<T extends { userId: string }>({
  players,
  renderPlayer,
}: {
  players: T[];
  renderPlayer: (player: T) => ReactNode;
}) {
  const visiblePlayers = players.slice(0, ROOM_CAPACITY);
  const vacantSlots = ROOM_CAPACITY - visiblePlayers.length;

  return (
    <div className="room-people" aria-label={`${visiblePlayers.length} de ${ROOM_CAPACITY} jugadores`}>
      <div className="room-capacity">
        <span>{visiblePlayers.length} / {ROOM_CAPACITY} jugadores</span>
        <div className="mini-progress" role="progressbar" aria-valuemin={0} aria-valuemax={ROOM_CAPACITY} aria-valuenow={visiblePlayers.length}>
          <i style={{ width: `${roomProgress(visiblePlayers.length)}%` }} />
        </div>
      </div>
      <div className="avatar-strip">
        {visiblePlayers.map(renderPlayer)}
        {Array.from({ length: vacantSlots }, (_, index) => (
          <span className="vacant-avatar" aria-label="Slot disponible" key={`vacant-${index}`} />
        ))}
      </div>
    </div>
  );
}
