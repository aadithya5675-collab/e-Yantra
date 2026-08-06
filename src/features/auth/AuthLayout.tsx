import type { ReactNode } from 'react';

/**
 * Editorial command-access layout. The left panel is a quiet typographic
 * masthead with fine technical rules and a registration mark (aria-hidden) —
 * no orbital / glow decoration. On mobile it collapses to a single column.
 */
export function AuthLayout({
  heading,
  subheading,
  children,
  footer,
}: {
  heading: string;
  subheading: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand / masthead panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden px-14 py-12 bg-sidebar border-r border-hairline">
        <div className="absolute inset-x-14 top-0 h-px bg-[var(--c-border)]" aria-hidden="true" />
        <RegistrationMark />
        <div className="relative flex items-center gap-3">
          <Monogram />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-text-primary">e-Yantra</p>
            <p className="eyebrow mt-0.5">Aviation &amp; Robotics Club</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-display text-[40px] text-text-primary">
            Operations control for all seven e-Yantra teams.
          </h2>
          <p className="mt-4 text-[15px] text-text-secondary leading-relaxed max-w-sm">
            Tasks, evidence, reviews, scores and announcements — coordinated from one command centre.
          </p>
          <p className="mt-8 pt-6 border-t border-hairline text-[12px] text-text-muted max-w-sm">
            Internal club platform · not the official IIT Bombay / e-Yantra portal.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <Monogram />
            <span className="text-[15px] font-semibold">e-Yantra</span>
          </div>

          <h1 className="font-display text-[34px] text-text-primary">{heading}</h1>
          <p className="mt-1 text-[14.5px] text-text-secondary">{subheading}</p>

          <div className="mt-8">{children}</div>
          <div className="mt-6 text-[13.5px] text-text-secondary text-center">{footer}</div>
        </div>
      </main>
    </div>
  );
}

/** Flat cobalt-ruled monogram — no gradient, no glow. */
function Monogram() {
  return (
    <span
      className="grid place-items-center w-10 h-10 shrink-0 rounded-[4px] font-mono font-medium text-[12px] tracking-tight border"
      style={{ borderColor: 'var(--c-accent)', color: 'var(--c-accent)' }}
      aria-hidden="true"
    >
      ARC
    </span>
  );
}

/** Fine technical registration mark — restrained editorial decoration. */
function RegistrationMark() {
  return (
    <svg
      className="absolute right-10 bottom-12 w-40 h-40 opacity-[0.5]"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <path d="M60 8 V32 M60 88 V112 M8 60 H32 M88 60 H112" stroke="var(--c-border-strong)" strokeWidth="1" />
      <circle cx="60" cy="60" r="34" stroke="var(--c-border-strong)" strokeWidth="1" />
      <circle cx="60" cy="60" r="20" stroke="var(--c-border)" strokeWidth="1" strokeDasharray="3 4" />
      <path d="M60 40 V80 M40 60 H80" stroke="var(--c-border)" strokeWidth="1" />
    </svg>
  );
}
