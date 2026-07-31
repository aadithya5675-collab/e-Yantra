import { twMerge } from 'tailwind-merge';
import './loader.css';

export function Loader({ className }: { className?: string }) {
  return (
    <div className={twMerge('uiverse-loader', className)}>
      <div className="uiverse-loader-circle"></div>
      <div className="uiverse-loader-circle"></div>
      <div className="uiverse-loader-circle"></div>
    </div>
  );
}
