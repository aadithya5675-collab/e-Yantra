import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const signupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and - allowed'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    setNotice(null);

    const { error: signUpError, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          display_name: data.username,
          role: 'member',
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (authData.session) {
      navigate('/');
    } else {
      setNotice('Account created. Check your email to confirm, then sign in.');
    }
  };

  return (
    <AuthLayout
      heading="Create account"
      subheading="Register to join an ARC e-Yantra team."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-accent-color font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <div role="alert" className="flex items-center gap-2 text-[13px] text-danger-color bg-danger-color/12 border border-danger-color/25 rounded-lg px-3 py-2.5">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="flex items-center gap-2 text-[13px] text-success-color bg-success-color/12 border border-success-color/25 rounded-lg px-3 py-2.5">
            <CheckCircle2 size={16} className="shrink-0" />
            {notice}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@kpriet.ac.in"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="e.g. arjun_r"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          hint="Use 6+ characters with a mix of letters and numbers."
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
