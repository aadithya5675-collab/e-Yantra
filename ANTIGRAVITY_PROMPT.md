# MASTER PROMPT — FINISH ARC MISSION CONTROL (for Antigravity)

You are the principal full-stack engineer, Laravel architect, security engineer, UI/UX +
GSAP motion designer, Three.js developer and QA lead for this project. Continue an
in-progress build to completion in one continuous run. Inspect the repo first, then
implement — do not stop at a plan or proposal.

---

## 0. NON-NEGOTIABLE GUARDRAILS (read first)

- **DO NOT push to Git.** No `git commit`, no `git push`, no branches, no tags. Leave all
  changes in the working tree only. The user reviews and commits manually.
- **DO NOT push to any remote Supabase project.** No `supabase db push`, no
  `supabase migration up` against a remote, no `supabase link` mutations, no edits to the
  hosted database or hosted storage. Laravel **migrations are the schema source of truth**
  and must run only against a **local/test database** (SQLite in-memory for tests; a local
  Postgres if available). Never apply destructive changes to the hosted Supabase DB.
- **Never print or commit secrets.** The service-role key stays backend-only, never in the
  frontend bundle. `.env` files are already git-ignored — keep them that way.
- If a genuinely destructive or credential-required remote action is the only way forward,
  **stop and report** instead of doing it.
- Preserve the user's existing working-tree changes; do not revert unrelated files.

---

## 1. WHAT ALREADY EXISTS (do not rebuild these — extend them)

Monorepo at repo root:
- **Frontend** (`/`): React 19 + TypeScript + Vite 8 + Tailwind v4 + TanStack Query +
  React Hook Form + Zod + Supabase Auth JS + GSAP (`@gsap/react`). Builds green
  (`npm run build`, `npm run lint`).
- **Backend** (`/backend`): **Laravel 13 / PHP 8.3** app. All PHP is `php -l` clean.

Already implemented and verified (see `IMPLEMENTATION_REPORT.md` for the full list):
- **Security**: `.env` untracked + `.gitignore` hardened; sanitized `.env.example` (root + backend);
  `config/cors.php` restricted to `FRONTEND_URL`; roles kept off client-editable profile fields.
- **Backend foundation**: migrations for `competition_cycles`, `themes`,
  `theme_metric_definitions`, `profiles`, `role_requests`, `mentor_theme_assignments`,
  `teams`, `team_memberships`, `team_invitations`, `system_settings`, `audit_logs`.
  Enums in `app/Enums`. `SupabaseTokenVerifier` (dependency-free JWKS RS256 + legacy HS256).
  Middleware `VerifySupabaseToken` / `EnsureProfileApproved` / `EnsureRole` (aliases
  `supabase`, `approved`, `role`). `TeamPolicy`. Transactional Actions in `app/Actions/Teams`
  (`CreateTeamAction`, `SendInvitationAction`, `RespondToInvitationAction`, `LockRosterAction`,
  `UnlockTeamAction`). Controllers under `app/Http/Controllers/Api/V1`. Routes in `routes/api.php`.
  `arc:bootstrap-admin` command. `ThemeSeeder` (7 themes) + `DatabaseSeeder`. PHPUnit tests
  `ExactlyOneThemeTest`, `TeamFormationTest`. Factories for Profile/Theme/CompetitionCycle.
- **Frontend**: ARC aerospace design tokens in `src/index.css` (dark-first, cyan accent, amber
  deadlines, green verified, red critical; radius/motion/z-index tokens; reduced-motion).
  Typed API client `src/lib/api/client.ts`. Domain types `src/types/arc.ts`. Flagship
  single-theme onboarding in `src/features/onboarding/` (`ThemeSelect` = accessible ARIA
  radiogroup emitting one scalar `theme_id`; `OnboardingWizard`). Route `/onboarding` in `App.tsx`.

---

## 2. ENVIRONMENT PREREQUISITE

`composer install` may fail if the machine is behind a **captive portal** (symptom: TLS
resets to `codeload.github.com`, or git redirected to a `user_login.php` page). If so,
authenticate to the network first. Composer binary is at repo-root `./composer.phar`; global
config has `preferred-install=source` (git clone from github.com works when the portal is open).
Run: `cd backend && composer install && cp .env.example .env && php artisan key:generate`.
Use **SQLite in-memory for tests** (already configured in `phpunit.xml`) so nothing touches a
remote DB.

