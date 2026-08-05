import { Moon, Sun } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../../lib/theme';

/**
 * Accessible theme toggle — visible icon, tooltip and descriptive aria-label.
 * The single control used in both the app shell header and Settings.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={twMerge('icon-btn', className)}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
