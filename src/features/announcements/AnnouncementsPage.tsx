import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pin, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../lib/api/client';
import { gsap, useGSAP, DURATION, EASE } from '../../lib/motion';

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

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get<{ data: Announcement[] }>('/announcements'),
  });

  const ackMutation = useMutation({
    mutationFn: (id: number) => api.post(`/announcements/${id}/acknowledge`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
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
    <div ref={containerRef} className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5">
          <Megaphone className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Club Announcements
          </h1>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          Official communications, guidelines, and competition deadlines from ARC lead engineers
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-text-secondary text-sm">Loading announcements...</div>
      ) : list.length === 0 ? (
        <div className="p-12 text-center border border-hairline rounded-xl bg-surface-muted/30">
          <Clock className="w-10 h-10 text-text-secondary mx-auto mb-2 opacity-50" />
          <p className="text-sm text-text-secondary">No active announcements at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item) => {
            const isAcked = item.acknowledgements && item.acknowledgements.length > 0;
            return (
              <div
                key={item.id}
                className={`gs-announcement-card p-6 rounded-2xl border transition-all ${
                  item.is_pinned
                    ? 'bg-cyan-500/5 border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                    : 'bg-surface-muted/40 border-hairline'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {item.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                    </div>
                    <p className="text-xs text-text-secondary">
                      By {item.creator?.full_name || 'ARC Lead'} • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-text-primary/90 whitespace-pre-line leading-relaxed">
                  {item.content}
                </div>

                {item.requires_acknowledgement && (
                  <div className="mt-5 pt-4 border-t border-hairline flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      Acknowledgement required by all team members
                    </span>
                    {isAcked ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => ackMutation.mutate(item.id)}
                        disabled={ackMutation.isPending}
                        className="px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-400/40 transition-all disabled:opacity-50"
                      >
                        Confirm Read & Acknowledge
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