---

## 3. THE ONE PRODUCT RULE THAT OVERRIDES EVERYTHING

**Each team selects EXACTLY ONE e-Yantra challenge theme.** No preferences, no primary/secondary,
no `theme_preferences` table, no theme array, no "final theme" phase. Already enforced — keep it
enforced at DB, validation, action, policy and test layers in all new code. Themes:
Logic Quest, Khoj-o-Drone, Strata Cobot, Hola The Explorer, Niti Vahan, Echo Balancer, PacBot.

---

## 4. REMAINING WORK TO IMPLEMENT (build all of it)

Follow the existing patterns exactly: thin controllers → Form Requests → Policies →
transactional Actions → API Resources; enums; indexed FKs; append-only audit for sensitive
changes; `/api/v1` routes; consistent `401/403/404/409/422`. Frontend: feature folders under
`src/features/*`, React Query + Zod at the API boundary, GSAP via `useGSAP`/`gsap.context` with
`matchMedia` + reduced-motion, route-level code splitting, loading/empty/error/unauthorized
states on every route, WCAG AA, responsive (360→1440+), ~44px touch targets, no horizontal overflow.

### Phase 3 — Tasks, evidence, scoring, leaderboard (backend + frontend)
- Migrations/models/enums: `tasks`, `task_targets`, `task_assignments`, `task_dependencies`,
  `work_logs`, `submissions`, `submission_versions`, `evidence_files`, `task_reviews`,
  `deadline_extensions`, `score_windows`, `score_entries`, `contribution_point_entries`.
- Task lifecycle: `Draft→Published→Acknowledged→In Progress→Submitted→Under Review→
  Changes Requested|Verified→Archived`. "Completed" means **Verified by an authorized reviewer**,
  never a student click. Changes-requested requires feedback. Resubmission creates a new
  `submission_version`; prior evidence stays immutable. Deadline changes require a reason + history.
- Task targeting: one admin task definition → backend **transactionally generates assignments**
  for all-teams / one-or-more-themes / selected-teams / individual members. Leaders can delegate
  to members without changing the admin's ownership.
- Evidence: **private Supabase Storage** bucket `arc-evidence`. Use short-lived **signed upload
  URLs** (or resumable uploads) issued by Laravel; validate MIME/size; safe generated paths
  `cycle/team/task/submission/user/uuid.ext`; expiring signed **download** URLs; access limited to
  owning team + assigned mentor + admin; admin quarantine. **No public URLs, no base64 in DB, do
  not proxy large video bodies through PHP.** Do NOT create the bucket on the remote project —
  document the manual bucket-creation step instead (per the no-remote-push rule).
- Scoring: two independent ledgers. **Official scores** — admin opens a `score_window`; leader
  submits judge-provided mark + proof → `Pending Verification`; admin verifies/corrects(with
  reason)/rejects; **only Verified counts** and is locked; reopening needs an admin action + audit.
  **ARC contribution points** — separate immutable ledger, reason required. Never merge the two.
  Leader can never directly edit team total.
- Leaderboard: verified-only; default ranking within the selected theme; filters (cycle/theme/
  task/round); Official vs ARC Contribution tabs; tie handling; "last updated"; accessible table +
  mobile cards; **GSAP Flip** on rank changes with reduced-motion fallback.
- Jobs/scheduler: deadline reminders, overdue notifications, inactivity checks, digests —
  idempotent, no spam. Once these cover it, remove the obsolete `/supabase/functions/
  dispatch-reminders` edge function (delete the file only; do not touch the remote).

### Phase 4 — Frontend app shell, dashboards, routes, 3D (finish the rebuild)
- Replace the leftover Uvira/task-manager routes and branding. Role-aware **app shell**
  (sidebar/nav) + role-aware dashboards: **Waiting Lobby**, **Team Member**, **Team Leader**,
  **Mentor**, **Admin Command Centre**, plus **Team Workspace**. Aggregated dashboard endpoints
  (avoid N+1); every stat drills down.
- Full route set with real API data: themes, tasks, task detail, submissions, leaderboard,
  announcements, notifications, user settings, and admin: users, teams, themes, tasks, reviews,
  scoring, announcements, reports, settings, audit logs, equipment.
- **Auth screens**: login/register/reset with a subtle Three.js aerospace/orbital background
  (lazy-loaded, separate chunk, capped DPR, pause when hidden/offscreen, dispose resources,
  static fallback; never required to authenticate).
