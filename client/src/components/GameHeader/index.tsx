import { motion } from 'framer-motion';
import { RoomState, Participant, GameState, isPlayer, hasRoundCount } from '../../types';

interface GameHeaderProps {
  room: RoomState | null | undefined;
  playerUid: string;
  player: Participant | undefined;
  opponent: Participant | undefined;
  isSpectator?: boolean;
}

export function GameHeader({ room, player, opponent, isSpectator }: GameHeaderProps) {
  if (!room || !room.gameState) return null;
  const gameState = room.gameState as GameState;

  const player1Score = player && isPlayer(player) ? player.score : 0;
  const player2Score = opponent && isPlayer(opponent) ? opponent.score : 0;

  return (
    <div className="flex justify-between items-center w-full px-4 sm:px-8 py-4 bg-card border border-border rounded-2xl mb-6">
      <div className="flex flex-col items-start min-w-0">
        <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[100px] sm:max-w-none">
          {player?.name || 'Player 1'}{!isSpectator && ' (you)'}
        </span>
        <motion.span key={player1Score} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-3xl sm:text-4xl font-bold tabular-nums">
          {player1Score || 0}
        </motion.span>
      </div>

      <div className="flex flex-col items-center gap-1 mx-2 text-center">
        {isSpectator && (
          <span className="text-xs text-accent font-medium">Watching</span>
        )}
        {hasRoundCount(gameState) && (
          <span className="text-sm font-medium">Round {gameState.roundCount}</span>
        )}
        {gameState.timer !== undefined && gameState.timer > 0 && (
          <span className="text-sm font-mono text-muted-foreground tabular-nums">{gameState.timer}s left</span>
        )}
      </div>

      <div className="flex flex-col items-end min-w-0 text-right">
        <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[100px] sm:max-w-none">
          {opponent ? opponent.name : 'Waiting for opponent…'}
        </span>
        <motion.span key={player2Score} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-3xl sm:text-4xl font-bold tabular-nums">
          {opponent ? player2Score || 0 : '–'}
        </motion.span>
      </div>
    </div>
  );
}
