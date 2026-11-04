# Game Arena

A real-time multiplayer game site. Sign in, create a room, and play Rock Paper
Scissors, Tic-Tac-Toe, or Snakes & Ladders against friends, or against the
computer.

A Yarn workspaces monorepo:

- **Client:** React, Vite, TypeScript, Tailwind (`apps/client`, `@arena/client`)
- **Server:** Express, Socket.IO, TypeScript, MongoDB for accounts (`apps/server`, `@arena/server`)
- **Shared:** game constants, types and zod schemas used by both (`packages/shared`, `@arena/shared`)
- **Config:** base tsconfig, Jest preset and ESLint rules (`packages/config`, `@arena/config`)

Games and rooms live in the server's memory. MongoDB only stores accounts and
sessions. See [`apps/server/README.md`](apps/server/README.md) for why, and what that
trades away.

---

## Getting started

You need Node 22 (see `.nvmrc`; `yarn install` refuses Node 23 because jsdom
doesn't support it) and Yarn 1.

```bash
# 1. Install everything once, from the repo root (also builds packages/shared)
yarn install

# 2. Configure: copy the examples and fill them in
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env

# 3. Run (two terminals)
yarn dev:server     # http://localhost:3030, reloads on changes
yarn dev:client     # http://localhost:5173
```

The server runs `@arena/shared` from its compiled `dist/`. If you change
`packages/shared`, run `yarn build:shared` (the client and the tests read its
source directly, so they pick changes up straight away).

Use `yarn dev:server` while developing. `yarn workspace @arena/server start`
runs the compiled build in `apps/server/dist/` (run `yarn build:server` first),
and won't pick up later changes until you rebuild and restart it.

The server starts without `MONGO_DB_URI`. Rooms and games still work, but
signing in doesn't.

### Google sign-in

1. Create an OAuth client ID in Google Cloud Console.
2. Add `http://localhost:5173` to its **Authorized JavaScript origins**.
3. Put the same client ID in `apps/client/.env` (`VITE_GOOGLE_CLIENT_ID`) and
   `apps/server/.env` (`GOOGLE_CLIENT_ID`), and the secret in `GOOGLE_CLIENT_SECRET`.

If sign-in fails, the server logs the reason as `Google sign-in failed: …`.

---

## Commands

Run these from the repo root.

| Command | What it does |
|---|---|
| `yarn dev:client` / `yarn dev:server` | Start one app in development mode |
| `yarn build` | Build shared, then client and server (`build:client` / `build:server` for one) |
| `yarn lint` | ESLint in every workspace (files are limited to 200 lines) |
| `yarn typecheck` | `tsc --noEmit` in every workspace |
| `yarn test` | Tests everywhere (Vitest on the client, Jest on the server and shared) |
| `yarn test:coverage` | Tests plus coverage; fails under 95% lines / 90% branches |
| `yarn validate` | lint + typecheck + test |

To run one workspace's script: `yarn workspace @arena/server test`.
Git hooks run `yarn lint` before each commit and `yarn validate` before each push.

---

## Deployment (Render)

[`render.yaml`](render.yaml) is a Render Blueprint for both services. Both build
from the **repo root** (not `apps/*`), because the workspaces need the root
`yarn.lock` and `packages/` to link `@arena/shared`.

| Service | Type | Build | Start / publish |
|---|---|---|---|
| `game-arena-server` | Web service (Node) | `yarn install --frozen-lockfile --production=false && yarn build:server` | `yarn workspace @arena/server start` |
| `game-arena-client` | Static site | `yarn install --frozen-lockfile --production=false && yarn build:client` | publish `apps/client/dist` |

`buildFilter` keeps a client-only change from redeploying the server and the
other way round; a change in `packages/` redeploys both. The static site gets an
SPA rewrite to `/index.html`, long-lived caching for `/assets/*`, and basic
security headers.

**Moving existing services over:** either create a Blueprint from `render.yaml`
(then delete the old services), or edit each existing service by hand: set
*Root Directory* to empty (repo root), and copy the build/start commands and
publish path from the table above. Add the static site's rewrite rule
`/* → /index.html` in its Redirects/Rewrites tab. Env vars marked `sync: false`
are filled in on the dashboard.

---

## CI and code quality

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to
`main` and every pull request: lint, typecheck, tests with coverage thresholds,
and a production build. Coverage reports are uploaded as an artifact.

If a `SONAR_TOKEN` repo secret exists, it also runs a SonarCloud scan using
[`sonar-project.properties`](sonar-project.properties). To turn it on: import
the repo in SonarCloud, check `sonar.projectKey` and `sonar.organization` match,
turn off SonarCloud's *Automatic Analysis* (it conflicts with CI analysis), and
add the token as `SONAR_TOKEN` under GitHub → Settings → Secrets → Actions.

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
The code is in `apps/server/src/games/bot.ts` (decisions) and
`apps/server/src/services/bot/` (timing).

---

## Project layout

```
apps/
  client/   React app. See apps/client/README.md
  server/   Express + Socket.IO server. See apps/server/README.md
    docs/auth.md   How accounts, tokens, and Google sign-in work
packages/
  shared/   @arena/shared: game names, Snakes & Ladders board, zod schemas
  config/   @arena/config: tsconfig.base.json, jest-preset.js, eslint-base.cjs
render.yaml                Render Blueprint for both services
sonar-project.properties   SonarCloud config
```

---

## Security notes

- Secrets live only in `apps/server/.env`, which git ignores. `apps/client/.env` holds
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
