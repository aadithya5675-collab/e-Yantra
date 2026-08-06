export type Role = 'admin' | 'member';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  role: string;
  must_change_password?: boolean;
  notifications_enabled?: boolean;
  team_id?: number | null;
  is_leader?: boolean;
  created_at?: string;
}



export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  status: TaskStatus;
  progress_notes: string | null;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  due_time: string | null;
  delay_reason: string | null;
  theme_id: number | null;
  alarm_acknowledged: boolean;
  marks?: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_profile?: Profile;
}
