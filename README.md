# Marketing Intelligence Platform

An attachment-project MVP for a marketing team: lead pipeline management, campaign tracking, follow-ups, activities, dashboard analytics, and an AI insight endpoint.

## What is working in this version

- React dashboard served by Vite.
- Express API with PostgreSQL as the authoritative data store.
- Versioned SQL migrations and development-only demo data.
- Email/password sign-in with salted `scrypt` password hashes and persistent, opaque session tokens.
- Workspace onboarding creates roles, pipeline stages, a welcome notification, and optional sample data.
- One account can switch between active workspace memberships without signing out.
- Organization isolation: every protected API request resolves its workspace from the authenticated session, never from a browser query parameter.
- Role-based access control stored in PostgreSQL:

| Role | Main permissions |
| --- | --- |
| Admin | Full CRM and data-reset access |
| Marketing Manager | Campaigns, analytics, AI, and read-only CRM access |
| Sales Agent | Leads, activities, and follow-ups |

## Architecture

```text
React client  ->  Express API  ->  PostgreSQL
                     |
                     ->  Gemini insight route (optional GEMINI_API_KEY)
```

The first release keeps the transactional API in Express. That is the right place for authentication, permissions, and CRM data. A future Flask/Python service can be added beside it for statistical models, forecasting, lead scoring, or data-science experiments; it should receive only authenticated, minimal data from this API.

## Run locally

1. Copy `.env.example` to `.env` and fill in either `DATABASE_URL` or the `DB_*` values.
2. For a local development database, leave `DB_SSL=false`.
3. Run the migration once:

   ```bash
   npm run db:migrate
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

The API applies pending migrations on startup. In development only, it also seeds a demo workspace and three accounts using `Pass2026!`:

- `admin@mip-platform.com`
- `marketing@mip-platform.com`
- `sales@mip-platform.com`

Production never creates shared demo users. Create the first account from the sign-up screen, then create the K10 workspace. Set `DEV_DEMO_PASSWORD` only when you need a non-default local demo password.

## Important commands

```bash
npm run lint        # Type-check the full project
npm run build       # Build the client and Express server
npm run db:migrate  # Apply new SQL migrations
```

## Deploy to Render

The included [`render.yaml`](render.yaml) deploys the whole application as one
Render web service and provisions a connected Render Postgres database. It runs
migrations before each release and only serves traffic after `/api/health`
returns successfully.

1. In Render, select **New** → **Blueprint** and connect this repository.
2. Apply the Blueprint. Render creates `marketing-intelligence-platform-mip`
   and `marketing-intelligence-platform-db`, connects them privately, and
   generates the session secret.
3. Add `GEMINI_API_KEY` in the web service's Environment settings only if the
   optional AI feature is required, then redeploy.
4. Open `https://marketing-intelligence-platform-mip.onrender.com/api/health`.
   A JSON response with `"status":"healthy"` confirms the API is live.
5. Create the first production account from the sign-up screen. Production
   intentionally does not create the local demo accounts.

The GitHub Pages frontend at `https://marketingintelligenceplatform.github.io`
is allowed to call this API. Its `VITE_API_BASE_URL` repository variable must
remain `https://marketing-intelligence-platform-mip.onrender.com` (without a
trailing `/api`).

## API overview

- `POST /api/auth/signup` and `POST /api/auth/login` return the user, session token, memberships, and selected workspace.
- `GET /api/auth/me` restores the current session and available workspaces.
- `GET|POST /api/workspaces` and `POST /api/workspaces/:workspaceId/select` create and switch workspaces.
- `POST /api/workspaces/:workspaceId/invitations` creates an invitation; `POST /api/invitations/accept` activates it.
- `GET /api/state` — protected CRM snapshot for the dashboard.
- `GET|POST /api/leads`, `PUT|DELETE /api/leads/:id`, `PATCH /api/leads/:id/stage`.
- `GET|POST /api/campaigns`, `/api/activities`, `/api/followups`, and `/api/notifications`.
- `GET /api/users` — Admin-only member list. Members are added through invitations, never administrator-created passwords.
- `GET /api/analytics/summary` and `POST /api/ai/query`.

Send the session token on protected routes:

```http
Authorization: Bearer <token>
```

## Learning notes

The most important boundary in this project is:

1. React collects input and displays data.
2. Express validates the request and checks `request.auth.permissions`.
3. PostgreSQL enforces relationships using foreign keys and keeps the permanent record.

Never let the browser select an organization or role for a request. The server gets both from the authenticated session. This protects each company’s data even when someone manually edits browser requests.
