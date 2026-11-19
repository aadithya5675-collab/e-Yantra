<h1 align="center">e-Yantra</h1>

<p align="center">
  A team dashboard for e-Yantra ARC teams: team onboarding, task tracking, theme leaderboards and announcements.
</p>

<p align="center">
  <a href="https://e-yantra-nine.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-e--yantra--nine.vercel.app-70a5fd?style=for-the-badge&logo=vercel&logoColor=white&labelColor=1a1b27" alt="Live demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-70a5fd?style=for-the-badge&logo=react&logoColor=white&labelColor=1a1b27" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6-70a5fd?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1a1b27" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-8-bf91f3?style=for-the-badge&logo=vite&logoColor=white&labelColor=1a1b27" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-70a5fd?style=for-the-badge&logo=tailwindcss&logoColor=white&labelColor=1a1b27" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase-Postgres_%26_Auth-bf91f3?style=for-the-badge&logo=supabase&logoColor=white&labelColor=1a1b27" alt="Supabase">
  <img src="https://img.shields.io/badge/Vercel-Deploy-70a5fd?style=for-the-badge&logo=vercel&logoColor=white&labelColor=1a1b27" alt="Vercel">
</p>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Development commands](#development-commands)
- [Deployment](#deployment)
- [Author](#author)

## Overview

e-Yantra is a specialized dashboard and team management application for e-Yantra's ARC teams. It handles team creation, task tracking, leaderboards and announcements, with separate views for admins, team leaders and team members.

## Features

- **Auth and onboarding** – email sign-up and login through Supabase Auth. New users pick a role in an onboarding wizard: leaders create a team (one e-Yantra theme, team name, optional official e-Yantra team ID and description); members wait in a holding screen that polls until a leader adds them to a team.
- **Role-based navigation** – admins see Leaderboard, Announcements, Manage Tasks and Settings; team members see Leaderboard, My Team, Announcements and Settings.
- **Leaderboard** – teams ranked by the total of their obtained task marks, filterable by theme. Rows expand to show each team's tasks, and admins can enter marks or edit and delete tasks from there.
- **Task management** – admins create tasks and assign them to teams; marks and obtained marks are stored per task.
- **My Team** – members see their teammates and the team's tasks.
- **Announcements** – admins publish announcements, optionally requiring acknowledgement; members see announcements for their theme and can acknowledge them.
- **Due-date alarms** – an in-app alarm manager reminds users about tasks with no due date and shows an overdue alert that asks for a delay reason.
- **Settings** – dark/light theme toggle, password change, and team management for leaders (rename the team, set the e-Yantra team code, add or remove unassigned members).
- **UX details** – route-level code splitting, page transitions and animated numbers (GSAP), and Zod validation of API responses.

## Tech stack

| Area | Tools |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4, Lucide React icons, IBM Plex / Instrument Serif fonts |
| Routing and data | React Router DOM 7, TanStack Query (React Query) |
| Forms and validation | React Hook Form, Zod |
| Animation | GSAP (`@gsap/react`) |
| Backend | Supabase (PostgreSQL, Auth, row-level security) |
| Tooling | Vite 8, oxlint, Vercel |

## Project structure

```text
e-Yantra/
├── public/                 # favicon
├── src/
│   ├── app/                # AppShell (sidebar / bottom navigation)
│   ├── components/         # alarm & reminder modals, motion helpers, ui primitives
│   ├── features/
│   │   ├── announcements/
│   │   ├── auth/           # AuthContext, Login, Signup
│   │   ├── dashboard/
│   │   ├── leaderboard/
│   │   ├── onboarding/     # team onboarding wizard, theme select
│   │   ├── settings/
│   │   ├── tasks/
│   │   └── team/
│   ├── lib/                # Supabase client, theme provider, motion config
│   └── types/
├── supabase/               # config, migrations, schema.sql, update_profiles.sql
├── vercel.json             # SPA rewrite to index.html
└── vite.config.ts
```

## Getting started

**Prerequisites:** Node.js and npm, plus a Supabase project.

```bash
git clone https://github.com/aadithya5675-collab/e-Yantra.git
cd e-Yantra
npm install
cp .env.example .env   # then fill in your Supabase values
npm run dev
```

The database schema and migrations live in the [`supabase/`](supabase) folder.

## Environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

# Run linter
npm run lint
```

## Deployment

This project is configured to deploy on Vercel (`vercel.json` rewrites all routes to `index.html`). Connect your repository and add the environment variables in the Vercel dashboard. No additional build settings are required.

## Author

**Aadithya G** – [@aadithya5675-collab](https://github.com/aadithya5675-collab)
