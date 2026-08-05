export type Role = 'admin' | 'member';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed';
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
  created_at?: string;
}

export interface TeamEvent {
  id: string;
  title: string;
  description: string | null;
  status: EventStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string;
  status: TaskStatus;
  progress_notes: string | null;
  priority: Priority;
  due_date: string | null;
  due_time: string | null;
  delay_reason: string | null;
  alarm_acknowledged: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_profile?: Profile;
  event?: TeamEvent;
}
