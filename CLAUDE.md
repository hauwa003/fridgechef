# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Full local dev (starts Docker, runs migrations, starts API + mobile concurrently)
npm run dev

# Individual services
npm run db:up              # Start Postgres + Redis via Docker
npm run db:migrate         # Run database migrations
npm run api:local          # Start local API server (port 3000)
npm run mobile             # Start Expo dev server
npm run build:shared       # Build shared package (needed before api-local install)
npm run typecheck          # Typecheck all workspaces
npm run dev:qr             # Print Expo Go QR code (scan with phone)
```

**Starting dev:** Run `npm run dev` (background is fine), then `npm run dev:qr` to display the QR code for Expo Go. Docker must be running first (`open -a Docker`).

**First-time setup:** Copy `.env.example` to `.env` in both root and `apps/api-local/`. Set `ANTHROPIC_API_KEY` in `apps/api-local/.env` for AI features (omit for demo mode with seed data).

**Mobile on physical device:** The mobile `.env` has `EXPO_PUBLIC_API_URL=http://<local-ip>:3000`. The API must listen on `0.0.0.0` (already configured) and upload URLs use `request.hostname` to work over LAN.

## Architecture

Monorepo with three apps and one shared package:

- **`apps/mobile`** — Expo SDK 54 / React Native app with Expo Router v6 (file-based routing). State: Zustand (auth, session) + React Query (server data). Entry point: `index.js` → `expo-router/entry`.
- **`apps/api-local`** — Single-file Fastify server for local dev. Simplified auth (no JWT validation, userId extracted from token string). All routes in `src/index.ts`.
- **`apps/api`** — Production Fastify server with modularized routes under `src/routes/`, middleware layer, Supabase + Upstash backends.
- **`packages/shared`** — Types, Zod schemas, and constants consumed by all apps. Must be built (`npm run build:shared`) before other packages can resolve `@fridgechef/shared`.

## Session Flow & State Machine

```
CREATED → IMAGES_UPLOADED → EXTRACTING → EXTRACTED → GENERATING_RECIPES → RECIPES_READY
                                ↓                          ↓
                              FAILED                     FAILED
```

Mobile flow: Home → Capture (camera/gallery) → Processing (upload + extract via Claude Vision) → Ingredients (edit/confirm) → Preferences → Recipes → Recipe Detail/Cook Mode.

Redis session locks (`lock:${sessionId}`, 60s TTL) prevent concurrent extract/generate operations. Returns 409 if locked.

## AI Integration

`apps/api-local/src/services/ai.ts` wraps Claude API calls with:
- Zod schema validation of JSON responses
- Self-repair: if validation fails, re-prompts Claude for valid JSON
- Fallback: seed recipes returned if Claude API fails
- `extractFromImages()` — sends base64 images for ingredient detection
- `generateRecipesAI()` — generates recipes constrained to available ingredients

## Key Patterns

**Auth (local dev):** Anonymous user created on app start (`POST /auth/anonymous`). Token format: `local-token-{uuid}`. Server extracts userId by stripping prefix. Mobile stores tokens in `expo-secure-store`.

**Image upload:** Mobile gets presigned URL → uploads binary via PUT → confirms with backend → backend stores locally (dev) or in Supabase storage (prod). Images deleted after extraction by default (privacy).

**Shared package linking:** The monorepo doesn't use npm workspaces for resolution. Use `npm link` from `packages/shared` then `npm link @fridgechef/shared` in consuming apps if `npm install` can't resolve it.

**expo-file-system:** SDK 54 deprecated the legacy API. Import from `expo-file-system/legacy` for `getInfoAsync`/`uploadAsync`.

## Database

PostgreSQL schema in `supabase/migrations/`. Key tables: `users`, `sessions`, `session_images`, `ingredients`, `recipes`, `saved_recipes`, `user_preferences`, `analytics_events`. All IDs are UUIDs. The `sessions.state` column uses a custom enum matching the state machine above.

Docker auto-runs migrations on container start. Manual: `npm run db:migrate`.
