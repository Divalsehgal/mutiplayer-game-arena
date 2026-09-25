import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Users } from 'lucide-react';
import { RoomState } from '../../../types';
import { GAME_NAMES } from '../../../constants/gameConstants';

interface PublicRoomsListProps {
  rooms: RoomState[];
  onJoin: (roomId: string) => void;
}

export const PublicRoomsList: React.FC<PublicRoomsListProps> = ({ rooms, onJoin }) => {
  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Open rooms</h2>
        {rooms.length > 0 && (
          <span className="text-sm text-muted-foreground">{rooms.length} open</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {rooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-xl"
            >
              <p className="font-medium">No open rooms right now</p>
              <p className="text-sm text-muted-foreground mt-1">Create one and it'll show up here for others to join.</p>
            </motion.div>
          ) : (
            rooms.map((room) => {
              const activePlayers = room.players.filter((p) => p.role === 'player').length;
              const isFull = activePlayers >= room.maxPlayers;
              const hostName = room.players[0]?.name;

              return (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {GAME_NAMES[room.gameType] ?? room.gameType}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          {hostName && <span className="truncate">Hosted by {hostName}</span>}
                          {hostName && <span aria-hidden>·</span>}
                          <span className="flex items-center gap-1 shrink-0">
                            <Users className="w-3.5 h-3.5" />
                            {activePlayers}/{room.maxPlayers}
                          </span>
                          <span aria-hidden>·</span>
                          <span className="font-mono shrink-0">{room.id}</span>
                        </p>
                      </div>
                      <Button
                        variant={isFull ? "outline" : "default"}
                        onClick={() => onJoin(room.id)}
                        className="shrink-0"
                      >
                        {isFull ? 'Watch' : 'Join'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
