import { type InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = id || label?.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={generatedId}
            className="text-[13px] font-medium text-text-secondary tracking-[0.01em]"
          >
            {label}
          </label>
        )}
        <input
          id={generatedId}
          ref={ref}
          className={twMerge('brutalist-input', error && 'border-red-500', className)}
          {...props}
        />
        {error && <span className="text-[12px] text-danger-color">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
