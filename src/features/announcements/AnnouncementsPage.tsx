import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pin, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { gsap, useGSAP, DURATION, EASE } from '../../lib/motion';
import { useAuth } from '../auth/AuthContext';
import { CreateAnnouncement } from './CreateAnnouncement';
import { Button } from '../../components/ui/Button';
import { Badge, EmptyState, Skeleton } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toast';

interface Announcement {
  id: number;
  title: string;
  content: string;
  target_role: string | null;
  is_pinned: boolean;
  requires_acknowledgement: boolean;
  created_at: string;
  creator: { full_name: string } | null;
  acknowledgements: Array<{ profile_id: number }>;
}

export function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const { themeId, isAdmin } = useAuth();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', themeId],
    queryFn: async () => {
      let query = supabase.from('announcements').select('*');
      if (!isAdmin && themeId) {
        query = query.or(`theme_id.eq.${themeId},theme_id.is.null`);
      }
      const { data, error } = await query;
      if (error && error.code !== '42P01' && error.code !== '42703') throw error;
      return { data: (data || []) as Announcement[] };
    },
  });

  const ackMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { error } = await supabase
        .from('announcement_acknowledgements')
        .insert([{ announcement_id: id, profile_id: userData.user.id }]);
      if (error && error.code !== '42P01') throw error;
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast('Acknowledged', 'success');
    },
    onError: () => toast('Could not acknowledge', 'error'),
  });

  useGSAP(
    () => {
      if (isLoading || !containerRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.gs-announcement-card',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out, stagger: 0.05, clearProps: 'all' }
        );
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [data] }
  );

  const list = data?.data || [];

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Megaphone size={22} className="text-accent-color" />
          <h1 className="text-[24px] font-semibold tracking-tight text-text-primary">Announcements</h1>
        </div>
        <p className="text-[14px] text-text-secondary mt-1">
          Official communications, guidelines and deadlines from ARC leads.
        </p>
      </div>

      {isAdmin && <CreateAnnouncement />}

      {isAdmin && list.length > 0 && (
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted pt-2">Posted</h2>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<Megaphone size={30} />} title="No announcements" description="New announcements will appear here." />
      ) : (
        <div className="space-y-3">
          {list.map(item => {
            const isAcked = item.acknowledgements && item.acknowledgements.length > 0;
            return (
              <article
                key={item.id}
                className={`gs-announcement-card surface-card p-5 ${item.is_pinned ? 'border-accent-color/40' : ''}`}
                style={item.is_pinned ? { background: 'color-mix(in oklab, var(--c-accent) 6%, var(--c-surface))' } : undefined}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.is_pinned && <Badge tone="accent"><Pin size={12} /> Pinned</Badge>}
                      <h3 className="text-[16px] font-semibold text-text-primary">{item.title}</h3>
                    </div>
                    <p className="text-[12.5px] text-text-muted mt-1">
                      By {item.creator?.full_name || 'ARC Lead'} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-[14px] text-text-secondary whitespace-pre-line leading-relaxed">
                  {item.content}
                </div>

                {item.requires_acknowledgement && (
                  <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[12.5px] text-text-muted">Acknowledgement required from all members</span>
                    {isAcked ? (
                      <Badge tone="success"><CheckCircle size={13} /> Acknowledged</Badge>
                    ) : (
                      <Button size="sm" variant="secondary" loading={ackMutation.isPending} onClick={() => ackMutation.mutate(item.id)}>
                        <CheckCircle size={15} /> Acknowledge
                      </Button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
