import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import './Auth.css';

const signupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _, and - allowed'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function Signup() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    setSuccess(false);

    const { error: signUpError } = await supabase.auth.signUp({
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
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <form className="brutalist-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="brutalist-title">
          Sign Up<br />
          <span>create your team workspace account</span>
        </div>

        {error && (
          <div className="text-red-600 font-bold text-sm bg-red-100 p-2 rounded border-2 border-black w-full">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-700 font-bold text-sm bg-green-100 p-2 rounded border-2 border-black w-full">
            Account created! Please check your email for the verification link before logging in.
          </div>
        )}

        <input 
          className="brutalist-input" 
          placeholder="Enter your email" 
          type="email" 
          {...register('email')}
        />
        {errors.email && <span className="text-red-600 font-bold text-xs">{errors.email.message}</span>}

        <input 
          className="brutalist-input" 
          placeholder="Choose a username" 
          type="text" 
          {...register('username')}
        />
        {errors.username && <span className="text-red-600 font-bold text-xs">{errors.username.message}</span>}

        <input 
          className="brutalist-input" 
          placeholder="Create a password" 
          type="password" 
          {...register('password')}
        />
        {errors.password && <span className="text-red-600 font-bold text-xs">{errors.password.message}</span>}

        <button className="brutalist-button-confirm" type="submit" disabled={isSubmitting || success}>
          {isSubmitting ? 'Creating...' : 'Register →'}
        </button>

        <Link to="/login" className="brutalist-link">
          Already have an account? Log in
        </Link>
      </form>
    </div>
  );
}
