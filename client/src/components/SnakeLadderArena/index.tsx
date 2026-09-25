import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '../ui/button';
import { ParticipantBase, BaseArenaProps, SnakeLadderState } from '../../types';
import { SNAKE_LADDER_BOARD } from '../../constants/gameConstants';

export function SnakeLadderArena({
  room,
  gameState,
  playerUid,
  isPlayer,
  handleSnakeLadderMove,
  handleNextRound
}: BaseArenaProps) {
  const state = gameState as SnakeLadderState;
  const isMyTurn = state.currentTurn === playerUid;
  const positions = state.positions || {};
  const logs = state.logs || [];
  const winner = state.winner;
  const readyPlayers = state.readyPlayers || [];
  const amIReady = readyPlayers.includes(playerUid);
  const players = room.players.filter(p => p.role === 'player');
  const nameOf = (uid: string | null) => room.players.find(p => p.playerUid === uid)?.name;
  const currentTurnName = nameOf(state.currentTurn);

  const resultTitle = isPlayer && winner === playerUid
    ? 'You win!'
    : `${nameOf(winner) ?? 'Your opponent'} wins`;

  return (
    <div className="w-full flex flex-col items-center gap-4 sm:gap-6 relative">
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-[-16px] sm:inset-[-40px] z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center text-center p-4 sm:p-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">{resultTitle}</h2>

              {isPlayer ? (
                <div className="flex flex-col gap-2 w-full min-w-[200px] sm:min-w-[240px]">
                  <Button
                    variant={amIReady ? "outline" : "default"}
                    size="lg"
                    onClick={handleNextRound}
                    disabled={amIReady}
                    className="h-12 text-base"
                  >
                    {amIReady ? 'Waiting for opponent…' : 'Play again'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {readyPlayers.length} of {players.length} ready
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Waiting for the players to start the next game…
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="grid grid-cols-10 gap-0.5 sm:gap-1 bg-secondary/30 p-1 sm:p-2 rounded-xl border border-border w-full aspect-square max-w-[300px] sm:max-w-[500px]">
        {Array.from({ length: 100 }, (_, i) => {
          const cellNum = 100 - i;
          const row = Math.floor((cellNum - 1) / 10);
          const col = (cellNum - 1) % 10;
          const displayNum = row % 2 === 1 ? (row * 10) + (10 - col) : cellNum;

          const ladderTo = SNAKE_LADDER_BOARD.ladders[displayNum];
          const snakeTo = SNAKE_LADDER_BOARD.snakes[displayNum];
          const title = ladderTo
            ? `Ladder: climb to ${ladderTo}`
            : snakeTo
              ? `Snake: slide down to ${snakeTo}`
              : undefined;

          return (
            <div
              key={displayNum}
              title={title}
              className={`relative flex items-center justify-center text-[7px] sm:text-[9px] rounded-sm aspect-square ${
                ladderTo
                  ? 'bg-success/25'
                  : snakeTo
                    ? 'bg-destructive/25'
                    : displayNum % 2 === 0 ? 'bg-secondary/40' : 'bg-secondary/70'
              }`}
            >
              <span className="absolute top-0 left-0.5 text-muted-foreground/60">{displayNum}</span>
              {ladderTo && <ArrowUp className="w-3 h-3 sm:w-5 sm:h-5 text-success" aria-hidden />}
              {snakeTo && <ArrowDown className="w-3 h-3 sm:w-5 sm:h-5 text-destructive" aria-hidden />}

              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5">
                {room.players.filter((p: ParticipantBase) => positions[p.playerUid] === displayNum).map((p: ParticipantBase) => (
                  <motion.div
                    key={p.playerUid}
                    layoutId={p.playerUid}
                    className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-white shadow ${p.playerUid === playerUid ? 'bg-primary z-10' : 'bg-accent'}`}
                    title={p.name}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ArrowUp className="w-3.5 h-3.5 text-success" aria-hidden /> Ladder
        </span>
        <span className="flex items-center gap-1.5">
          <ArrowDown className="w-3.5 h-3.5 text-destructive" aria-hidden /> Snake
        </span>
        {players.map((p) => (
          <span key={p.playerUid} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${p.playerUid === playerUid ? 'bg-primary' : 'bg-accent'}`} />
            {p.playerUid === playerUid && isPlayer ? 'You' : p.name} · {positions[p.playerUid] || 1}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-[300px] sm:max-w-[500px]">
        <div className="flex items-center gap-4 w-full justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Last roll</span>
            <span className="text-2xl sm:text-3xl font-bold tabular-nums">{state.lastRoll || '–'}</span>
          </div>

          {isPlayer ? (
            <Button
              size="lg"
              className="flex-1 max-w-[200px] h-12 text-base"
              disabled={!isMyTurn || !!winner}
              onClick={handleSnakeLadderMove}
            >
              {isMyTurn ? 'Roll dice' : `Waiting for ${currentTurnName ?? 'opponent'}…`}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              {currentTurnName ? `${currentTurnName}'s turn` : ''}
            </span>
          )}
        </div>

        {logs.length > 0 && (
          <div className="w-full bg-secondary/30 rounded-lg p-2 sm:p-3 max-h-[80px] sm:max-h-[100px] overflow-y-auto">
            {logs.map((log: string, i: number) => (
              <p key={i} className="text-xs text-muted-foreground mb-1 last:mb-0 text-left">
                {log}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
