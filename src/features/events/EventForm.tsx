import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/uiverse/Button';
import { Modal, Field } from '../../components/ui/Modal';
import type { TeamEvent, EventStatus } from '../../types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  event?: TeamEvent;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function EventForm({ event, onSubmit, onClose, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title ?? '',
      description: event?.description ?? '',
      status: (event?.status ?? 'upcoming') as EventStatus,
      start_date: event?.start_date ?? '',
      end_date: event?.end_date ?? '',
    },
  });

  return (
    <Modal title={event ? 'Edit Event' : 'New Event'} onClose={onClose}>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Title" error={errors.title?.message} {...register('title')} />

        <Field label="Description">
          <textarea className="field resize-none" rows={3} {...register('description')} />
        </Field>

        <Field label="Status">
          <select className="field" {...register('status')}>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" {...register('start_date')} />
          <Input label="End Date" type="date" {...register('end_date')} />
        </div>

        <div className="flex gap-3 pt-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Saving…' : event ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
