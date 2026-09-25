import type { DiagramConfig } from "../diagram.types";
import { at } from "./grid";

export const moveLifecycleDiagram: DiagramConfig = {
  title: "Lifecycle of a move",
  subtitle: "What happens between a player's click and every screen in the room updating.",
  nodes: [
    {
      id: "arena",
      type: "frontend",
      position: at(3, 0),
      data: {
        label: "Game arena UI",
        description: "The player picks a move in the RPS, Tic-Tac-Toe or Snakes & Ladders arena.",
      },
    },
    {
      id: "emit",
      type: "frontend",
      position: at(3, 1),
      data: {
        label: "Socket emit",
        description: "The client emits the move with the room id and waits for an acknowledgement.",
      },
    },
    {
      id: "handshake",
      type: "backend",
      position: at(3, 2),
      data: {
        label: "Socket auth",
        description: "Rejects events from sockets whose session was superseded or expired.",
      },
    },
    {
      id: "turn",
      type: "backend",
      position: at(3, 3),
      data: {
        label: "Turn validation",
        description: "The room service checks the player is seated and that it is their turn.",
      },
    },
    {
      id: "engine",
      type: "backend",
      position: at(3, 4),
      data: {
        label: "Game engine",
        description: "The registered engine applies the move and decides whether the game is over.",
      },
    },
    {
      id: "bot",
      type: "backend",
      position: at(6, 5),
      data: { label: "Bot reply", description: "In vs-computer rooms the bot plays next." },
    },
    {
      id: "store",
      type: "data",
      position: at(0, 5),
      data: { label: "Save result", description: "Finished games are written to MongoDB." },
    },
    {
      id: "broadcast",
      type: "frontend",
      position: at(3, 6),
      data: {
        label: "Room broadcast",
        description: "Every client in the room receives the new state and re-renders.",
      },
    },
  ],
  edges: [
    { id: "a-e", source: "arena", target: "emit", label: "click" },
    { id: "e-h", source: "emit", target: "handshake", label: "make move", animated: true },
    { id: "h-t", source: "handshake", target: "turn" },
    { id: "t-g", source: "turn", target: "engine", label: "valid" },
    { id: "g-b", source: "engine", target: "bot", label: "vs computer" },
    { id: "g-s", source: "engine", target: "store", label: "game over" },
    { id: "g-r", source: "engine", target: "broadcast", label: "new state", animated: true },
  ],
};
