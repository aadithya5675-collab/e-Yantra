import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client';
import { Button } from './ui/Button';
import type { Task } from '../types';
import { BellRing } from 'lucide-react';
import { gsap, useGSAP, EASE } from '../lib/motion';

interface AlarmModalProps {
  task: Task;
  onDismiss: () => void;
}

export function AlarmModal({ task, onDismiss }: AlarmModalProps) {
  const [isTurnedOff, setIsTurnedOff] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(['.gs-scrim', '.gs-panel'], { opacity: 1, y: 0, scale: 1 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline()
          .fromTo('.gs-scrim', { opacity: 0 }, { opacity: 1, duration: 0.25 })
          .fromTo(
            '.gs-panel',
            { opacity: 0, y: 20, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: EASE.out },
            '-=0.12'
          );

        // Slow halo behind the bell — signals urgency without shouting.
        gsap.to('.gs-halo', {
          scale: 1.35,
          opacity: 0,
          duration: 1.6,
          ease: 'power2.out',
          repeat: -1,
        });
      });

      return () => mm.revert();
    },
    { scope }
  );

  useEffect(() => {
    const playBeep = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    };

    if (!isTurnedOff) {
      playBeep();
      intervalRef.current = window.setInterval(playBeep, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [isTurnedOff]);

  const handleTurnOff = () => {
    setIsTurnedOff(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    gsap.killTweensOf('.gs-halo');
    gsap.to('.gs-halo', { opacity: 0, duration: 0.3 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('tasks')
      .update({ delay_reason: reason, alarm_acknowledged: true })
      .eq('id', task.id);

    setIsSubmitting(false);
    if (!error) {
      onDismiss();
    } else {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div ref={scope} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="gs-scrim absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alarm-title"
        className="gs-panel relative w-full max-w-[400px] arc-elevated p-8 text-center"
      >
        <div className="relative w-14 h-14 mx-auto mb-5">
          <span className="gs-halo absolute inset-0 rounded-full bg-danger-color/25" />
          <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-danger-color/12">
            <BellRing className="text-danger-color" size={24} />
          </span>
        </div>

        <h2 id="alarm-title" className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
          Task overdue
        </h2>
        <p className="mt-2 mb-7 text-[15px] leading-relaxed text-text-secondary">
          “{task.title}” was due {task.due_date}
          {task.due_time && ` at ${task.due_time.slice(0, 5)}`}.
        </p>

        {!isTurnedOff ? (
          <Button variant="danger" size="lg" className="w-full" onClick={handleTurnOff}>
            Turn Off Alarm
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="text-left">
            <label htmlFor="alarm-reason" className="block text-[13px] font-medium text-text-secondary mb-2">
              What held this up?
            </label>
            <textarea
              id="alarm-reason"
              autoFocus
              required
              className="arc-input text-[14px] resize-none mb-4"
              rows={3}
              placeholder="A short explanation…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={!reason.trim() || isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit & Acknowledge'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
