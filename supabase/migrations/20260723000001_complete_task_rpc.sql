-- supabase/migrations/20260723000001_complete_task_rpc.sql
CREATE OR REPLACE FUNCTION complete_task(p_task_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := CURRENT_DATE;
  v_xp_reward INTEGER := 10;
  v_stats_record user_stats%ROWTYPE;
BEGIN
  -- Get user ID and ensure task belongs to them
  SELECT user_id INTO v_user_id FROM tasks WHERE id = p_task_id AND auth.uid() = user_id AND status = 'active';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Task not found or not authorized';
  END IF;

  -- Mark task as completed
  UPDATE tasks SET status = 'completed' WHERE id = p_task_id;
  
  -- Insert completion record
  INSERT INTO task_completions (task_id, user_id, completed_at) VALUES (p_task_id, v_user_id, NOW());
  
  -- Handle stats
  SELECT * INTO v_stats_record FROM user_stats WHERE user_id = v_user_id FOR UPDATE;
  
  -- Check streak
  IF v_stats_record.last_completed_date IS NULL OR v_stats_record.last_completed_date < v_today THEN
    -- If it's a new day
    IF v_stats_record.last_completed_date = (v_today - INTERVAL '1 day')::DATE THEN
      v_stats_record.current_streak := v_stats_record.current_streak + 1;
    ELSE
      v_stats_record.current_streak := 1;
    END IF;
    
    IF v_stats_record.current_streak > v_stats_record.best_streak THEN
      v_stats_record.best_streak := v_stats_record.current_streak;
    END IF;
    
    v_stats_record.last_completed_date := v_today;
  END IF;
  
  -- Add XP and update level
  v_stats_record.xp := v_stats_record.xp + v_xp_reward;
  v_stats_record.level := FLOOR(v_stats_record.xp / 100) + 1;
  v_stats_record.tasks_completed := v_stats_record.tasks_completed + 1;
  
  UPDATE user_stats SET
    xp = v_stats_record.xp,
    level = v_stats_record.level,
    current_streak = v_stats_record.current_streak,
    best_streak = v_stats_record.best_streak,
    tasks_completed = v_stats_record.tasks_completed,
    last_completed_date = v_stats_record.last_completed_date
  WHERE user_id = v_user_id;
  
END;
$$;
