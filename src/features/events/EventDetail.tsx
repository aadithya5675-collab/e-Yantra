import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useEvent } from './api';
import { useTasks, useCreateTask, useUpdateTask } from '../tasks/api';
import { TaskCard } from '../tasks/TaskCard';
import { TaskForm } from '../tasks/TaskForm';
import { Button } from '../../components/uiverse/Button';
import { Reveal } from '../../components/motion/Reveal';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { ChevronLeft, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, EventStatus } from '../../types';

const statusChip: Record<EventStatus, string> = {
  upcoming: 'bg-warning-color/12 text-warning-color',
  ongoing: 'bg-accent-color/12 text-accent-color',
  completed: 'bg-success-color/12 text-success-color',
};

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, profile } = useAuth();
  const { data: event, isLoading: eventLoading } = useEvent(id!);
  const { data: tasks, isLoading: tasksLoading } = useTasks({ event_id: id });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();

  const handleSubmit = async (data: any) => {
    const payload = { 
      ...data, 
      event_id: data.event_id || id,
      due_date: data.due_date || null,
      due_time: data.due_time || null
    };
    if (editing) {
      await updateTask.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createTask.mutateAsync({ ...payload, created_by: profile?.id });
    }
    setShowForm(false);
    setEditing(undefined);
  };

  if (eventLoading || tasksLoading) {
    return (
      <div className="max-w-[760px] mx-auto space-y-4">
        <div className="surface-card h-40 animate-pulse" />
        {[0, 1].map(i => <div key={i} className="surface-card h-24 animate-pulse" />)}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-[760px] mx-auto text-center py-24">
        <p className="text-[17px] text-text-secondary">This event no longer exists.</p>
        <Link to="/events" className="inline-block mt-4 text-[15px] text-accent-color hover:opacity-70">
          Back to Events
        </Link>
      </div>
    );
  }

  const done = tasks?.filter(t => t.status === 'completed').length ?? 0;
  const total = tasks?.length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="max-w-[760px] mx-auto">
      <Link
        to="/events"
        className="inline-flex items-center gap-0.5 -ml-1 mb-8 text-[15px] text-accent-color hover:opacity-70 transition-opacity"
      >
        <ChevronLeft size={17} /> Events
      </Link>

      <Reveal className="mb-12" y={20}>
        <span className={`chip ${statusChip[event.status]} capitalize mb-4`}>
          {event.status}
        </span>

        <h1 className="text-[40px] leading-[1.08] font-semibold tracking-[-0.028em] text-text-primary">
          {event.title}
        </h1>

        {event.description && (
          <p className="mt-3 text-[17px] leading-relaxed text-text-secondary max-w-xl">
            {event.description}
          </p>
        )}

        <div className="flex items-center flex-wrap gap-x-5 gap-y-1 mt-5 text-[13px] text-text-secondary">
          {event.start_date && <span>Starts {format(new Date(event.start_date), 'MMM d, yyyy')}</span>}
          {event.end_date && <span>Ends {format(new Date(event.end_date), 'MMM d, yyyy')}</span>}
        </div>
      </Reveal>

      {/* Progress */}
      {total > 0 && (
        <Reveal className="surface-card p-6 mb-12" deps={[done, total]}>
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[13px] font-semibold tracking-[0.04em] uppercase text-text-secondary">
              Progress
            </span>
            <span className="text-[15px] font-medium text-text-primary tabular-nums">
              <AnimatedNumber value={done} />/{total}
            </span>
          </div>
          <div className="h-1 rounded-full bg-text-secondary/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-color transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Reveal>
      )}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[13px] font-semibold tracking-[0.04em] uppercase text-text-secondary">
          Tasks · {total}
        </h2>
        {isAdmin && (
          <Button size="sm" onClick={() => { setEditing(undefined); setShowForm(true); }}>
            <Plus size={14} /> Add Task
          </Button>
        )}
      </div>

      {total === 0 ? (
        <div className="text-center py-16">
          <p className="text-[15px] text-text-secondary">No tasks for this event yet.</p>
        </div>
      ) : (
        <Reveal className="space-y-3" deps={[total]}>
          {tasks?.map(t => (
            <TaskCard
              key={t.id}
              task={t}
              showAssignee
              onEdit={isAdmin ? () => { setEditing(t); setShowForm(true); } : undefined}
            />
          ))}
        </Reveal>
      )}

      {showForm && (
        <TaskForm
          task={editing}
          defaultEventId={id}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditing(undefined); }}
          isLoading={createTask.isPending || updateTask.isPending}
        />
      )}
    </div>
  );
}
