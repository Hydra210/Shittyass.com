# ShittyAss.com — Implementation Plan

## Product scope and boundaries

Keep the existing React 19 + TypeScript/Vite single-page social product and extend it with only the requested authentication backend. Add the supplied one-file FastAPI proxy as root `AccountAuth.py` plus its pinned `requirements.txt`; it calls the user's deployed EXE Accounts API server-to-server. The browser must call only this site's relative `/auth/*` endpoints. Do not create another backend file, add an auth library, add a database, or add social/faction API endpoints. The supplied auth helpers and routes are preserved; the only edits to `AccountAuth.py` are the requested `StarletteHTTPException` import and the bottom static-files section, which serves the Vite `dist/` build with the specified SPA fallback.

**Page headings:** each page displays its page name only, with no eyebrow, subtitle, explanatory note, or decorative mark alongside the title. In English, the home-page title is exactly **Timeline**; localized headings follow the language selected in Settings.

**Authentication:** use the existing `/login`, `/signup`, `/confirm-email`, and `/forgot-password` routes with the same-origin API. On initial load, call `GET /auth/me`. Keep access/refresh tokens in the FastAPI-set HttpOnly cookies only; frontend code never reads or stores them. A login response with `requires_2fa` opens a code step and posts the in-memory challenge token and code to `/auth/verify-2fa`. A successful registration leads to a clear “check your email to verify” message. Show JSON `detail` messages including held/terminated-account errors. A logged-out protected action navigates directly to `/login`; an authenticated user sees an honest unavailable state where the separate social/faction service is still absent. Password recovery is not represented as working because the supplied API contract has no recovery endpoint.

**Factions — creation:** anyone **with an account** may create a faction; creation is not admin-only. Keep the creation form to exactly three inputs: (1) a required name, (2) an optional description, and (3) a public/private discoverability choice. Public factions may appear in the faction directory; private factions are not discoverable and require an invitation. Do not request a faction address, URL, handle, slug, channels, roles, permissions, or bots during creation. Any internal route identifier can be assigned by a future backend and is not a creation field. The account-only backend does not create or persist factions.

**Factions — after creation:** retain the navigable Discord-like server-management front end, with honest empty states and no sample data. Include a faction overview; channel categories and text/forum/voice channels; roles and granular permissions; member administration and nicknames; bans; invitations; moderation controls; audit-log filters/history; and custom emoji management. These features belong in post-creation settings, not the create form. Protected add/edit/save/moderation actions navigate directly to the main `/login` screen when logged out. Signed-in actions remain unsaved and identify the missing faction service rather than claiming success. Do not invent faction members, channels, roles, bans, invites, or audit entries.

**Bots — coming soon:** mark all bot-related faction UI **Coming soon**. Do not include bot installation fields, bot examples/catalog entries, add/invite controls, developer credentials, integration APIs or a developer page/route yet. Future bots will be code-based (Python or another supported language) and join a faction by invitation; state that future direction plainly, without presenting it as an available workflow.

**Brand:** keep the user's full crowned `ShittyAss.com` wordmark image throughout the site and as the favicon. Browser title and social-preview title should read `ShittyAss.com` without a marketing tagline.

Preserve the requested dark, modern, professional style with warm brown accents, rounded edges, keyboard accessibility, Settings-only language selection, mobile bottom navigation, and all existing legal/help/accessibility routes. Privacy and Terms remain clearly marked as launch-draft copy requiring review, but their statements must now describe the real account-authentication data flow and distinguish it from still-disconnected social features.

## Implementation approach

- Keep the current Vite/React/TypeScript/router toolchain. Keep the project build on the existing `pnpm` lockfile and output `dist/`. Add only the two requested root backend files. Do not enable a WebDev database, create social/faction endpoints, publish, or set up DNS/domain hosting.
- Preserve the supplied authentication section in `AccountAuth.py`. The file remains the sole component that calls the external EXE Accounts API. It owns refresh behavior, CSRF origin checks, `/auth/*` proxy routes, HttpOnly session cookies and `/health`. Leave its helpers and routes unchanged; add the requested exception import, add a narrowly scoped bottom-of-file cookie-attribute adapter for auth cookies on configured HTTPS origins so embedded Preview can use them, then replace the final `public/` mount with the specified `dist/` SPA-fallback mount. Leave the mount last.
- Add a small frontend API module whose requests use relative `/auth/*` paths and `credentials: 'same-origin'`; never put the external API URL or access/refresh tokens in browser code. Add an `AuthProvider` that loads `/auth/me`, maintains the returned user/status in memory, exposes login/register/2FA/logout calls, and distinguishes a signed-out 401 from an unavailable service.
- Wire login, registration, email-verification confirmation, 2FA, errors and logout into the existing pages. Show server `detail` messages. Do not add token persistence, mock users, fake success, password recovery endpoints or account forms that claim to save unsupported account/profile settings.
- Make `SignInGate`, `SiteContext.requestSignIn` and navigation session-aware: anonymous users go to the main `/login` screen with an in-app return path; signed-in users see honest unavailable states for social functionality that has no backend. Display real account identity and logout where useful.
- Add Vite same-origin dev proxies for `/auth` and `/api` to the local FastAPI service on port 8000. Use Vite port 5173 for local development, allow the active HTTPS Preview hostname in Vite's host check, and set the backend origin allowlist to the actual browser origin. In production, FastAPI serves the Vite `dist/` directory on the same origin.
- Update Help, Privacy and Terms drafts to accurately describe account registration inputs, authentication cookies, 2FA/email verification via the external account provider, local-only display preferences, and still-missing social/faction services. Operator identity, vendor retention, jurisdiction, privacy contact and legal details remain unverified and must be reviewed before launch.
- Document local setup and Render settings in the README. The Render build command installs Python requirements, installs frontend dependencies with the repository's pinned pnpm lockfile, and runs the Vite build; start with Uvicorn and serve `dist/` from FastAPI. Do not deploy or publish in this task.

