import { twMerge } from 'tailwind-merge';
import './loader.css';

export function Loader({ className }: { className?: string }) {
  return (
    <div className={twMerge('relative w-full h-32 overflow-hidden flex items-center justify-center', className)}>
      <div className="speeder-loader">
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className="speeder-base">
          <span></span>
          <div className="speeder-face"></div>
        </div>
      </div>
      <div className="longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
