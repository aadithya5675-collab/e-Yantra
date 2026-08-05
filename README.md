# ARC Mission Control

**Aviation & Robotics Club — e-Yantra Team Operations**

An internal command-centre platform for managing the club's seven e-Yantra teams:
onboarding, tasks, evidence, reviews, official marks, contribution points,
announcements and equipment.

> ⚠️ Internal club platform. **Not** the official IIT Bombay / e-Yantra portal.

## Monorepo layout
- **`/` (root)** — React 19 + TypeScript + Vite frontend (ARC design system, onboarding).
- **`/backend`** — Laravel 13 REST API (`/api/v1`), the canonical business layer.
- **`/supabase`** — legacy migrations/edge function from the previous app (being superseded
  by Laravel migrations; see `IMPLEMENTATION_REPORT.md`).

## Frontend
```bash
npm install
cp .env.example .env     # set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm run dev              # http://localhost:5173
npm run build            # tsc -b && vite build
npm run lint             # oxlint
```

`.env` keys:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...          # public, RLS-protected — safe in the browser
VITE_API_URL=http://localhost:8000/api/v1
```

## Backend
See [`backend/README.md`](backend/README.md) for Laravel setup, the secure
`arc:bootstrap-admin` command, and the API surface.

## Architecture, security & status
See [`IMPLEMENTATION_REPORT.md`](IMPLEMENTATION_REPORT.md) — it documents what is built
and verified, the exactly-one-theme rule, security decisions, and the remaining roadmap.

## Key rule: one theme per team
Each team leader selects **exactly one** e-Yantra challenge theme. There are no theme
preferences, no primary/secondary, and no multi-theme array — enforced at the database,
validation, action, policy and test layers.
