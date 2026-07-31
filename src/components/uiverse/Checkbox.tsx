import { type InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import './checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className={twMerge('uiverse-checkbox-wrapper', className)}>
        <input type="checkbox" className="uiverse-checkbox-input" ref={ref} {...props} />
        <span className="uiverse-checkbox-checkmark"></span>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
