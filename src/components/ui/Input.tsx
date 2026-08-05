import { type InputHTMLAttributes, forwardRef, useId, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Labelled input with persistent label, helper/error text wired via
 * aria-describedby, and a show/hide affordance for password fields.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type = 'text', ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const [reveal, setReveal] = useState(false);

    const isPassword = type === 'password';
    const resolvedType = isPassword && reveal ? 'text' : type;

    return (
      <div className="field w-full">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={resolvedType}
            aria-invalid={error ? true : undefined}
            aria-describedby={twMerge(errorId, hintId) || undefined}
            className={twMerge('arc-input', isPassword && 'pr-11', className)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setReveal(v => !v)}
              aria-label={reveal ? 'Hide password' : 'Show password'}
              aria-pressed={reveal}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 icon-btn !w-9 !h-9"
            >
              {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error ? (
          <span id={errorId} role="alert" className="text-[12.5px] text-danger-color">
            {error}
          </span>
        ) : hint ? (
          <span id={hintId} className="text-[12.5px] text-text-muted">
            {hint}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
