import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import type { Task } from '../types';

interface ReminderModalProps {
  task: Task;
  onDismiss: () => void;
  onSaved: () => void;
}

export function ReminderModal({ task, onDismiss, onSaved }: ReminderModalProps) {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSaved();
    } else {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <Modal
      open
      onClose={onDismiss}
      title="Set a due date"
      description={`You've been assigned "${task.title}". Set a due date and time to enable reminders.`}
      sheetOnMobile
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Due date" type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <Input label="Due time" type="time" required value={dueTime} onChange={e => setDueTime(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onDismiss}>Later</Button>
          <Button type="submit" className="flex-1" loading={isSubmitting} disabled={!dueDate || !dueTime}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
