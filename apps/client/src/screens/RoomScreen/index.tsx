import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useRoomLogic } from '../../hooks/useRoomLogic';
import { usePageMeta } from '../../hooks/usePageMeta';
import { InactivityWarning } from '../../components/InactivityWarning';
import { SessionSupersededScreen } from '../../components/SessionSupersededScreen';
import { GAME_NAMES } from '@arena/shared';
import { Spinner } from "../../components/ui/spinner";

const MIN_PLAYERS_TO_START = 2;
const COPIED_FEEDBACK_MS = 2000;

export default function RoomScreen() {
  usePageMeta({ title: 'Waiting room', noindex: true });

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
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-6 text-2xl font-semibold">This room no longer exists</h1>
      <Button onClick={() => navigate('/play')}>Back to games</Button>
    </div>
  );

  if (!room || room.status === 'playing') return <Spinner />;

  const players = room.players.filter(p => p.role === 'player');
  const spectators = room.players.filter(p => p.role === 'spectator');
  const host = room.players[0];
  const isHost = host?.playerUid === playerUid;
  const myPlayer = room.players.find(p => p.playerUid === playerUid);
  const isSpectator = myPlayer?.role === 'spectator';
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
    <div className="page-frame grid gap-12 py-8 sm:py-12 lg:grid-cols-2 lg:gap-16">
      <InactivityWarning ttlWarning={ttlWarning} onExtend={handleExtendSession} />

      <div>
        <p className="text-muted-foreground">{GAME_NAMES[room.gameType] ?? room.gameType}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Waiting room</h1>

        <div data-ui className="mt-8 bg-white p-6 text-black sm:p-8">
          <p className="text-sm text-[#444444]">Room code</p>
          <p className="tabular mt-2 text-[clamp(56px,7vw,104px)] font-semibold leading-none tracking-tight">{room.id}</p>
          <p className="mt-6 max-w-[36ch] text-[#333333]">
            Read it out or send it. Your friend enters it on the Play page and takes the open seat.
          </p>
          <button
            type="button"
            onClick={copyRoomCode}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[#262626] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {copied ? <Check className="h-4 w-4 text-accent" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:pt-[100px]">
        <h2 className="mb-3 text-lg font-semibold">
          Players <span className="tabular font-normal text-muted-foreground">{players.length}/{room.maxPlayers}</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {Array.from({ length: room.maxPlayers }).map((_, idx) => {
            const p = players[idx];
            const isMe = p?.playerUid === playerUid;
            return (
              <li key={idx} className={`flex items-center gap-4 rounded-xl p-4 ${p ? 'bg-card' : 'bg-card/50'}`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-raised">
                  {p?.avatar ? (
                    <img src={p.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : p ? (
                    <span className="font-semibold">{p.name.charAt(0).toUpperCase()}</span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className={`truncate font-medium ${p ? '' : 'text-faint'}`}>{p ? p.name : 'Open seat'}</p>
                  {p && (
                    <p className="text-sm text-muted-foreground">
                      {[idx === 0 && 'Host', isMe && 'You', p.status === 'offline' && 'Offline'].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {spectators.length > 0 && (
          <>
            <h2 className="mb-3 mt-10 text-lg font-semibold">Watching</h2>
            <p className="text-muted-foreground">
              {spectators.map((s) => (s.playerUid === playerUid ? `${s.name} (you)` : s.name)).join(', ')}
            </p>
          </>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={handleLeave}>
            Leave room
          </Button>
          {isHost ? (
            <div className="flex items-center gap-4">
              {!canStart && <span className="text-sm text-muted-foreground">Waiting for another player</span>}
              <Button size="lg" disabled={!canStart} onClick={handleStartGame}>
                Start game
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {isSpectator ? "You're watching" : `Waiting for ${host?.name ?? 'the host'} to start`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
