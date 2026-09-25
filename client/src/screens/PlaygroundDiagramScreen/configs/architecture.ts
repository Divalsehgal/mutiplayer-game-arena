import type { DiagramConfig } from "../diagram.types";
import { at } from "./grid";

const WIDE_CURVE = 0.4;

export const architectureDiagram: DiagramConfig = {
  title: "Game Arena architecture",
  subtitle:
    "How a request travels from the React client through the Express and Socket.IO servers to MongoDB and Google.",
  nodes: [
    {
      id: "spa",
      type: "frontend",
      position: at(4, 0),
      data: {
        label: "React SPA",
        description:
          "Vite + React Router app. Zustand stores hold auth and room state; screens cover lobby, room and game.",
      },
    },
    {
      id: "rest-client",
      type: "frontend",
      position: at(2, 1),
      data: {
        label: "REST client",
        description:
          "Fetch wrapper that sends the JWT cookie and silently refreshes the session on a 401.",
      },
    },
    {
      id: "socket-client",
      type: "frontend",
      position: at(6, 1),
      data: {
        label: "Socket.IO client",
        description:
          "Single shared socket. Reconnects automatically and powers the live lobby, rooms and moves.",
      },
    },
    {
      id: "api",
      type: "backend",
      position: at(2, 2),
      data: {
        label: "Express API",
        description:
          "REST routes for auth, users, rooms and games. Requests pass through validation and auth middleware.",
      },
    },
    {
      id: "socket-server",
      type: "backend",
      position: at(6, 2),
      data: {
        label: "Socket.IO server",
        description:
          "Authenticates the handshake, then relays room and game events and broadcasts state to each room.",
      },
    },
    {
      id: "auth",
      type: "backend",
      position: at(0, 3),
      data: {
        label: "Auth service",
        description:
          "Email/password and Google sign-in. Issues access and refresh tokens and enforces one active session per user.",
      },
    },
    {
      id: "user",
      type: "backend",
      position: at(2, 3),
      data: {
        label: "User service",
        description: "Profile reads and updates for the signed-in player.",
      },
    },
    {
      id: "room",
      type: "backend",
      position: at(4, 3),
      data: {
        label: "Room service",
        description:
          "Creates public and private rooms, tracks players and seats, and cleans up inactive rooms.",
      },
    },
    {
      id: "game",
      type: "backend",
      position: at(6, 3),
      data: {
        label: "Game engine registry",
        description:
          "Looks up the engine for Rock Paper Scissors, Tic-Tac-Toe or Snakes & Ladders and applies each move.",
      },
    },
    {
      id: "bot",
      type: "backend",
      position: at(8, 4),
      data: {
        label: "Bot service",
        description: "Plays the computer's turns in vs-computer rooms.",
      },
    },
    {
      id: "google",
      type: "external",
      position: at(0, 5),
      data: {
        label: "Google OAuth",
        description: "Verifies Google ID tokens during sign-in.",
      },
    },
    {
      id: "mongo",
      type: "data",
      position: at(4, 5),
      data: {
        label: "MongoDB",
        description:
          "Mongoose models for users, sessions, rooms, players and finished games.",
      },
    },
  ],
  edges: [
    { id: "spa-rest", source: "spa", target: "rest-client", label: "HTTP" },
    { id: "spa-socket", source: "spa", target: "socket-client", label: "events" },
    { id: "rest-api", source: "rest-client", target: "api", label: "JWT cookie" },
    {
      id: "socket-link",
      source: "socket-client",
      target: "socket-server",
      label: "WebSocket",
      animated: true,
    },
    { id: "api-auth", source: "api", target: "auth", label: "login" },
    { id: "api-user", source: "api", target: "user" },
    { id: "api-room", source: "api", target: "room" },
    { id: "socket-room", source: "socket-server", target: "room", label: "join / leave" },
    {
      id: "socket-game",
      source: "socket-server",
      target: "game",
      label: "moves",
      animated: true,
    },
    { id: "game-bot", source: "game", target: "bot", label: "bot turn" },
    { id: "auth-google", source: "auth", target: "google", label: "verify token" },
    {
      id: "auth-mongo",
      source: "auth",
      target: "mongo",
      label: "sessions",
      curvature: WIDE_CURVE,
    },
    { id: "user-mongo", source: "user", target: "mongo" },
    { id: "room-mongo", source: "room", target: "mongo" },
    {
      id: "game-mongo",
      source: "game",
      target: "mongo",
      label: "results",
      curvature: WIDE_CURVE,
    },
  ],
};
