# AnchorFuel

> **AI-powered nutrition coach for traveling professionals** — scan your fridge or a restaurant menu, get instant macro breakdowns, and receive schedule-aware meal suggestions, all on-device with no account required.

---

## Overview

AnchorFuel is a mobile-first Progressive Web App (PWA) built with Next.js 15 and the Anthropic Claude API. It targets journalists, field crews, broadcast professionals, and frequent travelers who need fast, context-aware nutrition guidance while on the road.

The app uses two Claude-powered agents: a **Culinary Agent** for thoughtful, detailed nutrition coaching during downtime, and a **Triage Agent** that activates automatically when a calendar event is within 75 minutes — switching to rapid, low-bloat meal recommendations suited for high-pressure windows.

---

## Problem Statement

Traveling professionals face a predictable but under-served problem: erratic schedules make it hard to eat well. They may have a hotel fridge full of mystery ingredients, a laminated restaurant menu with no nutritional info, and a broadcast slot in 45 minutes. Generic nutrition apps assume a stable routine. AnchorFuel does not.

---

## Target Users

- Broadcast journalists, photographers, and field crews on assignment
- Frequent travelers with packed, unpredictable schedules
- Athletes or fitness-conscious professionals who track macros while traveling
- Anyone who wants AI nutrition guidance without creating an account or syncing data to a cloud

---

## Key Implemented Features

| Feature | Details |
|---|---|
| **Camera-based food scanning** | Capture or upload a photo; Claude identifies food items, estimates macros, and rates each as good / okay / avoid |
| **Fridge mode** | Detects ingredients in a photo and generates a full recipe with macros |
| **Menu mode** | Rates every visible menu item against the user's dietary goals and allergens |
| **Triage Agent** | Auto-activates when a schedule event is ≤ 75 minutes away; switches to quick, low-bloat meal logic |
| **Culinary Agent** | Default mode for unscheduled time — produces detailed nutritional breakdowns and coaching |
| **Proactive suggestions** | Uses device GPS + Claude to recommend nearby food venues, estimate their macros, and suggest a meal type and timing |
| **Micro-interventions** | Alongside meal advice, Claude suggests 5–10 min wellness actions (stretching, breathing, hydration) keyed to schedule gaps |
| **Daily macro tracker** | Logs meals with timestamps; tracks remaining calories, protein, carbs, and fat against personal targets |
| **7-day history** | Bar chart of calorie intake over the past week |
| **Schedule management** | Add flights, meetings, workouts, and broadcasts to drive agent behavior |
| **PWA / installable** | Runs as a standalone app on iOS and Android; starts at `/dashboard` |
| **Zero authentication** | All data lives in `localStorage`; no account, no server-side storage |

---

## Workflow

```
User opens app
    │
    ├─► Profile setup (name, macro targets, diet, allergies, schedule)
    │
    ├─► SCAN (/action)
    │       │
    │       ├─ Select mode: [Fridge] or [Menu]
    │       ├─ Capture via webcam or upload image
    │       ├─ Check schedule → within 75 min of event?
    │       │       YES → TRIAGE AGENT (quick, low-bloat recommendations)
    │       │       NO  → CULINARY AGENT (detailed coaching)
    │       ├─ Claude analyzes image (vision API)
    │       │       Fridge → ingredients + recipe + macro estimate
    │       │       Menu   → per-item ratings (good / okay / avoid) + macros
    │       └─ User taps "Log" → meal added to daily tracker
    │
    └─► DASHBOARD (/dashboard)
            │
            ├─ Daily macro progress rings
            ├─ Today's schedule
            ├─ Proactive AI suggestions (location → /api/suggest → Claude)
            │       Nearby venue recommendations
            │       Meal timing advice
            │       Micro-interventions (movement, breathing, hydration)
            └─ 7-day history chart
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3 (App Router, React 19) |
| Language | TypeScript 5 |
| AI | Anthropic Claude (`claude-sonnet-4-5` for analysis, `claude-sonnet-4-6` for suggestions) |
| Styling | Tailwind CSS v4, custom semantic design tokens |
| Animations | Framer Motion 12 |
| Camera | react-webcam 7 |
| Icons | Lucide React |
| Components | shadcn/ui primitives |
| Storage | Browser `localStorage` (no database) |
| Location | Browser Geolocation API |
| PWA | Web App Manifest + Apple meta tags |

**Not used / not implemented:** maps SDK, restaurant data API, nutrition database, authentication, server-side database.

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                  │
│                                                     │
│  UserProfileContext (React Context)                 │
│  ├─ Profile, macro targets, allergies, diet         │
│  ├─ Daily meal log (keyed by date)                  │
│  ├─ Schedule events (user-managed)                  │
│  ├─ Device GPS coordinates (auto-requested)         │
│  └─ Persisted to localStorage                       │
│                                                     │
│  Pages                                              │
│  ├─ /action  → capture image → POST /api/analyze   │
│  ├─ /dashboard → GPS + schedule → POST /api/suggest│
│  └─ /profile → edit profile, targets, schedule     │
└────────────────────┬────────────────────────────────┘
                     │ Next.js API Routes (server)
          ┌──────────┴───────────┐
          │                      │
   /api/analyze            /api/suggest
   ┌──────────────┐        ┌──────────────────┐
   │ Input:       │        │ Input:           │
   │ imageBase64  │        │ lat, lng         │
   │ mode         │        │ userProfile      │
   │ userProfile  │        │ schedule         │
   │              │        │ currentTime      │
   │ Logic:       │        │                  │
   │ Triage check │        │ Fatigue calc     │
   │ Agent select │        │ Schedule context │
   │              │        │                  │
   │ Claude API ──┼──────► │ Claude API ──────┼──►
   │ (vision)     │        │ (text)           │
   │              │        │                  │
   │ Output:      │        │ Output:          │
   │ items[]      │        │ nearbyOptions[]  │
   │ recipe       │        │ microInterv...[] │
   │ macros       │        │ mealTimingAdvice │
   └──────────────┘        │ proactiveAlert   │
                           └──────────────────┘
```

