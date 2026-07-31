import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from './AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/uiverse/Button';
import { gsap, useGSAP, EASE, DURATION } from '../../lib/motion';

const schema = z.object({
  password: z.string().min(6, 'At least 6 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type FormData = z.infer<typeof schema>;

export function ChangePassword() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const scope = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.gs-reveal',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out, stagger: 0.07, clearProps: 'transform' }
        );
      });
      return () => mm.revert();
    },
    { scope }
  );

  const onSubmit = async (data: FormData) => {
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password: data.password });
    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (profile) {
      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', profile.id);
    }

    await refreshProfile();
    navigate('/');
  };

  return (
    <div ref={scope} className="min-h-screen bg-page flex flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="text-center mb-12">
          <h1 className="gs-reveal text-[32px] leading-[1.1] font-semibold tracking-[-0.025em] text-text-primary">
            Choose a password
          </h1>
          <p className="gs-reveal mt-3 text-[15px] text-text-secondary">
            You're signing in for the first time. Pick something only you know.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="gs-reveal text-center text-[13px] text-danger-color">{error}</div>
          )}

          <div className="gs-reveal">
            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="gs-reveal">
            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm')}
            />
          </div>

          <div className="gs-reveal pt-2">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
