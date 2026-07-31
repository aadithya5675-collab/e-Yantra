import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/uiverse/Button';
import { gsap, useGSAP, EASE, DURATION } from '../../lib/motion';

const loginSchema = z.object({
  username: z.string().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const scope = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.gs-reveal', { opacity: 1, y: 0 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline()
          .fromTo('.gs-mark', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.out })
          .fromTo('.gs-reveal', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out, stagger: 0.07, clearProps: 'transform' }, '-=0.55');
      });

      return () => mm.revert();
    },
    { scope }
  );

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    const email = `${data.username.toLowerCase().trim()}@uvira-apex.team`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    });

    if (signInError) {
      setError('Invalid username or password');
      // A short, contained shake — enough to register, not enough to feel playful.
      gsap.fromTo(
        '.gs-card',
        { x: -6 },
        { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' }
      );
    } else {
      navigate('/');
    }
  };

  return (
    <div ref={scope} className="min-h-screen bg-page flex flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="text-center mb-12">
          <h1 className="gs-mark text-[40px] leading-[1.08] font-semibold tracking-[-0.025em] text-text-primary">
            Uvira-Apex
          </h1>
          <p className="gs-reveal mt-3 text-[17px] text-text-secondary">
            Sign in to your team workspace.
          </p>
        </div>

        <div className="gs-card">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="gs-reveal text-center text-[13px] text-danger-color">
                {error}
              </div>
            )}

            <div className="gs-reveal">
              <Input
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="username"
                error={errors.username?.message}
                {...register('username')}
              />
            </div>

            <div className="gs-reveal">
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="gs-reveal pt-2">
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
