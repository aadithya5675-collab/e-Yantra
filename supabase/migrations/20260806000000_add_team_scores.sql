-- Migration: Add official_score and arc_points to public.teams
-- Safe, non-destructive, idempotent migration with non-negative constraints and 0 defaults.

ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS official_score NUMERIC DEFAULT 0 NOT NULL CHECK (official_score >= 0),
ADD COLUMN IF NOT EXISTS arc_points INTEGER DEFAULT 0 NOT NULL CHECK (arc_points >= 0);

-- Example update statement (commented out per requirements):
-- UPDATE public.teams SET official_score = 95.5, arc_points = 120 WHERE id = 1;