### Agent routing logic

The schedule in `UserProfileContext` stores events with a date and time string. Both API routes inspect the upcoming events: if any event starts within 75 minutes of the request time, the **Triage Agent** system prompt is used; otherwise the **Culinary Agent** runs. This switching is entirely prompt-based — the same Claude model handles both, with different instructions per mode.

### Data persistence

All data is client-side only:
- `localStorage['anchorfuel_profile']` — serialized `UserProfile` object
- `localStorage['anchorfuel_meals']` — serialized map of date strings → `DailyLog`

There is no backend database, user account system, or cross-device sync.

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd eatgood

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/action` on load.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — powers both `/api/analyze` and `/api/suggest` |
| `ANTHROPIC_MODEL` | No | Claude model for image analysis. Defaults to `claude-sonnet-4-5` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Installed but not used in the current implementation |

Create `.env.local` (never commit it):

```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
```

---

## Running Locally

```bash
npm run dev        # Development server with hot reload
npm run build      # Production build
npm run preview    # Build then serve (production preview)
npm run lint       # ESLint via Next.js
```

The dev server binds to `0.0.0.0`, so it is accessible on your local network (useful for testing the PWA on a physical phone).

---

## Folder Structure

```
eatgood/
├── app/
│   ├── (main)/                  # Route group — pages with shared bottom nav
│   │   ├── action/page.tsx      # Camera scan UI (fridge / menu mode)
│   │   ├── dashboard/page.tsx   # Macro tracker, suggestions, history
│   │   ├── profile/page.tsx     # Settings, targets, schedule management
│   │   └── layout.tsx           # Bottom navigation bar
│   ├── api/
│   │   ├── analyze/route.ts     # Image analysis — Triage / Culinary agent
│   │   └── suggest/route.ts     # Location-based proactive suggestions
│   ├── layout.tsx               # Root layout — fonts, PWA meta, context provider
│   ├── page.tsx                 # Root redirect → /action
│   └── globals.css              # Tailwind v4 + semantic design tokens
├── context/
│   └── UserProfileContext.tsx   # Global state — profile, meals, schedule, GPS
├── components/ui/               # shadcn/ui primitives (Button, Card, Dialog, etc.)
├── lib/
│   └── utils.ts                 # clsx/tailwind-merge helper
├── public/
│   └── manifest.json            # PWA manifest (name, icons, start_url)
├── .env.example                 # Environment variable template
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Design Decisions & Tradeoffs

**Agentic prompt routing over separate models**
Both the Triage and Culinary agents run on the same Claude model with different system prompts, selected at request time based on schedule proximity. This keeps the codebase simple and avoids managing multiple API clients, at the cost of slightly longer prompts.

**localStorage over a backend database**
Choosing localStorage eliminates any need for authentication, a database, or server infrastructure. The tradeoff is that data is per-browser and not recoverable. This was a deliberate choice for a hackathon demo where privacy and simplicity outweigh persistence.

**AI-estimated macros over a nutrition database**
Macro values come from Claude's vision analysis rather than a structured nutrition API. This means the app works on any food photo without building or licensing a food database. Accuracy is less precise than a dedicated nutrition API, but coverage is far broader (any food, any language, any context).

**Geolocation without a maps SDK**
The `suggest` endpoint receives GPS coordinates and asks Claude to suggest nearby venues by type and approximate distance. No maps tile provider, geocoding API, or Places API is used. This keeps costs near zero but means venue suggestions are AI-generated estimates, not real-time listings.

**PWA over a native app**
A Next.js PWA allows installation on iOS and Android from the browser with no App Store submission. The tradeoff is limited access to native APIs (camera access is available via `getUserMedia`, geolocation via the Geolocation API, both of which work in mobile Safari and Chrome).

**Tailwind v4 semantic tokens**
Design tokens are defined in `globals.css` as CSS custom properties and used via semantic Tailwind class aliases (`brand`, `surface-base`, `content-primary`, etc.) rather than raw color utilities. This ensures consistent theming and makes a potential future rebrand a single-file change.

---

## Integrations

| Integration | What it does | Real data? |
|---|---|---|
| Anthropic Claude API | Image analysis, macro estimation, restaurant suggestions, wellness coaching | Yes — live API |
| Browser Geolocation API | Provides GPS coordinates to the suggest endpoint | Yes — device GPS |
| react-webcam | Camera capture for food scanning | Yes — device camera |
| `localStorage` | Persists profile and meal log between sessions | Yes — local only |
| PWA Manifest | Enables install-to-homescreen on mobile | Yes |

---

## Contributors

| Name | Role |
|---|---|
| Ria Gupta | Full-stack development, AI integration, UI/UX design |

---

## License

This project was built as a hackathon prototype. No license is currently specified — all rights reserved by the contributors unless otherwise stated.
