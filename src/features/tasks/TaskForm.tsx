import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/uiverse/Button';
import { Modal, Field } from '../../components/ui/Modal';
import { useProfiles } from '../profiles/api';
import { useEvents } from '../events/api';
import { useAuth } from '../auth/AuthContext';
import type { Task } from '../../types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigned_to: z.string().min(1, 'Assign to someone'),
  event_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  task?: Task;
  defaultEventId?: string;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function TaskForm({ task, defaultEventId, onSubmit, onClose, isLoading }: Props) {
  const { profile } = useAuth();
  const { data: profiles } = useProfiles();
  const { data: events } = useEvents();
  const [adminSetsDate, setAdminSetsDate] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      assigned_to: task?.assigned_to ?? '',
      event_id: task?.event_id ?? defaultEventId ?? '',
      priority: task?.priority ?? 'medium',
      due_date: task?.due_date ?? '',
      due_time: task?.due_time ?? '',
    },
  });

  const assignedTo = useWatch({ control, name: 'assigned_to' });

  return (
    <Modal title={task ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Title" error={errors.title?.message} {...register('title')} />

        <Field label="Description">
          <textarea className="field resize-none" rows={3} {...register('description')} />
        </Field>

        <Field label="Assign To">
          <select className="field" {...register('assigned_to')}>
            <option value="">Select member</option>
            {profiles?.map(p => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
          {errors.assigned_to && (
            <span className="text-[12px] text-danger-color">{errors.assigned_to.message}</span>
          )}
        </Field>

        <Field label="Event">
          <select className="field" {...register('event_id')}>
            <option value="">No event</option>
            {events?.filter(e => e.status !== 'completed').map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </Field>

        <Field label="Priority">
          <select className="field" {...register('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>

        {(!assignedTo || assignedTo === profile?.id) ? (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" {...register('due_date')} />
            <Input label="Due Time" type="time" {...register('due_time')} />
          </div>
        ) : (
          <div className="bg-surface p-4 rounded-xl border border-hairline text-[13px] text-text-secondary flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text-primary">Due Date Preference</span>
              <div className="flex bg-bg-page p-1 rounded-lg border border-hairline">
                <button
                  type="button"
                  onClick={() => setAdminSetsDate(false)}
                  className={`px-3 py-1 rounded-md transition-colors ${!adminSetsDate ? 'bg-surface shadow-sm text-text-primary' : 'hover:text-text-primary'}`}
                >
                  Let Assignee Set
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSetsDate(true)}
                  className={`px-3 py-1 rounded-md transition-colors ${adminSetsDate ? 'bg-surface shadow-sm text-text-primary' : 'hover:text-text-primary'}`}
                >
                  Set Manually
                </button>
              </div>
            </div>

            {adminSetsDate ? (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input label="Due Date" type="date" {...register('due_date')} />
                <Input label="Due Time" type="time" {...register('due_time')} />
              </div>
            ) : (
              <div className="text-center py-2">
                {task?.due_date ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-text-primary">Due Date Set</span>
                    <span>{task.due_date} {task.due_time ? `· ${task.due_time.slice(0, 5)}` : ''}</span>
                  </div>
                ) : (
                  <span>The assignee will set their own due date and time.</span>
                )}
                <input type="hidden" {...register('due_date')} />
                <input type="hidden" {...register('due_time')} />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Saving…' : task ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