- **Three.js theme explorer**: central ARC node + 7 theme nodes, selected focuses; the underlying
  control stays the accessible single-select `ThemeSelect`. Lazy-loaded, mobile/low-power fallback.
- GSAP: route transitions, dashboard entrance choreography, counters, timeline reveals, task-status
  transitions, drawer/modal, leaderboard Flip. Scope + revert on unmount; no ScrollTrigger on dense
  ops screens. **PWA**: installable; cache only safe static assets — never tokens, evidence URLs, or
  private data.
- **Lightswind** (source-first): only if compatible with React 19 + Vite + Tailwind v4; install
  selected components via `npx lightswind add <c>` and import from `@/components/lightswind/...`;
  never `import ... from "lightswind"`; no full-library install; keep license notices. Use at most
  one or two OriginKit-style effects — original implementations, inspiration only.

### Phase 5 — Announcements, risk, equipment, reports, private comments, QA
- Announcements (target everyone/themes/teams/roles/users; schedule/expiry/pin/required-ack;
  read+ack analytics; drafts) + `announcement_acknowledgements`. Notifications for all lifecycle
  events. `private_comments` (admin↔team, mentor↔team, admin↔mentor; visibility shown before post;
  sanitize rich text/Markdown — XSS-safe).
- Deterministic, **explainable** team-risk detection (overdue tasks, days since update, unresolved
  blockers, repeated changes-requested, missing score, low completion, inactive members) — show the
  contributing reasons; acknowledge/note/escalate/resolve with history.
- Equipment module (admin-toggleable in settings): categories, items, stock units/quantities,
  availability, booking requests, approve/reject, checkout/return, condition, maintenance,
  **double-booking prevented via DB transactions + locking**, usage history, team/project link.
- Reports: weekly team/theme/faculty summaries; CSV + professional PDF exports; date/theme/team
  filters; background generation for large exports; no sensitive PII unless the report requires it.
- Admin settings area (validated, dirty-state, save feedback, confirm high-impact, audit sensitive
  changes, never show full secrets): branding, active cycle, registration, approvals, team-size
  limits, roster/theme locking, theme visibility, mentor assignments, task defaults, score rules,
  leaderboard display, evidence limits, notification timing, risk thresholds, timezone (store UTC,
  display Asia/Kolkata), equipment controls, queue/scheduler health, retention.

---

## 5. SECURITY TESTS REQUIRED (add for all new code)
Self-promotion attempts; cross-team task/evidence access (IDOR); unauthorized theme changes;
roster-limit bypass; duplicate membership; direct total-score manipulation; verification bypass;
expired signed URLs where testable. Backend: PHPUnit/Pest. Frontend: Vitest + React Testing
Library + Playwright E2E. Also run Pint, Larastan (if compatible), `composer audit`, `npm audit`.

## 6. ACCEPTANCE SCENARIOS (the work is done when these pass locally)
Bootstrapped admin must change temp password → student registers/verifies/waits → admin approves →
leader request → admin approves → onboarding picks **exactly one theme** → team identity + invites →
members accept without duplicate membership → admin locks roster → workspace unlocks → admin
publishes theme-targeted task → assignments generated for all teams in that theme → work logs +
private evidence upload → versioned submission → mentor/admin requests changes → resubmit keeps old
evidence → reviewer verifies → admin opens score window → leader submits marks+proof (absent from
leaderboard while pending) → admin verifies → leaderboard updates + animates → contribution points
stay separate → cross-team access returns 403 → admin exports report → announcements track acks →
at-risk teams show reasons → equipment can't double-book → works on mobile + reduced-motion →
frontend build + backend tests + core E2E pass.

## 7. DELIVERABLES AT THE END
Update `IMPLEMENTATION_REPORT.md`. Provide/refresh: OpenAPI or API docs, ERD/schema doc, permission
matrix, backend README, deployment guide. Finish with: (1) product summary, (2) architecture +
security changes, (3) UI/motion changes, (4) exact test/build commands run and their results,
(5) any remaining steps that genuinely need the user's Supabase/network credentials (e.g. creating
the private storage bucket, rotating the previously-committed anon key, running migrations against
their own DB). Leave no dead routes, no non-functional buttons, no old branding, no hardcoded
credentials, no TypeScript/console errors. **Do not commit, do not push to Git, do not push to
remote Supabase.**
