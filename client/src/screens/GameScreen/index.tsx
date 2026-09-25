import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useGameLogic } from "../../hooks/useGameLogic";

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
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-semibold mb-2">This game has ended</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          The room was closed, or the link isn't valid anymore.
        </p>
        <Button onClick={() => navigate("/")}>Back to lobby</Button>
      </div>
    );

  if (!room || !room.gameState)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary"></div>
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
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8">
      <InactivityWarning
        ttlWarning={ttlWarning}
        onExtend={handleExtendSession}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <GameHeader
          room={room}
          playerUid={playerUid}
          player={watchPlayer1}
          opponent={watchPlayer2}
          isSpectator={isSpectator}
        />

        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-10 flex flex-col items-center w-full min-h-[300px] sm:min-h-[400px] justify-center relative">
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
          </CardContent>
        </Card>

        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="hover:text-destructive hover:border-destructive/40"
            onClick={handleLeave}
          >
            Leave game
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
