# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server on 0.0.0.0
npm run build     # Production build
npm run preview   # Build + start
npm run lint      # Next.js ESLint
```

No test suite is configured.

## Environment Variables

```
ANTHROPIC_API_KEY=        # Required for all AI features
ANTHROPIC_MODEL=          # Defaults to claude-sonnet-4-5 (used by /api/analyze)
GOOGLE_GENERATIVE_AI_API_KEY=  # Imported but not actively used
```

Copy `.env.example` to `.env.local` to get started.

## Architecture

**AnchorFuel** is a Next.js 15 App Router app — a camera-first mobile-web AI health coach for traveling professionals. All state lives in the browser (localStorage + React context); there is no backend database.

### Key directories

- `app/(main)/` — Route group for the three main pages with shared bottom nav (`/dashboard`, `/action`, `/profile`)
- `app/api/` — Two API routes: `/api/analyze` (image → food analysis) and `/api/suggest` (location → proactive coaching)
- `context/UserProfileContext.tsx` — Single source of truth: user profile, daily meal log, 7-day history, geolocation, computed macro budgets
- `components/ui/` — shadcn primitives only; no app-specific components directory

### Data flows

**Scan flow** (`/action` → `/api/analyze`):
1. User captures image via webcam or file upload; sent as base64
2. API detects schedule conflict (event within 75 min) to switch between TRIAGE vs. CULINARY agent mode
3. Claude (vision) returns structured JSON: fridge mode gives `{ ingredients_found, recipe, items[] }`; menu mode gives `{ items[] }` with good/okay/avoid ratings
4. User logs chosen items → `addMeal()` in `UserProfileContext`

**Suggest flow** (`/dashboard` → `/api/suggest`):
1. App requests browser geolocation on mount; coordinates stored in context
2. Dashboard sends lat/lng + schedule + current time to `/api/suggest`
3. Claude returns `{ nearbyOptions[], microInterventions[], mealTimingAdvice, proactiveAlert }`
4. TRIAGE mode activates when an event is within 75 min (3-min meal suggestions, low-bloat focus)

### AI usage

- `/api/analyze` uses `process.env.ANTHROPIC_MODEL` (env-configurable), max 2048 tokens, with vision
- `/api/suggest` hardcodes `claude-sonnet-4-6`, max 2048 tokens — if updating the model, change it here directly
- `@google/generative-ai` is installed but not wired to any route

### Styling conventions

Tailwind v4 with semantic design tokens defined in `app/globals.css`. Use the semantic class aliases (`brand`, `surface-base`, `surface-elevated`, `content-primary`, `feedback-error`, etc.) and CSS variables (`--spacing-screen`, `--radius-pill`, `--radius-card`) rather than raw Tailwind utilities for anything touching brand color or spacing.

Fonts: Plus Jakarta Sans (display/headings), DM Sans (body) — loaded via `next/font`.

### Path alias

`@/*` maps to the repo root (e.g., `@/context/UserProfileContext`).
