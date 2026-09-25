import { motion, AnimatePresence } from 'framer-motion';
import { Hand, HandFist, LucideIcon, Scissors } from 'lucide-react';
import { Button } from '../ui/button';
import { BaseArenaProps, RPSState } from '../../types';

const MOVES: { value: string; Icon: LucideIcon }[] = [
  { value: 'Rock', Icon: HandFist },
  { value: 'Paper', Icon: Hand },
  { value: 'Scissors', Icon: Scissors },
];

const findMove = (move?: string | null) => MOVES.find((m) => m.value === move);

function MoveSlot({ move }: { move?: string | null }) {
  const found = findMove(move);
  return (
    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 bg-secondary/50 border border-border">
      {found ? (
        <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-1">
          <found.Icon className="w-12 h-12 sm:w-16 sm:h-16" aria-hidden />
          <span className="text-sm font-medium">{found.value}</span>
        </motion.span>
      ) : (
        <span className="text-4xl text-muted-foreground/40" aria-hidden>?</span>
      )}
    </div>
  );
}

export function RPSArena({
  room,
  gameState,
  playerUid,
  opponent,
  isPlayer,
  isRoundOver,
  handleRPSMove,
  handleNextRound
}: BaseArenaProps) {
  const state = gameState as RPSState;
  const myMove = state.playerChoices?.[playerUid];
  const opponentMove = opponent ? state.playerChoices?.[opponent.playerUid] : null;
  const readyPlayers = state.readyPlayers || [];
  const amIReady = readyPlayers.includes(playerUid);
  const winner = state.lastResult?.winnerUid;
  const isDraw = state.lastResult?.isDraw;
  const playerCount = room.players.filter((p) => p.role === 'player').length;
  const myName = room.players.find((p) => p.playerUid === playerUid)?.name;
  const winnerName = room.players.find((p) => p.playerUid === winner)?.name;

  const resultTitle = isDraw
    ? "It's a draw"
    : isPlayer && winner === playerUid
      ? 'You won this round'
      : `${winnerName ?? 'Your opponent'} won this round`;

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8 relative">
      <AnimatePresence>
        {isRoundOver && (
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
              {findMove(myMove) && findMove(opponentMove) && (
                <p className="text-lg text-muted-foreground mb-2">
                  {myMove} vs {opponentMove}
                </p>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">{resultTitle}</h2>

              {isPlayer ? (
                <div className="flex flex-col gap-2 w-full min-w-52 sm:min-w-64">
                  <Button
                    variant={amIReady ? "outline" : "default"}
                    size="lg"
                    onClick={handleNextRound}
                    disabled={amIReady}
                    className="h-12 text-base"
                  >
                    {amIReady ? 'Waiting for opponent…' : 'Next round'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {readyPlayers.length} of {playerCount} ready
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Waiting for the players to start the next round…
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:flex-1 flex flex-col items-center text-center p-4 sm:p-6">
          <span className="text-sm font-medium text-muted-foreground mb-4">
            {isPlayer ? 'You' : myName ?? 'Player 1'}
          </span>
          <MoveSlot move={myMove} />
          {isPlayer && !isRoundOver && (
            <>
              <div className="flex gap-2 w-full justify-center">
                {MOVES.map((m) => (
                  <Button
                    key={m.value}
                    variant={myMove === m.value ? "default" : "outline"}
                    disabled={!!myMove}
                    onClick={() => handleRPSMove?.(m.value)}
                    className="h-auto flex-col gap-1 py-2 px-3 sm:px-4"
                  >
                    <m.Icon className="w-6 h-6" aria-hidden />
                    <span className="text-xs">{m.value}</span>
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {myMove ? 'Locked in' : 'Pick your move'}
              </p>
            </>
          )}
          {!isPlayer && !isRoundOver && (
            <p className="text-sm text-muted-foreground">{myMove ? 'Ready' : 'Choosing…'}</p>
          )}
        </div>

        <span className="text-lg font-semibold text-muted-foreground">vs</span>

        <div className="w-full sm:flex-1 flex flex-col items-center text-center p-4 sm:p-6">
          <span className="text-sm font-medium text-muted-foreground mb-4">
            {opponent?.name || 'Waiting for opponent…'}
          </span>
          <MoveSlot move={isRoundOver ? opponentMove : null} />
          {!isRoundOver && opponent && (
            <p className={`text-sm ${opponentMove ? 'text-foreground' : 'text-muted-foreground'}`}>
              {opponentMove ? 'Ready' : 'Choosing…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