## Route and feature map

- `/` — public empty timeline, English title `Timeline`; posting requires sign-in and remains unavailable until social APIs exist.
- `/explore`, `/search` — real-data-empty public search/discovery.
- `/factions` — searchable, empty public faction directory and create-faction entry.
- `/factions/create` — create form with exactly the required name, optional description and Public/Private discoverability fields; logged-out submission routes to `/login`, signed-in submission is not saved until a faction API exists.
- `/factions/:slug` and `/factions/:slug/channels/:channelId` — data-empty faction and channel shells with links to the relevant management pages.
- `/factions/:slug/settings` — faction overview/general settings.
- `/factions/:slug/settings/channels` — channel categories and channel creation/organization.
- `/factions/:slug/settings/roles` — roles and granular permission controls.
- `/factions/:slug/settings/members` — member administration and nicknames.
- `/factions/:slug/settings/bans` — bans and moderation actions.
- `/factions/:slug/settings/invites` — invitation controls.
- `/factions/:slug/settings/moderation` — moderation preferences.
- `/factions/:slug/settings/audit-log` — audit history and event filters, empty until real events exist.
- `/factions/:slug/settings/emojis` — custom emoji management, empty until a real service exists.
- `/factions/:slug/settings/bots` — “Coming soon” information only; no active bot add/invite controls or developer portal.
- `/notifications`, `/messages`, `/bookmarks`, `/u/me` — direct navigation to `/login` while signed out; authenticated users see honest empty states because social APIs are not included.
- `/u/:handle`, `/post/:postId` — public profile/post shells with honest unavailable states until actual content is connected; account-only actions route to login when signed out.
- `/login` — real email/password login, optional 2FA code step, server error display, and redirect to a safe in-app return route.
- `/signup` — real registration request with email, password and display name, followed by verification instructions only after an accepted response.
- `/confirm-email` — verification message for the email used in a successful registration; direct navigation does not claim an account was created.
- `/forgot-password` — clearly state that password recovery is not supported by the supplied endpoints; do not submit credentials or claim an email was sent.
- `/settings` — language, accessibility, display preferences, account session information and privacy links.
- `/about`, `/help`, `/privacy`, `/terms`, `/accessibility`, `/safety`, `/cookies` — title-only information and policy routes; legal draft disclaimers remain clear and current.
- `/health` — unauthenticated FastAPI health response; `/auth/*` — supplied authentication proxy routes. The existing `AccountAuth.py` `/api/*` examples remain untouched per the user's file-edit restriction.

## Design system

- **Design Movement:** warm neo-editorial social product design, borrowing the composure of an independent print journal and the clarity of a contemporary SaaS interface; dark, not nightclub-gothic.
- **Core Principles:** confident but welcoming; compact, readable conversation; truth in every data state; accessible interaction before ornament.
- **Color Philosophy:** charcoal and espresso surfaces give long-form conversation low-glare calm. Cream text keeps contrast and warmth. A restrained roasted-copper accent feels ownable and mature rather than generic electric blue. Suggested tokens: ink `#11100F`, panel `#191715`, raised `#211E1B`, line `#302923`, text `#F4EEE8`, muted `#A69B91`, signature clay `#B47A53`, hover clay `#C88D63`. Preserve the supplied wordmark's orange, honey and near-black artwork without recoloring it.
- **Layout Paradigm:** an asymmetric three-part conversation desk: persistent desktop navigation, readable central column, contextual information rail. On mobile, a responsive top bar/menu dialog pairs with fixed bottom navigation that includes Factions. Faction administration uses a persistent settings rail beside a single readable controls column, not a generic tile dashboard.
- **Signature Elements:** the supplied full crowned `ShittyAss.com` image wordmark; thin copper active rules; softly layered espresso panels with rounded corners.
- **Interaction Philosophy:** direct, predictable navigation; one main sign-in destination for signed-out protected actions; no fake loading theatre or simulated persistence. Every control has purposeful keyboard and focus behavior.
- **Animation:** short 140–220 ms opacity/transform transitions; gentle menu/dialog entrance; honor `prefers-reduced-motion` and the user’s motion setting; no looping or scroll-jacking motion.
- **Typography System:** system sans stack for durable, fast, readable product UI; selective Georgia italic for one editorial headline accent. Compact medium-weight labels, high line-height for posts, and clear heading levels; no remote font downloads.
- **Brand Essence:** “A calmer corner of the internet for saying what you actually think.” For people who want open-topic conversation without a blue-sky clone. Personality: candid, composed, welcoming.
- **Brand Voice:** dry-witted in the brand, never crude in account, safety or legal copy. Page titles use only the page name; actions use plain verbs. Examples: “The timeline has room for what comes next.” / “Say it here. Keep it human.”
- **Wordmark & Logo:** use the user's full crowned `ShittyAss.com` wordmark as a single image; do not combine the old crown/S icon with another typed wordmark.
- **Signature Brand Color:** roasted clay `#B47A53`, complemented by the supplied mark's orange and gold.

