# ShittyAss.com

A responsive, dark social-network front end for open-topic conversation, with warm brown accents and a content-first layout. Built with React, TypeScript, Vite and React Router. The current functional backend scope is email/password authentication through the user's separate EXE Accounts API; social and faction services remain out of scope.

## Local development

Requires Node.js 22, Python 3.12 and the repository's pinned `pnpm@11.25.0` package manager.

```sh
pnpm install --frozen-lockfile
pip install -r requirements.txt
```

Start FastAPI in one terminal from the repository root:

```sh
ACCOUNTS_API_URL=https://exe-accounts-api.onrender.com \
SITE_ORIGINS=http://localhost:5173 COOKIE_SECURE=false \
uvicorn AccountAuth:app --reload --port 8000
```

Start Vite in another terminal:

```sh
npm run dev
```

Vite listens on `0.0.0.0:5173` and proxies browser requests for `/auth/*` and `/api/*` to FastAPI at `http://localhost:8000`. Browser authentication calls use relative same-origin URLs and `credentials: 'same-origin'`; the browser never calls the EXE Accounts API directly. Auth session access and refresh tokens are held in FastAPI-set HttpOnly cookies, not in JavaScript storage.

## Render web service

Use one Render **Python** web service rooted at the repository root. Render's [native runtimes](https://render.com/docs/native-runtimes) include Node.js, npm and pnpm, so no second service, Dockerfile or extra backend script is required. Since this repository pins pnpm and includes `pnpm-lock.yaml`, use the lockfile-based build command:

**Build command**

```sh
pip install -r requirements.txt && pnpm install --frozen-lockfile && pnpm build
```

**Start command**

```sh
uvicorn AccountAuth:app --host 0.0.0.0 --port $PORT
```

**Environment variables**

```text
ACCOUNTS_API_URL=https://exe-accounts-api.onrender.com
SITE_ORIGINS=https://<your-live-domain>
COOKIE_SECURE=true
# optional, leave unset in production: COOKIE_SAMESITE_NONE=true
```

`pnpm build` writes the frontend to `dist/`; FastAPI serves that directory from the same origin as the auth endpoints. The supplied `/health` route is suitable for a Render health check. The project has not been deployed or published.

## Authentication behavior

The frontend uses `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-2fa`, `POST /auth/logout` and `GET /auth/me` on the site origin. A successful registration asks the user to check their email for verification. A login that requires 2FA prompts for the code. Server `detail` errors are shown in the interface. Password recovery is not available through the supplied endpoint list; the UI does not claim to send a reset email.

The supplied `/auth/register` handler is preserved unchanged and passes the account provider's successful registration JSON through. Its registration response must not include access or refresh tokens; if the provider returns those fields, the backend contract needs an authorized update before launch. Auth cookies are `HttpOnly` and `SameSite=Lax`. Only if the site must be embedded inside another site (e.g. a preview iframe) set `COOKIE_SAMESITE_NONE=true`; the cookie adapter then switches this site's auth cookies to `SameSite=None; Secure` for configured HTTPS origins. Leave it unset in production.

## Factions and social features

The public faction directory starts empty until a real service supplies content. The creation form asks only for a name, optional description, and Public/Private discoverability. Post-creation routes provide front-end settings surfaces for channels and categories, roles and permissions, member nicknames, bans, invitations, moderation, audit logs and custom emojis. The account-only backend does not create or save factions, posts, messages, notifications, or other social data. Signed-in actions are shown as unavailable until their separate service exists.

Faction bot settings display **Coming soon**. Future bots are planned to be code-based and join a faction by invitation. There are no bot listings, installation controls, developer credentials or ShittyAss developer page in this version.

## Pages and legal notices

The interface includes Timeline, Explore/Search, faction/channel pages, public profile/post routes, Notifications, Messages, Bookmarks, Settings, email/password sign-in and sign-up, email verification confirmation, password-recovery information, About, Help, Privacy, Terms, Accessibility, Safety/Community Standards, and the cookie/storage notice. English, Spanish and French are selectable in Settings. Page headings show only their titles.

Privacy and Terms are unreviewed launch drafts. Before launch, confirm operator identity, account-provider data handling and retention, jurisdiction, privacy contact, data-request/deletion process, and all other actual data flows with qualified counsel. Language and display preferences may be stored in browser local storage; authentication tokens are not.

The supplied full crowned `ShittyAss.com` wordmark is the single image used in site/auth headers, the favicon and project logo metadata. No deployment, DNS or custom-domain setup is included.
