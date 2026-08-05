import { twMerge } from 'tailwind-merge';

/**
 * ARC telemetry spinner — a calm dual orbital ring. Replaces the old ghost /
 * speeder loaders. Pure CSS transform animation (GPU-friendly), reduced-motion
 * safe via the global media query.
 */
export function Spinner({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={twMerge('inline-block relative', className)}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
        style={{
          borderTopColor: 'var(--c-accent)',
          borderRightColor: 'color-mix(in oklab, var(--c-accent) 40%, transparent)',
        }}
      />
      <span
        className="absolute rounded-full border-2 border-transparent"
        style={{
          inset: size * 0.22,
          borderBottomColor: 'var(--c-accent-2)',
          animation: 'spin 1.1s linear infinite reverse',
        }}
      />
    </span>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4">
      <Spinner size={36} />
      {label && <p className="text-sm text-text-secondary">{label}</p>}
    </div>
  );
}
