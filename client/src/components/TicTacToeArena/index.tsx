import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { BaseArenaProps, TicTacToeState } from '../../types';

export function TicTacToeArena({
  room,
  gameState,
  playerUid,
  isPlayer,
  handleTicTacToeMove,
  handleNextRound
}: BaseArenaProps) {
  const state = gameState as TicTacToeState;
  const { board = Array(9).fill(null), currentTurn, winner, readyPlayers = [], isDraw } = state;
  const isMyTurn = currentTurn === playerUid;
  const amIReady = readyPlayers.includes(playerUid);

  if (!board) {
    console.error("TicTacToe Error: Board is missing from gameState", gameState);
  }

  const canPlay = isMyTurn && isPlayer && !winner;

  const handleCellClick = (i: number) => {
    if (board[i] || !canPlay) return;
    handleTicTacToeMove?.(i);
  };

  const players = room.players.filter(p => p.role === 'player');
  const nameOf = (uid: string | null) => room.players.find(p => p.playerUid === uid)?.name;

  const resultTitle = isDraw
    ? "It's a draw"
    : isPlayer && winner === playerUid
      ? 'You win!'
      : `${nameOf(winner) ?? 'Your opponent'} wins`;

  const turnText = isMyTurn && isPlayer
    ? 'Your turn'
    : nameOf(currentTurn)
      ? `${nameOf(currentTurn)}'s turn`
      : 'Waiting…';

  return (
    <div className="w-full flex flex-col items-center gap-6 relative">
      <AnimatePresence>
        {(winner || isDraw) && (
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

      <p className={`text-base font-medium ${isMyTurn && isPlayer ? 'text-primary' : 'text-muted-foreground'}`}>
        {turnText}
      </p>

      <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] sm:max-w-[340px] aspect-square">
        {(board || []).map((cell: string | null, i: number) => {
          const clickable = !cell && canPlay;
          return (
            <motion.button
              key={i}
              type="button"
              aria-label={cell ? `Square ${i + 1}, ${cell}` : `Square ${i + 1}, empty`}
              disabled={!clickable}
              whileTap={clickable ? { scale: 0.95 } : {}}
              onClick={() => handleCellClick(i)}
              className={`
                flex items-center justify-center text-4xl sm:text-5xl font-bold rounded-xl border border-border bg-secondary/40 transition-colors
                ${clickable ? 'cursor-pointer hover:bg-secondary hover:border-primary/40' : 'cursor-default'}
                ${cell === 'X' ? 'text-primary' : 'text-destructive'}
              `}
            >
              <AnimatePresence mode="wait">
                {cell && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
