import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { GhostLoader } from '../../components/uiverse/GhostLoader';
import './Auth.css';

const loginSchema = z.object({
  email: z.string().email('Enter your email address'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (signInError) {
      setError('Invalid email or password');
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        navigate('/');
      }, 1500); // Wait 1.5s to show the ghost animation before navigating
    }
  };

  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <GhostLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <form className="brutalist-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="brutalist-title">
          Sign In<br />
          <span>access your team workspace</span>
        </div>

        {error && (
          <div className="text-red-600 font-bold text-sm bg-red-100 p-2 rounded border-2 border-black w-full text-center">
            {error}
          </div>
        )}

        <input 
          className="brutalist-input" 
          placeholder="Enter your email" 
          {...register('email')} 
          disabled={isSubmitting}
        />
        {errors.email && <p className="text-red-500 text-xs font-bold -mt-3 text-left">{errors.email.message}</p>}

        <input 
          className="brutalist-input" 
          placeholder="Enter your password" 
          type="password" 
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && <span className="text-red-600 font-bold text-xs">{errors.password.message}</span>}

        <button className="brutalist-button-confirm" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In →'}
        </button>

        <Link to="/signup" className="brutalist-link">
          Don't have an account? Sign up
        </Link>
      </form>
    </div>
  );
}
