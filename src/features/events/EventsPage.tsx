import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from './api';
import { useTasks } from '../tasks/api';
import { EventForm } from './EventForm';
import { Button } from '../../components/uiverse/Button';
import { Reveal } from '../../components/motion/Reveal';
import { Plus, Edit2, Trash2, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import type { TeamEvent } from '../../types';
import { Link } from 'react-router-dom';

export function EventsPage() {
  const { isAdmin, profile } = useAuth();
  const { data: events, isLoading } = useEvents();
  const { data: tasks } = useTasks();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TeamEvent | undefined>();

  const ongoing = events?.filter(e => e.status === 'ongoing') ?? [];
  const upcoming = events?.filter(e => e.status === 'upcoming') ?? [];
  const completed = events?.filter(e => e.status === 'completed') ?? [];

  const taskCountFor = (id: string) => tasks?.filter(t => t.event_id === id).length ?? 0;

  const handleSubmit = async (data: any) => {
    const payload = {
      ...data,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
    };
    if (editing) {
      await updateEvent.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createEvent.mutateAsync({ ...payload, created_by: profile?.id });
    }
    setShowForm(false);
    setEditing(undefined);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this event and all of its tasks?')) {
      await deleteEvent.mutateAsync(id);
    }
  };

  const section = (title: string, list: TeamEvent[]) => {
    if (!list.length) return null;
    return (
      <section className="mb-14" key={title}>
        <h2 className="text-[13px] font-semibold tracking-[0.04em] uppercase text-text-secondary mb-4">
          {title}
        </h2>
        <Reveal className="space-y-3" deps={[list.length]} onScroll>
          {list.map(e => (
            <div key={e.id} className="group relative">
              <Link
                to={`/events/${e.id}`}
                className="surface-card block p-6 hover:border-accent-color/40 transition-colors duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-medium text-text-primary">{e.title}</p>
                    {e.description && (
                      <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary line-clamp-2">
                        {e.description}
                      </p>
                    )}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-3 text-[12px] text-text-secondary">
                      {e.start_date && <span>{format(new Date(e.start_date), 'MMM d, yyyy')}</span>}
                      {e.end_date && <span>→ {format(new Date(e.end_date), 'MMM d, yyyy')}</span>}
                      <span>{taskCountFor(e.id)} tasks</span>
                    </div>
                  </div>

                  {!isAdmin && (
                    <ArrowUpRight
                      size={16}
                      className="text-text-secondary shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                    />
                  )}
                </div>
              </Link>

              {isAdmin && (
                <div className="absolute top-5 right-5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => { setEditing(e); setShowForm(true); }}
                    className="p-1.5 rounded-lg bg-page/80 backdrop-blur text-text-secondary hover:text-accent-color transition-colors"
                    aria-label="Edit event"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="p-1.5 rounded-lg bg-page/80 backdrop-blur text-text-secondary hover:text-danger-color transition-colors"
                    aria-label="Delete event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </Reveal>
      </section>
    );
  };

  return (
    <div className="max-w-[760px] mx-auto">
      <Reveal className="mb-12" y={20}>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[40px] leading-[1.08] font-semibold tracking-[-0.028em] text-text-primary">
              Events
            </h1>
            <p className="mt-2 text-[17px] text-text-secondary">
              Every competition the team is running.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setEditing(undefined); setShowForm(true); }}>
              <Plus size={15} /> New Event
            </Button>
          )}
        </div>
      </Reveal>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="surface-card h-28 animate-pulse" />
          ))}
        </div>
      ) : events?.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-[17px] text-text-secondary">No events yet.</p>
          {isAdmin && (
            <p className="mt-1 text-[14px] text-text-secondary">Create one to get started.</p>
          )}
        </div>
      ) : (
        <>
          {section('Happening now', ongoing)}
          {section('Coming up', upcoming)}
          {section('Completed', completed)}
        </>
      )}

      {showForm && (
        <EventForm
          event={editing}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditing(undefined); }}
          isLoading={createEvent.isPending || updateEvent.isPending}
        />
      )}
    </div>
  );
}
