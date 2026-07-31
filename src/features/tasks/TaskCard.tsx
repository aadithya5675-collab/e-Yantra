import { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useUpdateTask } from './api';
import type { Task, TaskStatus } from '../../types';
import { format } from 'date-fns';
import { ChevronDown, Edit2, Clock } from 'lucide-react';
import { gsap, useGSAP, EASE } from '../../lib/motion';

const statusStyles: Record<TaskStatus, string> = {
  pending: 'bg-warning-color/12 text-warning-color',
  in_progress: 'bg-accent-color/12 text-accent-color',
  completed: 'bg-success-color/12 text-success-color',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const priorityStyles: Record<string, string> = {
  high: 'bg-danger-color',
  medium: 'bg-warning-color',
  low: 'bg-success-color',
};

interface Props {
  task: Task;
  onEdit?: () => void;
  showAssignee?: boolean;
}

export function TaskCard({ task, onEdit, showAssignee = false }: Props) {
  const { isAdmin, profile } = useAuth();
  const updateTask = useUpdateTask();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(task.progress_notes ?? '');
  const scope = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);

  const canUpdate = isAdmin || task.assigned_to === profile?.id;
  const isAssignee = task.assigned_to === profile?.id;
  const hasDetail = Boolean(task.description) || canUpdate || isAssignee;

  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [dueTime, setDueTime] = useState(task.due_time ?? '');

  const saveDueDate = () => {
    if (dueDate !== (task.due_date ?? '') || dueTime !== (task.due_time ?? '')) {
      updateTask.mutate({ id: task.id, due_date: dueDate || null, due_time: dueTime || null });
    }
  };

  // Expand/collapse the detail drawer by measured height, so it never jumps.
  useGSAP(
    () => {
      const panel = scope.current?.querySelector<HTMLElement>('.gs-panel');
      if (!panel) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(panel, { height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(panel, {
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0,
          duration: 0.4,
          ease: EASE.out,
        });
      });

      return () => mm.revert();
    },
    { scope, dependencies: [expanded] }
  );

  const cycleStatus = () => {
    if (!canUpdate) return;
    const order: TaskStatus[] = ['pending', 'in_progress', 'completed'];
    const next = order[(order.indexOf(task.status) + 1) % 3];

    gsap.fromTo(
      chipRef.current,
      { scale: 0.88 },
      { scale: 1, duration: 0.45, ease: 'back.out(2)' }
    );

    updateTask.mutate({ id: task.id, status: next });
  };

  const saveNotes = () => {
    if (notes !== (task.progress_notes ?? '')) {
      updateTask.mutate({ id: task.id, progress_notes: notes });
    }
  };

  return (
    <div ref={scope} className="surface-card p-5">
      <div className="flex items-start gap-3">
        <span
          className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${priorityStyles[task.priority]}`}
          title={`${task.priority} priority`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-[15px] font-medium leading-snug ${
                task.status === 'completed'
                  ? 'text-text-secondary line-through'
                  : 'text-text-primary'
              }`}
            >
              {task.title}
            </p>

            <div className="flex items-center gap-1 shrink-0">
              <button
                ref={chipRef}
                onClick={cycleStatus}
                disabled={!canUpdate}
                className={`chip ${statusStyles[task.status]} ${
                  canUpdate ? 'cursor-pointer hover:brightness-95' : 'cursor-default'
                }`}
              >
                {statusLabels[task.status]}
              </button>

              {isAdmin && onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 text-text-secondary hover:text-accent-color rounded-lg transition-colors"
                  aria-label="Edit task"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[12px] text-text-secondary">
            {showAssignee && task.assigned_profile && (
              <span>{task.assigned_profile.display_name}</span>
            )}
            {task.due_date && (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} />
                {format(new Date(task.due_date), 'MMM d')}
                {task.due_time && ` · ${task.due_time.slice(0, 5)}`}
              </span>
            )}
            {task.event && <span>{task.event.title}</span>}
          </div>

          {hasDetail && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 mt-3 text-[12px] text-accent-color hover:opacity-70 transition-opacity"
              >
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                />
                {expanded ? 'Hide' : 'Details'}
              </button>

              <div className="gs-panel overflow-hidden" style={{ height: 0, opacity: 0 }}>
                <div className="pt-3 space-y-3">
                  {task.description && (
                    <p className="text-[13px] leading-relaxed text-text-secondary">
                      {task.description}
                    </p>
                  )}

                  {canUpdate && (
                    <textarea
                      className="field text-[13px] resize-none"
                      rows={2}
                      placeholder="Progress notes…"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      onBlur={saveNotes}
                    />
                  )}

                  {isAssignee && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium text-text-secondary">Due Date</label>
                        <input
                          type="date"
                          className="field text-[13px]"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          onBlur={saveDueDate}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium text-text-secondary">Due Time</label>
                        <input
                          type="time"
                          className="field text-[13px]"
                          value={dueTime}
                          onChange={e => setDueTime(e.target.value)}
                          onBlur={saveDueDate}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
