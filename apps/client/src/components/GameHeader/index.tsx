import { RoomState, Participant, GameState, isPlayer, hasRoundCount } from '../../types';
import { GAME_NAMES } from '@arena/shared';

interface GameHeaderProps {
  room: RoomState | null | undefined;
  player: Participant | undefined;
  opponent: Participant | undefined;
  isSpectator?: boolean;
}

/** The score slip: a paper tally beside the board, the same paper as the home page's puzzle and receipt. */
export function GameHeader({ room, player, opponent, isSpectator }: GameHeaderProps) {
  if (!room || !room.gameState) return null;
  const gameState = room.gameState as GameState;

  const player1Score = player && isPlayer(player) ? player.score : 0;
  const player2Score = opponent && isPlayer(opponent) ? opponent.score : 0;
  const meta = [isSpectator && 'Watching', hasRoundCount(gameState) && `Round ${gameState.roundCount}`].filter(Boolean).join(' · ');

  const row = (name: string, score: string | number, mine: boolean) => (
    <li className="flex items-end gap-2">
      <span className="min-w-0 truncate">{name}</span>
      <span aria-hidden className="mb-1.5 min-w-4 flex-1 border-b-4 border-dotted border-[#9a9a9a]" />
      <span className={`tabular shrink-0 text-4xl font-semibold leading-none ${mine ? 'rounded-sm bg-accent px-1.5' : ''}`}>
        {score}
      </span>
    </li>
  );

  return (
    <div data-ui className="w-full bg-white p-6 text-black">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold">{GAME_NAMES[room.gameType] ?? room.gameType}</h1>
        {meta && <span className="text-sm text-[#444444]">{meta}</span>}
      </div>
      <ul className="mt-6 flex flex-col gap-4">
        {row(`${player?.name || 'Player 1'}${isSpectator ? '' : ' (you)'}`, player1Score || 0, !isSpectator)}
        {row(opponent ? opponent.name : 'Waiting…', opponent ? player2Score || 0 : '–', false)}
      </ul>
    </div>
  );
}
