import { useAuth } from '../auth/AuthContext';
import { useTasks } from '../tasks/api';
import { useEvents } from '../events/api';
import { useProfiles } from '../profiles/api';
import { Reveal } from '../../components/motion/Reveal';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { TeamEvent } from '../../types';

export function Dashboard() {
  const { profile } = useAuth();
  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: profiles } = useProfiles();

  const upcomingEvents = events?.filter(e => e.status === 'upcoming') ?? [];
  const ongoingEvents = events?.filter(e => e.status === 'ongoing') ?? [];

  const memberStats = profiles?.map(p => {
    const memberTasks = tasks?.filter(t => t.assigned_to === p.id) ?? [];
    return {
      ...p,
      total: memberTasks.length,
      completed: memberTasks.filter(t => t.status === 'completed').length,
      inProgress: memberTasks.filter(t => t.status === 'in_progress').length,
      pending: memberTasks.filter(t => t.status === 'pending').length,
    };
  }) ?? [];

  const stats = [
    { label: 'Upcoming', value: upcomingEvents.length },
    { label: 'Ongoing', value: ongoingEvents.length },
    { label: 'Pending', value: tasks?.filter(t => t.status === 'pending').length ?? 0 },
    { label: 'Completed', value: tasks?.filter(t => t.status === 'completed').length ?? 0 },
  ];

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Hero */}
      <Reveal className="mb-14" y={20}>
        <p className="text-[13px] font-semibold tracking-[0.04em] uppercase text-accent-color mb-3">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <h1 className="text-[40px] md:text-[52px] leading-[1.06] font-semibold tracking-[-0.028em] text-text-primary">
          Hello, <span className="uppercase">{profile?.display_name}</span>.
        </h1>
        <p className="mt-3 text-[19px] text-text-secondary max-w-lg">
          Here's where the team stands today.
        </p>
      </Reveal>

      {/* Stat band */}
      <Reveal
        className="grid grid-cols-2 md:grid-cols-4 gap-px bg-hairline rounded-[18px] overflow-hidden mb-16"
        deps={[stats.map(s => s.value).join()]}
        stagger={0.05}
      >
        {stats.map(s => (
          <div key={s.label} className="bg-page px-5 py-7 text-center">
            <AnimatedNumber
              value={s.value}
              className="block text-[38px] leading-none font-semibold tracking-[-0.03em] text-text-primary"
            />
            <p className="mt-2 text-[13px] text-text-secondary">{s.label}</p>
          </div>
        ))}
      </Reveal>

      {/* Team */}
      <section className="mb-16">
        <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary mb-6">
          The team
        </h2>
        <Reveal
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          deps={[memberStats.length, tasks?.length]}
          onScroll
        >
          {memberStats.map(m => {
            const pct = m.total ? Math.round((m.completed / m.total) * 100) : 0;
            return (
              <div key={m.id} className="surface-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full bg-accent-color flex items-center justify-center text-white text-[14px] font-semibold shrink-0">
                    {m.display_name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-text-primary truncate uppercase">
                      {m.display_name}
                    </p>
                    <p className="text-[12px] text-text-secondary capitalize">{m.role}</p>
                  </div>
                  <span className="ml-auto text-[15px] font-medium text-text-primary tabular-nums">
                    {pct}%
                  </span>
                </div>

                <div className="h-1 rounded-full bg-text-secondary/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-color transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex gap-4 mt-4 text-[12px] text-text-secondary">
                  <span>{m.pending} pending</span>
                  <span>{m.inProgress} active</span>
                  <span>{m.completed} done</span>
                </div>
              </div>
            );
          })}
        </Reveal>
      </section>

      {ongoingEvents.length > 0 && (
        <EventSection title="Happening now" events={ongoingEvents} dateKey="end_date" prefix="Ends" />
      )}
      {upcomingEvents.length > 0 && (
        <EventSection title="Coming up" events={upcomingEvents} dateKey="start_date" prefix="Starts" />
      )}
    </div>
  );
}

function EventSection({
  title,
  events,
  dateKey,
  prefix,
}: {
  title: string;
  events: TeamEvent[];
  dateKey: 'start_date' | 'end_date';
  prefix: string;
}) {
  return (
    <section className="mb-16">
      <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary mb-6">
        {title}
      </h2>
      <Reveal className="space-y-3" deps={[events.length]} onScroll>
        {events.map(e => (
          <Link
            key={e.id}
            to={`/events/${e.id}`}
            className="group surface-card p-6 flex items-start justify-between gap-4 hover:border-accent-color/40 transition-colors duration-200"
          >
            <div className="min-w-0">
              <p className="text-[17px] font-medium text-text-primary">{e.title}</p>
              {e.description && (
                <p className="mt-1 text-[14px] text-text-secondary line-clamp-2">{e.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {e[dateKey] && (
                <span className="text-[13px] text-text-secondary whitespace-nowrap">
                  {prefix} {format(new Date(e[dateKey]!), 'MMM d')}
                </span>
              )}
              <ArrowUpRight
                size={16}
                className="text-text-secondary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
              />
            </div>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
