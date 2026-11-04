import React from 'react';
import { Button } from '../../../components/ui/button';
import { RoomState } from '../../../types';
import { GAME_NAMES } from '../../../constants/gameConstants';

interface PublicRoomsListProps {
  rooms: RoomState[];
  onJoin: (roomId: string) => void;
}

export const PublicRoomsList: React.FC<PublicRoomsListProps> = ({ rooms, onJoin }) => {
  return (
    <section aria-labelledby="open-rooms-title">
      <h2 id="open-rooms-title" className="mb-3 text-lg font-semibold">Open rooms</h2>

      {rooms.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-muted-foreground">No open rooms right now.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rooms.map((room) => {
            const activePlayers = room.players.filter((p) => p.role === 'player').length;
            const isFull = activePlayers >= room.maxPlayers;
            const hostName = room.players[0]?.name;

            return (
              <li key={room.id} className="flex items-center justify-between gap-4 rounded-xl bg-card p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{GAME_NAMES[room.gameType] ?? room.gameType}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {hostName && `${hostName} · `}
                    <span className="tabular">{activePlayers}/{room.maxPlayers} players</span>
                  </p>
                </div>
                <Button variant={isFull ? 'outline' : 'default'} size="sm" onClick={() => onJoin(room.id)}>
                  {isFull ? 'Watch' : 'Join'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
