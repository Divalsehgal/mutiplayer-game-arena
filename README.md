# Game Arena

A real-time multiplayer game site. Sign in, create a room, and play Rock Paper
Scissors, Tic-Tac-Toe, or Snakes & Ladders against friends, or against the
computer.

- **Client:** React, Vite, TypeScript, Tailwind (`client/`)
- **Server:** Express, Socket.IO, TypeScript, MongoDB for accounts (`server/`)

Games and rooms live in the server's memory. MongoDB only stores accounts and
sessions. See [`server/README.md`](server/README.md) for why, and what that
trades away.

---

## Getting started

You need Node 22 (see `.nvmrc`; Node 23 works but some test tools warn about
it) and Yarn 1.

```bash
# 1. Install
cd server && yarn install
cd ../client && yarn install

# 2. Configure: copy the examples and fill them in
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Run (two terminals)
cd server && yarn dev     # http://localhost:3030, reloads on changes
cd client && yarn dev     # http://localhost:5173
```

Use `yarn dev` for the server while developing. `yarn start` runs the compiled
build in `server/dist/`. It rebuilds first, but it won't pick up later changes
until you restart it.

The server starts without `MONGO_DB_URI`. Rooms and games still work, but
signing in doesn't.

### Google sign-in

1. Create an OAuth client ID in Google Cloud Console.
2. Add `http://localhost:5173` to its **Authorized JavaScript origins**.
3. Put the same client ID in `client/.env` (`VITE_GOOGLE_CLIENT_ID`) and
   `server/.env` (`GOOGLE_CLIENT_ID`), and the secret in `GOOGLE_CLIENT_SECRET`.

If sign-in fails, the server logs the reason as `Google sign-in failed: …`.

---

## Commands

Run these inside `client/` or `server/`.

| Command | What it does |
|---|---|
| `yarn dev` | Start in development mode |
| `yarn build` | Production build |
| `yarn start` | Server only: build, then run `dist/server.js` |
| `yarn test` | Run the tests (Vitest on the client, Jest on the server) |
| `yarn test:coverage` | Tests plus a coverage report across every source file |
| `yarn lint` | ESLint (files are limited to 200 lines) |

From the repo root, `yarn validate` runs lint and tests for both apps. Git hooks
run `yarn lint` before each commit and `yarn validate` before each push.

---

## How a game works

1. **Sign in** with email and password, or Google. If you open a room link
   while signed out, you're sent to the login page and brought back afterwards.
   Tokens are kept in httpOnly cookies, never in the page's JavaScript.
2. **Connect.** The client opens one Socket.IO connection, and the server works
   out who you are from the same cookie.
3. **Create or join a room.** In the lobby you pick a game and an opponent:
   - **Other players:** the room is either listed under "Open rooms" or
     private (join with the code). Once it's full, anyone else who joins
     watches as a spectator. Spectators take a free seat automatically.
   - **Computer:** the game starts straight away, one-on-one, and never
     appears in the public list.
4. **Play.** The client only sends intents ("I played Rock", "I'm ready").
   The server checks every move, works out the result, and sends each player
   their own view of the game. In Rock Paper Scissors, for example, you can't
   see the other player's choice until you've both picked.
5. **Leave or lose connection.** If your connection drops, your seat is held
   for 2 minutes. Refreshing or reopening the link puts you back. Opening the
   same room in a second tab moves you there, and the first tab says so.
6. **Idle rooms close.** A room with no activity warns you ("Still there?")
   and then closes. Any move, join, or "I'm still here" resets the timer.

### The computer player

The computer is an ordinary seated player marked `isBot`, so it follows the
same rules and scoring as a person. After each change to the game, the server
checks whether it's the computer's turn and plays after a short pause
(`BOT_MOVE_DELAY_MS`, 0.8s):

- **Rock Paper Scissors:** a random move.
- **Tic-Tac-Toe:** win if it can, otherwise block you, otherwise take the
  centre, then a corner. It's decent but beatable.
- **Snakes & Ladders:** rolls the dice.

It also agrees to every rematch. The room closes when the last person leaves.
The code is in `server/src/games/bot.ts` (decisions) and
`server/src/services/bot/` (timing).

---

## Project layout

```
client/   React app. See client/README.md
server/   Express + Socket.IO server. See server/README.md
  docs/auth.md   How accounts, tokens, and Google sign-in work
```

---

## Security notes

- Secrets live only in `server/.env`, which git ignores. `client/.env` holds
  nothing secret (the server URL and the public Google client ID), but is also
  ignored now. Copy from the `.env.example` files.
- In production (`NODE_ENV=production`), cookies become `Secure` and
  `SameSite=None`, and any sign-in or token check fails with an error unless
  `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are set. The server still starts
  without them, so set them before deploying.
- Player IDs are visible to everyone in a room. So a connection without a
  login token gets an ID prefixed with `guest:`, and it can never take over a
  signed-in player's seat or the computer's.
- The server trims player names to 24 characters. Only members of a room can
  extend its idle timer.

## Known limitations

- **Rooms don't survive a restart.** They're held in memory in a single
  server process, so restarting or deploying drops every active game, and
  running more than one server instance would need a shared store.
- **Long-idle sockets can lose their identity.** The access cookie lasts an
  hour. If a socket reconnects after it has expired, and before the page
  refreshes the session over HTTP, the server treats it as a guest until the
  next refresh.
- **Joining a second room doesn't leave the first.** Your seat in the old
  room stays taken until you leave it or the 2-minute grace period ends.
- **No rate limiting on the sign-in routes.** Add it (for example
  `express-rate-limit`) before exposing the server publicly.
