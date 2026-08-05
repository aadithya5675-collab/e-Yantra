-- Run this script in the Supabase SQL Editor

-- 1. Add team_id and is_leader columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_leader BOOLEAN DEFAULT FALSE;

-- 2. Add theme_id to announcements (if not exists)
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS theme_id BIGINT REFERENCES public.themes(id) ON DELETE SET NULL;

-- 3. Add theme_id to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS theme_id BIGINT REFERENCES public.themes(id) ON DELETE CASCADE;

-- 4. Update existing admin to ensure they have the proper role (just to be safe)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'uvira@uvira-apex.team';
