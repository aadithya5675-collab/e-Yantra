import { useRef, type KeyboardEvent } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import type { Theme } from '../../types/arc';

interface ThemeSelectProps {
  themes: Theme[];
  /** The single selected theme id, or null. This is a scalar — never an array. */
  value: number | null;
  onChange: (themeId: number) => void;
}

/**
 * Accessible single-select radio-card group. Exactly one theme can be chosen.
 * Implemented as an ARIA radiogroup with roving tabindex and arrow-key
 * navigation, so the visual "3D-ish" cards remain a real, keyboard-usable
 * single-select input. Emits one scalar theme_id.
 */
export function ThemeSelect({ themes, value, onChange }: ThemeSelectProps) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusIndex = (i: number) => {
    const len = themes.length;
    const next = ((i % len) + len) % len;
    cardRefs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        focusIndex(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        focusIndex(index - 1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        onChange(themes[index].id);
        break;
    }
  };

  // Roving tabindex: the selected card (or the first) is the single tab stop.
  const activeIndex = Math.max(0, themes.findIndex((t) => t.id === value));

  return (
    <div
      role="radiogroup"
      aria-label="Select exactly one e-Yantra challenge theme"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {themes.map((theme, index) => {
        const selected = theme.id === value;
        const accent = theme.accent_color ?? 'var(--accent-color)';
        return (
          <button
            key={theme.id}
            ref={(el) => { cardRefs.current[index] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => onChange(theme.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className="arc-panel group relative text-left p-4 transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none"
            style={selected ? { boxShadow: `0 0 0 1px ${accent}, 0 0 26px -8px ${accent}` } : undefined}
          >
            <span
              aria-hidden
              className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
              style={{ background: accent, opacity: selected ? 1 : 0.35 }}
            />
            <div className="flex items-start justify-between gap-2 pl-3">
              <div>
                <h3 className="text-base font-semibold text-primary-text">{theme.name}</h3>
                {theme.tagline && (
                  <p className="text-xs font-medium" style={{ color: accent }}>{theme.tagline}</p>
                )}
              </div>
              <span
                aria-hidden
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
                style={{
                  borderColor: selected ? accent : 'var(--hairline)',
                  background: selected ? accent : 'transparent',
                }}
              >
                {selected && <Check size={14} strokeWidth={3} color="#04121a" />}
              </span>
            </div>
            {theme.summary && (
              <p className="mt-2 pl-3 text-sm leading-relaxed text-secondary-text line-clamp-4">
                {theme.summary}
              </p>
            )}
            {theme.official_url && (
              <span className="mt-3 ml-3 inline-flex items-center gap-1 text-xs text-muted-text">
                <ExternalLink size={12} /> e-Yantra portal
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
