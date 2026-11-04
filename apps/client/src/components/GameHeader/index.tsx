import { RoomState, Participant, GameState, isPlayer, hasRoundCount } from '../../types';
import { GAME_NAMES } from '@arena/shared';

interface GameHeaderProps {
  room: RoomState | null | undefined;
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
    <div className="mb-4 flex w-full items-center justify-between gap-4 rounded-xl bg-card px-5 py-4 sm:px-6">
      <div className="flex min-w-0 flex-col items-start">
        <span className="max-w-[110px] truncate text-sm text-muted-foreground sm:max-w-none">
          {player?.name || 'Player 1'}{!isSpectator && ' (you)'}
        </span>
        <span className="tabular text-3xl font-semibold text-accent">{player1Score || 0}</span>
      </div>

      <div className="flex flex-col items-center text-center text-sm">
        <span className="font-medium">{GAME_NAMES[room.gameType] ?? room.gameType}</span>
        <span className="text-muted-foreground">
          {[isSpectator && 'Watching', hasRoundCount(gameState) && `Round ${gameState.roundCount}`].filter(Boolean).join(' · ')}
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-end text-right">
        <span className="max-w-[110px] truncate text-sm text-muted-foreground sm:max-w-none">
          {opponent ? opponent.name : 'Waiting…'}
        </span>
        <span className="tabular text-3xl font-semibold">{opponent ? player2Score || 0 : '–'}</span>
      </div>
    </div>
  );
}
