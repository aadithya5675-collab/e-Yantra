import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useThemes } from '../onboarding/api';
import { Send, Plus } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export function CreateAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: themes, isLoading: themesLoading } = useThemes();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [themeId, setThemeId] = useState<string>('all');
  const [isPinned, setIsPinned] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const { error } = await supabase.from('announcements').insert([{
        title: title.trim(),
        content: content.trim(),
        theme_id: themeId === 'all' ? null : parseInt(themeId, 10),
        created_by: userData.user.id,
        is_pinned: isPinned,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setTitle('');
      setContent('');
      setThemeId('all');
      setIsPinned(false);
      toast('Announcement posted', 'success');
    },
    onError: () => toast('Could not post announcement', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate();
  };

  return (
    <Reveal>
      <section className="surface-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-text-muted mb-5">
          <Plus size={16} /> New announcement
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="an-title" className="field-label">Topic</label>
              <input id="an-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly sync update" className="arc-input" required />
            </div>
            <div className="field">
              <label htmlFor="an-theme" className="field-label">Target theme</label>
              <select id="an-theme" value={themeId} onChange={e => setThemeId(e.target.value)} className="arc-input" disabled={themesLoading}>
                <option value="all">Global (all themes)</option>
                {themes?.map(theme => (
                  <option key={theme.id} value={theme.id.toString()}>{theme.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="an-content" className="field-label">Description</label>
            <textarea id="an-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Write the announcement details…" className="arc-input min-h-[120px] resize-y" required />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--c-accent)]"
              />
              <span className="text-[14px] text-text-secondary">Pin to top</span>
            </label>

            <Button type="submit" loading={createMutation.isPending} disabled={!title.trim() || !content.trim()} className="w-full sm:w-auto">
              <Send size={16} /> Post announcement
            </Button>
          </div>
        </form>
      </section>
    </Reveal>
  );
}
