-- Migration: Add official_score to public.teams
-- Safe, non-destructive, idempotent migration with non-negative constraints and 0 defaults.

ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS official_score NUMERIC DEFAULT 0 NOT NULL CHECK (official_score >= 0);

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS marks INTEGER DEFAULT 0 NOT NULL CHECK (marks >= 0);

-- Example update statement (commented out per requirements):
-- UPDATE public.teams SET official_score = 95.5 WHERE id = 1;

-- Protect official_score so only team leaders can update it
CREATE OR REPLACE FUNCTION public.protect_official_score()
RETURNS trigger AS $$
BEGIN
  IF NEW.official_score IS DISTINCT FROM OLD.official_score THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND team_id = NEW.id AND is_leader = true) THEN
      RAISE EXCEPTION 'Only the team leader can update the official_score';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_official_score_update ON public.teams;
CREATE TRIGGER check_official_score_update
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_official_score();
