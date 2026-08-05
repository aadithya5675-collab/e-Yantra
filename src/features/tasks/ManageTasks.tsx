import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from './api';
import { useProfiles } from '../profiles/api';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { Button } from '../../components/uiverse/Button';
import { Reveal } from '../../components/motion/Reveal';
import { Plus, Trash2 } from 'lucide-react';
import type { Task } from '../../types';

export function ManageTasks() {
  const { profile } = useAuth();
  const { data: tasks, isLoading } = useTasks();
  const { data: profiles } = useProfiles();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [filterMember, setFilterMember] = useState('');

  const filtered = filterMember
    ? tasks?.filter(t => t.assigned_to === filterMember)
    : tasks;

  const handleSubmit = async (data: any) => {
    const payload = { 
      ...data, 
      theme_id: data.theme_id || null,
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

  const handleDelete = async (id: string) => {
    if (confirm('Delete this task?')) await deleteTask.mutateAsync(id);
  };

  return (
    <div className="max-w-[760px] mx-auto">
      <Reveal className="mb-10" y={20}>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[40px] leading-[1.08] font-semibold tracking-[-0.028em] text-text-primary">
              Manage Tasks
            </h1>
            <p className="mt-2 text-[17px] text-text-secondary">
              Assign and track work across the team.
            </p>
          </div>
          <Button onClick={() => { setEditing(undefined); setShowForm(true); }}>
            <Plus size={15} /> New Task
          </Button>
        </div>
      </Reveal>

      {/* Segmented member filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <FilterPill active={!filterMember} onClick={() => setFilterMember('')}>
          Everyone
        </FilterPill>
        {profiles?.map(p => (
          <FilterPill
            key={p.id}
            active={filterMember === p.id}
            onClick={() => setFilterMember(p.id)}
          >
            {p.display_name}
          </FilterPill>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="surface-card h-24 animate-pulse" />)}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-[17px] text-text-secondary">No tasks here yet.</p>
        </div>
      ) : (
        <Reveal className="space-y-3" deps={[filterMember, filtered?.length]}>
          {filtered?.map(t => (
            <div key={t.id} className="group relative">
              <TaskCard
                task={t}
                showAssignee
                onEdit={() => { setEditing(t); setShowForm(true); }}
              />
              <button
                onClick={() => handleDelete(t.id)}
                className="absolute bottom-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-danger-color opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                aria-label="Delete task"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </Reveal>
      )}

      {showForm && (
        <TaskForm
          task={editing}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditing(undefined); }}
          isLoading={createTask.isPending || updateTask.isPending}
        />
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-colors duration-200 ${
        active
          ? 'bg-accent text-white border-accent'
          : 'bg-transparent text-text-secondary border-hairline hover:text-text-primary hover:border-text-secondary/40'
      }`}
    >
      {children}
    </button>
  );
}
