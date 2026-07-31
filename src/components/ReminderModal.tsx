import { useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { Button } from './uiverse/Button';
import { Input } from './ui/Input';
import type { Task } from '../types';
import { Bell } from 'lucide-react';

interface ReminderModalProps {
  task: Task;
  onDismiss: () => void;
  onSaved: () => void;
}

export function ReminderModal({ task, onDismiss, onSaved }: ReminderModalProps) {
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate || !dueTime) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('tasks')
      .update({ due_date: dueDate, due_time: dueTime })
      .eq('id', task.id);
    
    setIsSubmitting(false);
    if (!error) {
      onSaved();
    } else {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-hairline shadow-2xl w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-accent-color/10 flex items-center justify-center mx-auto mb-4 text-accent-color">
          <Bell size={28} />
        </div>
        
        <h2 className="text-xl font-semibold text-text-primary mb-2">Set Due Date</h2>
        <p className="text-[14px] text-text-secondary mb-6 line-clamp-2">
          You've been assigned: <strong className="text-text-primary">"{task.title}"</strong>. Please set a due date and time for this task.
        </p>

        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Due Date" 
              type="date" 
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
            <Input 
              label="Due Time" 
              type="time" 
              required
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={onDismiss}>
              Later
            </Button>
            <Button type="submit" className="flex-1" disabled={!dueDate || !dueTime || isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
