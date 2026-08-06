import { ClipboardList } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTasks } from './api';
import { TaskCard } from './TaskCard';
import { Reveal } from '../../components/motion/Reveal';
import { EmptyState, Skeleton } from '../../components/ui/primitives';
import type { Task } from '../../types';

export function MyTasks() {
  const { themeId } = useAuth();
  const { data: tasks, isLoading } = useTasks({ theme_id: themeId || undefined });

  const inProgress = tasks?.filter(t => t.status === 'in_progress') ?? [];
  const completed = tasks?.filter(t => t.status === 'completed') ?? [];
  const pending = tasks?.filter(t => t.status !== 'in_progress' && t.status !== 'completed') ?? [];

  const open = inProgress.length + pending.length;

  return (
    <div>
      <Reveal className="mb-6" y={16}>
        <h1 className="font-display text-[30px] tracking-tight text-text-primary">My tasks</h1>
        <p className="mt-1 text-[14.5px] text-text-secondary">
          {isLoading
            ? 'Loading…'
            : open === 0
              ? 'Nothing open — nicely done.'
              : `${open} task${open === 1 ? '' : 's'} still open.`}
        </p>
      </Reveal>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : tasks?.length === 0 ? (
        <EmptyState icon={<ClipboardList size={30} />} title="No tasks yet" description="Tasks assigned to you will appear here." />
      ) : (
        <>
          <Section title="In progress" tasks={inProgress} />
          <Section title="Pending" tasks={pending} />
          <Section title="Completed" tasks={completed} />
        </>
      )}
    </div>
  );
}

function Section({ title, tasks }: { title: string; tasks: Task[] }) {
  if (!tasks.length) return null;
  return (
    <section className="mb-12">
      <h2 className="text-[13px] font-semibold tracking-[0.04em] uppercase text-text-secondary mb-4">
        {title} · {tasks.length}
      </h2>
      <Reveal className="space-y-3" deps={[tasks.length]} onScroll>
        {tasks.map(t => <TaskCard key={t.id} task={t} />)}
      </Reveal>
    </section>
  );
}
