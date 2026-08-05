import type { ReactNode } from 'react';

/**
 * Command-access split layout. The left "viewport" panel is a pure CSS/SVG
 * orbital + telemetry-grid motif (no Three.js — faster, lighter). On mobile it
 * collapses to a single readable column.
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
    <div className="min-h-screen bg-canvas grid lg:grid-cols-2">
      {/* Brand / viewport panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 border-r border-hairline">
        <div className="absolute inset-0 arc-grid" aria-hidden="true" />
        <OrbitMotif />
        <div className="relative flex items-center gap-3">
          <span
            className="grid place-items-center w-10 h-10 rounded-lg font-bold text-[14px] tracking-tight"
            style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-accent-2))', color: 'var(--c-accent-contrast)' }}
          >
            ARC
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-text-primary">ARC Mission Control</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">Aviation &amp; Robotics Club</p>
          </div>
        </div>
        <div className="relative max-w-sm">
          <h2 className="text-[26px] font-semibold tracking-tight text-text-primary leading-tight">
            Operations control for all seven e-Yantra teams.
          </h2>
          <p className="mt-3 text-[14.5px] text-text-secondary leading-relaxed">
            Tasks, evidence, reviews, scores and announcements — coordinated from one command centre.
          </p>
          <p className="mt-8 text-[11.5px] text-text-muted">
            Internal club platform · not the official IIT Bombay / e-Yantra portal.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span
              className="grid place-items-center w-9 h-9 rounded-lg font-bold text-[13px]"
              style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-accent-2))', color: 'var(--c-accent-contrast)' }}
            >
              ARC
            </span>
            <span className="text-[15px] font-semibold">ARC Mission Control</span>
          </div>

          <h1 className="text-[26px] font-semibold tracking-tight text-text-primary">{heading}</h1>
          <p className="mt-1.5 text-[14.5px] text-text-secondary">{subheading}</p>

          <div className="mt-8">{children}</div>
          <div className="mt-6 text-[13.5px] text-text-secondary text-center">{footer}</div>
        </div>
      </main>
    </div>
  );
}

function OrbitMotif() {
  return (
    <svg
      className="absolute -right-24 top-1/2 -translate-y-1/2 w-[520px] h-[520px] opacity-70"
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="arc-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[70, 120, 170].map((r, i) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          stroke="var(--c-border-strong)"
          strokeWidth="1"
          strokeDasharray={i === 1 ? '4 6' : undefined}
          opacity={0.6 - i * 0.12}
        />
      ))}
      <circle cx="200" cy="200" r="46" fill="url(#arc-core)" />
      <circle cx="200" cy="200" r="6" fill="var(--c-accent)" />
      {[
        [200, 30], [270, 200], [130, 200], [200, 370], [258, 120], [142, 280],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="var(--c-accent-2)" opacity="0.85" />
      ))}
    </svg>
  );
}
