# CSScout API — Copilot Instructions

Koa/TypeScript API for serving CS2 player statistics from ESEA/FACEIT leagues.
Deployed to Google Cloud Run; frontend at [cs-scout-ui](https://github.com/mr-jackpot/cs-scout-ui).

## Commands

```bash
npm run dev        # Dev server (ts-node-dev, hot reload)
npm run build      # tsc
npm run test       # Vitest watch mode
npm run test:run   # Vitest single run
npm run lint       # ESLint
npm run lint:fix   # Fix auto-fixable lint issues
```

## Architecture

- `src/index.ts` — app bootstrap, Koa server setup, middleware registration
- `src/routes/` — route definitions (Koa Router)
- `src/controllers/` — request handlers; validate input, call services, format response
- `src/services/` — business logic + FACEIT API calls
- `src/models/` — TypeScript types/interfaces
- `src/middleware/` — Koa middleware (auth, error handling, logging, etc.)
- `src/utils/` — helper functions
- `openapi.yaml` — OpenAPI 3.0 spec; served at `/docs`, `/openapi.json`, `/openapi.yaml`

## API Contract

Base URL: `http://localhost:3000` (dev) / Cloud Run URL (prod).
All requests require an `X-API-Key` header.

| Method | Endpoint | Returns |
|--------|----------|---------|
| `GET` | `/health` | Health check |
| `GET` | `/players/search?nickname=<name>` | `{ items: Player[] }` |
| `GET` | `/players/:playerId` | Full player profile |
| `GET` | `/players/:playerId/esea` | `{ player_id, seasons: Season[] }` |
| `GET` | `/players/:playerId/competitions/:competitionId/stats` | `PlayerStats` |

## Conventions

- TypeScript strict mode
- `async/await` over raw promises
- Named exports over default exports
- Controllers are thin — business logic goes in services
- Descriptive variable names (no abbreviations except `ctx`, `req`, `res`)
- RESTful endpoints, JSON request/response bodies, appropriate HTTP status codes
- Validate request input at the controller level

## Non-Obvious Patterns

- **Auth**: All routes protected by `X-API-Key` header middleware; value must match `API_KEY` env var. The `/health` endpoint is exempt.
- **FACEIT API**: All external FACEIT calls are isolated in `src/services/`; uses `FACEIT_API_KEY` env var. Never call the FACEIT API directly from controllers.
- **OpenAPI docs**: Spec lives in `openapi.yaml` at the project root. Served at `/docs` (Swagger UI), `/openapi.json`, and `/openapi.yaml`. Update this file when adding or modifying endpoints.
- **Error handling**: Services throw typed errors; middleware catches and formats them. Never expose internal error details in production responses.

## Environment Variables

See `.env.example`. Required:

- `FACEIT_API_KEY` — from [FACEIT Developer Portal](https://developers.faceit.com/)
- `API_KEY` — shared secret for authenticating clients (e.g. the frontend)
- `NODE_ENV` — `development` or `production`

## CI/CD

- **CI**: lint + build + tests on every PR
- **Release**: release-please creates a Release PR on merge to `main`. Merging it bumps version, updates CHANGELOG, tags, creates a GitHub Release, and **deploys to Cloud Run**
- **Secrets required**: `GOOGLE_CREDENTIALS`, `GCP_PROJECT_ID`, `FACEIT_API_KEY`, `API_KEY` repo secrets for Cloud Run deploys

## Guardrails

- Do not change the HTTP framework (Koa)
- Do not break the existing endpoint contracts — the frontend depends on these response shapes
- Update `openapi.yaml` when adding or modifying endpoints
- Use Conventional Commits for PR titles (e.g. `feat: add X`, `fix: broken Y`). This drives automatic versioning via release-please
- Run `npm run test:run` after changes to verify nothing breaks
- Run `npm run lint` to check code style
