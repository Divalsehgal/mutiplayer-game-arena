import { Room, SnakeLadderState, GameState } from "../../models";
import { SNAKE_LADDER_BOARD } from "./constants";

export const snakeLadderGameHandler = {
  getInitialState(): SnakeLadderState {
    return {
      status: "waiting-for-players",
      positions: {}, // uid -> pos
      currentTurn: null,
      lastRoll: null,
      winner: null,
      readyPlayers: [],
      logs: ["Waiting for players to join."]
    };
  },

  handleReady({ room, gameState, playerUid }: { room: Room; gameState: GameState; playerUid: string }) {
    const state = gameState as SnakeLadderState;
    const players = room.players.filter((p) => p.role === "player");
    
    // Critical: Require at least 2 players to start
    if (players.length < 2) {
      return { newGameState: gameState };
    }

    const { readyPlayers = [], status: currentStatus } = state;

    // Initial start from lobby: Host override
    if (currentStatus === 'waiting-for-players') {
        const positions: Record<string, number> = {};
        players.forEach((p) => (positions[p.playerUid] = 1));

        return {
            newGameState: {
              ...gameState,
              status: "playing",
              positions,
              currentTurn: players[0].playerUid,
              winner: null,
              lastRoll: null,
              readyPlayers: [],
              logs: ["Game started. Good luck!"]
            }
        };
    }

    if (!readyPlayers.includes(playerUid)) {
        readyPlayers.push(playerUid);
    }

    // Logic for re-start (rematch)
    if (readyPlayers.length >= players.length) {
        const positions: Record<string, number> = {};
        players.forEach((p) => (positions[p.playerUid] = 1));

        return {
            newGameState: {
              ...gameState,
              status: "playing",
              positions,
              currentTurn: players[0].playerUid,
              winner: null,
              lastRoll: null,
              readyPlayers: [],
              logs: ["New game started."]
            }
        };
    }

    return {
      newGameState: {
        ...state,
        readyPlayers
      }
    };
  },

  handleMove({ room, gameState, playerUid }: { room: Room; gameState: GameState; playerUid: string }) {
    const state = gameState as SnakeLadderState;
    // Critical: Stop game if any player leaves
    const players = room.players.filter((p) => p.role === "player");
    if (players.length < 2) {
      return {
        newGameState: {
          ...gameState,
          status: "waiting-for-players",
          logs: ["Your opponent left the game. Heading back to the waiting room."]
        }
      };
    }

    if (state.winner || state.currentTurn !== playerUid) {
      return { newGameState: state };
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    let newPos = (state.positions[playerUid] || 1) + roll;
    let log = `${room.players.find((p) => p.playerUid === playerUid)?.name} rolled a ${roll}.`;

    if (newPos > 100) {
      newPos = state.positions[playerUid];
      log += ` Needs an exact roll to reach 100.`;
    } else {
      if (SNAKE_LADDER_BOARD.snakes[newPos]) {
        newPos = SNAKE_LADDER_BOARD.snakes[newPos];
        log += ` Hit a snake and slid down to ${newPos}.`;
      } else if (SNAKE_LADDER_BOARD.ladders[newPos]) {
        newPos = SNAKE_LADDER_BOARD.ladders[newPos];
        log += ` Climbed a ladder up to ${newPos}.`;
      }
    }

    const newPositions = { ...state.positions, [playerUid]: newPos };
    const currentIndex = players.findIndex((p) => p.playerUid === playerUid);
    const nextPlayer = players[(currentIndex + 1) % players.length].playerUid;

    let winner = null;
    let newStatus = state.status;
    if (newPos === 100) {
      winner = playerUid;
      newStatus = "finished";
      log += ` Reached 100 and won!`;
    }

    return {
      newGameState: {
        ...state,
        status: newStatus,
        positions: newPositions,
        currentTurn: winner ? null : nextPlayer,
        lastRoll: roll,
        winner,
        logs: [log, ...state.logs].slice(0, 10)
      } as SnakeLadderState,
      winnerUid: winner
    };
  },

  projectPublicState({ gameState }: { gameState: GameState }): GameState {
    return gameState;
  }
};
