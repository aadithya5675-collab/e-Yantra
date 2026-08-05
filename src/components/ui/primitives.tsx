import { type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

/* ---- Badge ----------------------------------------------------------- */
type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
const toneClass: Record<Tone, string> = {
  neutral: 'badge',
  accent: 'badge badge-accent',
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  danger: 'badge badge-danger',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={twMerge(toneClass[tone], className)}>{children}</span>;
}

/* ---- Segmented control ---------------------------------------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex p-1 gap-1 rounded-xl bg-muted border border-hairline overflow-x-auto no-scrollbar max-w-full"
    >
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={twMerge(
              'px-3.5 min-h-9 rounded-lg text-[13.5px] font-medium whitespace-nowrap transition-colors',
              active
                ? 'bg-surface text-text-primary shadow-[var(--shadow-1)]'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Progress -------------------------------------------------------- */
export function Progress({ value, label, tone = 'accent' }: { value: number; label?: string; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    tone === 'success' ? 'var(--c-success)' : tone === 'warning' ? 'var(--c-warning)' : 'var(--c-accent)';
  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1.5 text-[12.5px] text-text-secondary">
          <span>{label}</span>
          <span className="tabular text-text-primary">{pct}%</span>
        </div>
      )}
      <div
        className="h-2 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ---- Skeleton -------------------------------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={twMerge('skeleton h-4 w-full', className)} aria-hidden="true" />;
}

/* ---- Empty / Error states ------------------------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card px-6 py-14 flex flex-col items-center text-center gap-3">
      {icon && <div className="text-text-muted" aria-hidden="true">{icon}</div>}
      <h3 className="text-[16px] font-semibold text-text-primary">{title}</h3>
      {description && <p className="text-[14px] text-text-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="surface-card px-6 py-12 flex flex-col items-center text-center gap-3" role="alert">
      <h3 className="text-[16px] font-semibold text-danger-color">{title}</h3>
      {description && <p className="text-[14px] text-text-secondary max-w-sm">{description}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm mt-1">
          Try again
        </button>
      )}
    </div>
  );
}
