import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useGameLogic } from "../../hooks/useGameLogic";
import { usePageMeta } from "../../hooks/usePageMeta";

// Components
import { InactivityWarning } from "../../components/InactivityWarning";
import { GameHeader } from "../../components/GameHeader";
import { RPSArena } from "../../components/RPSArena";
import { SnakeLadderArena } from "../../components/SnakeLadderArena";
import { TicTacToeArena } from "../../components/TicTacToeArena";
import { SessionSupersededScreen } from "../../components/SessionSupersededScreen";

import { GameState, BaseArenaProps } from "../../types";

const ARENA_COMPONENTS: Record<string, React.ComponentType<BaseArenaProps>> = {
  RPS: RPSArena,
  SNAKE_LADDER: SnakeLadderArena,
  TIC_TAC_TOE: TicTacToeArena,
};

export default function GameScreen() {
  usePageMeta({ title: "Game", noindex: true });
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    room,
    playerUid,
    ttlWarning,
    superseded,
    handleExtendSession,
    handleLeave,
    handleRPSMove,
    handleSnakeLadderMove,
    handleTicTacToeMove,
    handleNextRound,
  } = useGameLogic(roomId);

  if (superseded) return <SessionSupersededScreen />;

  if (room === null)
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <h1 className="mb-6 text-2xl font-semibold">This game has ended</h1>
        <Button onClick={() => navigate("/play")}>Back to games</Button>
      </div>
    );

  if (!room || !room.gameState)
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-raised border-t-white" />
      </div>
    );

  const gameState = room.gameState as GameState;

  const player = room.players.find((p) => p.playerUid === playerUid);
  const opponent = room.players.find(
    (p) => p.playerUid !== playerUid && p.role === "player",
  );
  const isSpectator = player?.role === "spectator";
  const isPlayer = player?.role === "player";

  // If spectator, we watch first two players. If player, we watch ourselves + opponent.
  const playersInRoom = room.players.filter((p) => p.role === "player");
  const watchPlayer1 = isSpectator ? playersInRoom[0] : player;
  const watchPlayer2 = isSpectator ? playersInRoom[1] : opponent;

  const isRoundOver = gameState.status === "waiting_for_ready";
  const ArenaComponent = ARENA_COMPONENTS[room.gameType];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <InactivityWarning
        ttlWarning={ttlWarning}
        onExtend={handleExtendSession}
      />

      <h1 className="sr-only">Game</h1>
        <GameHeader
          room={room}
          player={watchPlayer1}
          opponent={watchPlayer2}
          isSpectator={isSpectator}
        />

        <div className="relative flex min-h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-card p-4 sm:min-h-[400px] sm:p-10">
            {ArenaComponent ? (
              <ArenaComponent
                room={room}
                gameState={gameState}
                playerUid={watchPlayer1?.playerUid || playerUid}
                opponent={watchPlayer2}
                isPlayer={isPlayer && !isSpectator}
                isRoundOver={isRoundOver}
                handleRPSMove={handleRPSMove}
                handleSnakeLadderMove={handleSnakeLadderMove}
                handleTicTacToeMove={handleTicTacToeMove}
                handleNextRound={handleNextRound}
              />
            ) : (
              <p className="text-muted-foreground">
                This game isn't available yet.
              </p>
            )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={handleLeave}>
            Leave game
          </Button>
        </div>
    </div>
  );
}
