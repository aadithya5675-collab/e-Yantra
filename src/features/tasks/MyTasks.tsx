import { useAuth } from '../auth/AuthContext';
import { useTasks } from './api';
import { TaskCard } from './TaskCard';
import { Reveal } from '../../components/motion/Reveal';
import type { Task } from '../../types';

export function MyTasks() {
  const { themeId } = useAuth();
  const { data: tasks, isLoading } = useTasks({ theme_id: themeId || undefined });

  const inProgress = tasks?.filter(t => t.status === 'in_progress') ?? [];
  const pending = tasks?.filter(t => t.status === 'pending') ?? [];
  const completed = tasks?.filter(t => t.status === 'completed') ?? [];

  const open = inProgress.length + pending.length;

  return (
    <div className="max-w-[760px] mx-auto">
      <Reveal className="mb-12" y={20}>
        <h1 className="text-[40px] leading-[1.08] font-semibold tracking-[-0.028em] text-text-primary">
          My Tasks
        </h1>
        <p className="mt-2 text-[17px] text-text-secondary">
          {isLoading
            ? 'Loading…'
            : open === 0
              ? 'Nothing open. Nicely done.'
              : `${open} task${open === 1 ? '' : 's'} still open.`}
        </p>
      </Reveal>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="surface-card h-24 animate-pulse" />)}
        </div>
      ) : tasks?.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-[17px] text-text-secondary">No tasks assigned to you yet.</p>
        </div>
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
