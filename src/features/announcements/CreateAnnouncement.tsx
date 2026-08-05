import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useThemes } from '../onboarding/api';
import { Loader2, Send } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';

export function CreateAnnouncement() {
  const queryClient = useQueryClient();
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
        is_pinned: isPinned
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setTitle('');
      setContent('');
      setThemeId('all');
      setIsPinned(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate();
  };

  return (
    <Reveal className="mb-12">
      <div className="surface-card p-6 md:p-8 rounded-2xl shadow-[6px_6px_0px_black] border-2 border-black">
        <h2 className="text-2xl font-black uppercase tracking-tight text-text-primary mb-6 flex items-center gap-2">
          Create Announcement
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-bold uppercase tracking-wider text-text-primary">
                Topic
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekly Sync Update"
                className="w-full arc-input bg-surface-50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="theme" className="block text-sm font-bold uppercase tracking-wider text-text-primary">
                Target Theme
              </label>
              <select
                id="theme"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="w-full arc-input bg-surface-50 cursor-pointer"
                disabled={themesLoading}
              >
                <option value="all">Global (All Themes)</option>
                {themes?.map(theme => (
                  <option key={theme.id} value={theme.id.toString()}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-bold uppercase tracking-wider text-text-primary">
              Description
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement details here..."
              className="w-full arc-input bg-surface-50 min-h-[120px] resize-y"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-6 h-6 border-2 border-black rounded transition-colors peer-checked:bg-accent-color"></div>
                <div className="absolute opacity-0 peer-checked:opacity-100 text-black">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
              <span className="font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                Pin to top
              </span>
            </label>

            <button
              type="submit"
              disabled={createMutation.isPending || !title.trim() || !content.trim()}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Announcement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Reveal>
  );
}