## Accessibility, language and legal presentation

Use semantic landmarks, real buttons/links, labels and error summaries, logical heading order, visible focus rings, adequate contrast, Escape-to-close dialogs, live-region feedback for local UI changes, reduced-motion support and responsive reflow. Settings forms, permission options, selectors and moderation controls must be individually labelled and keyboard-operable. Provide an accessibility statement and UI accessibility controls. Language selection appears only in Settings; shared/key UI labels update for English, Spanish and French.

Privacy and Terms remain readable, unreviewed launch-draft templates, not legal advice or jurisdiction-ready policies. They must describe the actual account flow: email, password and display name are submitted to the same-origin FastAPI proxy, which calls the EXE Accounts API; the backend sets access/refresh cookies with HttpOnly attributes, and handles upstream login, 2FA, verification and refresh. The frontend does not read those tokens. Language/display preferences remain browser-local. Social content, factions, messaging, analytics and server-side social-content storage remain disconnected. Operator identity, data retention, vendor arrangements, jurisdiction, privacy contact, data requests, deletion and other legal specifics must be confirmed before launch.

## Project structure

- `index.html` — document entry, `ShittyAss.com` title and social metadata, supplied full-wordmark favicon reference.
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts` — pinned reproducible toolchain, Vite development port 5173, and same-origin `/auth` and `/api` proxies to `localhost:8000`.
- `AccountAuth.py` — the user's single FastAPI auth proxy; preserve its auth section, health endpoint and supplied route examples, and make only the approved static import/mount edits.
- `requirements.txt` — the user's pinned FastAPI, Uvicorn, HTTPX and Pydantic dependencies.
- `dist/` — generated Vite build served by FastAPI in Render production; not a source folder.
- `app.config.ts` — durable uploaded HTTPS URL for project brand metadata.
- `public/shittyass-wordmark.png`, `public/favicon.png` — user's full wordmark for application and browser identity.
- `src/main.tsx`, `src/App.tsx` — providers, route table, page titles, not-found handling and global layout.
- `src/auth/api.ts` — same-origin JSON requests for `/auth/*`, credentials, and server-message extraction; no external API URL or token persistence.
- `src/state/AuthContext.tsx` — in-memory user/session state, initial `/auth/me`, authentication actions and service-unavailable state.
- `src/components/` — shell/navigation, supplied brand, session-aware sign-in gate/logout, post/form controls and reusable faction controls.
- `src/pages/AuthPages.tsx` — real login, 2FA, registration, email-confirmation messaging and truthful recovery limitation.
- `src/pages/FactionPages.tsx` — directory, three-field creation form, faction/channel shells and bot Coming-soon page.
- `src/pages/FactionSettingsPage.tsx` — overview, channels, roles/permissions, members/nicknames, bans, invites, moderation, audit-log and emoji settings.
- `src/pages/` — title-only social/profile/Settings/legal pages.
- `src/state/SiteContext.tsx` — display preferences, toast and session-aware protected-action navigation; session tokens are not stored here.
- `src/i18n/` — language provider and shared interface strings; selector is located in Settings.
- `src/styles.css` — warm-dark tokens, wordmark sizing, accessible forms and controls, faction settings rail, focus/reduced-motion, mobile menu and bottom navigation.
- `plan.md`, `TODO.md`, `README.md` — current product decisions, source-backed outcomes and local/Render operation instructions.

## Material constraint

This remains an auth-only functional slice, not an operational social/faction network. The FastAPI proxy handles accounts through the user's EXE Accounts API; it does not include a database or social/faction backend. No posts, factions, channels, permissions, bans, invites, audit entries, bots, search results, messages, notifications or reports are stored/transmitted or presented as successful. Logged-out protected operations route to the main sign-in screen; authenticated social/faction operations accurately state that their service is not connected. The user's exact supplied auth section remains unchanged. The account provider's verification, hold/termination, retention and email-delivery behavior are external dependencies; review the privacy/legal drafts before accepting real users. The domain is not configured or published by this task.
