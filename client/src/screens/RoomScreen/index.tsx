import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useRoomLogic } from '../../hooks/useRoomLogic';
import { InactivityWarning } from '../../components/InactivityWarning';
import { SessionSupersededScreen } from '../../components/SessionSupersededScreen';
import { GAME_NAMES } from '../../constants/gameConstants';

const MIN_PLAYERS_TO_START = 2;
const COPIED_FEEDBACK_MS = 2000;

export default function RoomScreen() {
  const { id: roomId } = useParams<{ id: string }>();
  const {
    room,
    playerUid,
    ttlWarning,
    superseded,
    handleStartGame,
    handleExtendSession,
    handleLeave
  } = useRoomLogic(roomId);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (superseded) return <SessionSupersededScreen />;

  if (room === null) return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-semibold mb-2">This room no longer exists</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">It may have closed after everyone left, or the code might be wrong.</p>
      <Button onClick={() => navigate('/')}>Back to lobby</Button>
    </div>
  );

  if (!room) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary"></div>
    </div>
  );

  if (room.status === "playing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground">Starting the game…</p>
      </div>
    );
  }

  const players = room.players.filter(p => p.role === 'player');
  const spectators = room.players.filter(p => p.role === 'spectator');
  const host = room.players[0];
  const isHost = host?.playerUid === playerUid;
  const myPlayer = room.players.find(p => p.playerUid === playerUid);
  const isSpectator = myPlayer?.role === "spectator";
  const canStart = players.length >= MIN_PLAYERS_TO_START;

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the code is still visible to copy by hand.
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8">
      <InactivityWarning ttlWarning={ttlWarning} onExtend={handleExtendSession} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl flex flex-col gap-8">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{GAME_NAMES[room.gameType] ?? room.gameType}</p>
            <h1 className="text-3xl font-bold tracking-tight">Waiting room</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Room code</span>
            <span className="font-mono font-semibold text-lg">{room.id}</span>
            <Button variant="ghost" size="icon" onClick={copyRoomCode} aria-label="Copy room code">
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 flex flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Players ({players.length}/{room.maxPlayers})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: room.maxPlayers }).map((_, idx) => {
                const p = players[idx];
                const isMe = p?.playerUid === playerUid;
                return (
                  <Card key={idx} className={p ? (isMe ? 'border-primary/50' : '') : 'border-dashed opacity-60'}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {p?.avatar ? (
                          <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                        ) : p ? (
                          <span className="text-xl font-semibold">{p.name.charAt(0).toUpperCase()}</span>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {p ? p.name : 'Waiting for a player…'}
                        </p>
                        {p && (
                          <p className="text-sm text-muted-foreground">
                            {[
                              idx === 0 && 'Host',
                              isMe && 'You',
                              p.status === 'offline' && 'Offline',
                            ].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-2">
              {isHost ? (
                <div className="flex flex-col gap-2">
                  <Button size="lg" className="w-full h-12 text-base" disabled={!canStart} onClick={handleStartGame}>
                    Start game
                  </Button>
                  {!canStart && (
                    <p className="text-sm text-muted-foreground text-center">
                      You need at least {MIN_PLAYERS_TO_START} players to start. Share the room code to invite someone.
                    </p>
                  )}
                </div>
              ) : isSpectator ? (
                <p className="p-4 rounded-lg bg-secondary/50 text-sm text-center text-muted-foreground">
                  You're watching this room. If a player leaves, you'll take their spot.
                </p>
              ) : (
                <p className="p-4 rounded-lg bg-secondary/50 text-sm text-center text-muted-foreground">
                  Waiting for {host?.name ?? 'the host'} to start the game…
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">Spectators</h2>

            <Card>
              <CardContent className="p-4 flex flex-col gap-2">
                {spectators.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No one is watching yet.</p>
                ) : (
                  spectators.map((s) => (
                    <p key={s.playerUid} className="text-sm py-1">
                      {s.name}{s.playerUid === playerUid && <span className="text-muted-foreground"> (you)</span>}
                    </p>
                  ))
                )}
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={handleLeave}
              className="w-full hover:text-destructive hover:border-destructive/40"
            >
              Leave room
            </Button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
