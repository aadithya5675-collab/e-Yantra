# e-Yantra

A specialized dashboard and team management application for e-Yantra's ARC teams, built to handle team creation, task tracking, leaderboards, and announcements.

## Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- TanStack Query (React Query)
- Supabase (PostgreSQL & Auth)
- GSAP & Framer Motion (Animations)
- Lucide React (Icons)

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Deployment
This project is configured to deploy seamlessly on Vercel. Connect your repository and add the environment variables in the Vercel dashboard. No additional build settings are required.
