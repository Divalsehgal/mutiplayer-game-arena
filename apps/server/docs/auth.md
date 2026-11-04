# Accounts and sign-in

How players sign up, sign in, and stay signed in.

## Layers

- **Routes** (`src/routes/auth`, `src/routes/user`): Express routers. Every
  request body goes through a zod schema (`src/validators`) first.
- **Controllers** (`src/controllers/auth`, `src/controllers/user`): HTTP
  concerns only: reading the request, setting cookies, and shaping the
  response.
- **Services** (`src/services/auth`, `src/services/user`): password hashing,
  token issuing, and session storage.
- **Models** (`src/models/auth`, `src/models/user`, `src/models/session`):
  Mongoose schemas. The services query them directly. There is no separate
  repository layer for accounts; `src/repositories/auth` and
  `src/repositories/user` are empty.

## Email and password

- `POST /auth/signup` and `POST /auth/signin`. Passwords are hashed with bcrypt.
  A password is required unless the account signs in with Google.
- A wrong email or password returns `401` with a message the login page shows
  as-is ("Invalid Credentials").

## Google sign-in

1. The client shows Google's button (`@react-oauth/google`, configured with
   `VITE_GOOGLE_CLIENT_ID`) and receives an ID token.
2. It sends the token to `POST /auth/google`.
3. The server checks it with `google-auth-library`, using the same client ID as
   the audience (`GOOGLE_CLIENT_ID`, or `CLIENT_ID`).
4. The Google email is matched to an existing account, or a new one is created
   from the Google name and picture. An existing account without an avatar
   gets the Google picture.
5. The server issues its own tokens, exactly as for email sign-in.

Every failure returns `401 "Google authentication failed"`, and the server logs
the real reason as `Google sign-in failed: …`. Common causes:

| Log message | Meaning |
|---|---|
| `Wrong recipient, payload audience != requiredAudience` | The client and server use different Google client IDs |
| `Token used too late` | The token expired, or the computer's clock is wrong |
| `Google OAuth env vars missing` | `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` aren't set |

If the Google button itself errors in the browser with "The given origin is not
allowed", add the site's origin (for example `http://localhost:5173`) to the
client ID's **Authorized JavaScript origins** in Google Cloud Console.

## Tokens and sessions

- **Access token:** lasts 1 hour. **Refresh token:** lasts 7 days, and is stored
  in the `Session` collection, where MongoDB removes it once it expires.
- Both are set as httpOnly cookies (`access_token`, `refresh_token`) and never
  returned in the response body, so the page's JavaScript can't read them.
- `POST /auth/refresh` swaps in a new refresh token on the same session row.
- `POST /auth/logout` clears both cookies.
- `GET /user/profile` and `PATCH /user/profile` sit behind `authMiddleware`,
  which verifies the access token and checks that the account still exists.
- In production (`NODE_ENV=production`), cookies are `Secure` and
  `SameSite=None`, and issuing or checking a token throws unless `JWT_SECRET`
  and `REFRESH_TOKEN_SECRET` are set. The server still boots without them.

## Not done yet

- **Rate limiting on the sign-in routes** (for example `express-rate-limit`).
- **Socket re-authentication after the access cookie expires.** A socket that
  reconnects after an hour, before the page has refreshed the session, is
  treated as a guest until it does.
