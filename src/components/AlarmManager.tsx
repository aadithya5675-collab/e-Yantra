import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useTasks } from '../features/tasks/api';
import { AlarmModal } from './AlarmModal';
import type { Task } from '../types';

export function AlarmManager() {
  const { profile } = useAuth();
  const { data: tasks, refetch } = useTasks();
  const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);

  // Poll for tasks and check if any are overdue
  useEffect(() => {
    const checkTasks = () => {
      if (!profile || !profile.notifications_enabled || !tasks) return;
      if (activeAlarmTask) return; // Don't trigger a new alarm if one is already active

      const now = new Date();
      for (const task of tasks) {
        if (
          task.assigned_to === profile.id &&
          task.status !== 'completed' &&
          !task.alarm_acknowledged &&
          task.due_date &&
          task.due_time
        ) {
          // Parse local date and time. Supabase returns time in 'HH:mm:ss' format, or 'HH:mm'.
          const timePart = task.due_time.length <= 5 ? `${task.due_time}:00` : task.due_time;
          const dueDateTimeStr = `${task.due_date}T${timePart}`;
          const dueDate = new Date(dueDateTimeStr);

          if (!isNaN(dueDate.getTime()) && dueDate < now) {
            setActiveAlarmTask(task);
            break;
          }
        }
      }
    };

    const intervalId = setInterval(() => {
      checkTasks();
      // Refetch periodically to make sure we have the latest task data
      // useTasks handles caching, but we can call refetch just in case
      refetch();
    }, 10000);

    // Initial check
    checkTasks();

    return () => clearInterval(intervalId);
  }, [profile, tasks, activeAlarmTask, refetch]);

  if (!activeAlarmTask) return null;

  return (
    <AlarmModal 
      task={activeAlarmTask} 
      onDismiss={() => {
        setActiveAlarmTask(null);
        refetch(); // immediately fetch updated task to prevent loop
      }} 
    />
  );
}
