import { type InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import './toggle.css';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className={twMerge('uiverse-toggle-wrapper', className)}>
        <input type="checkbox" className="uiverse-toggle-input" ref={ref} {...props} />
        <span className="uiverse-toggle-slider"></span>
      </label>
    );
  }
);
Toggle.displayName = 'Toggle';
