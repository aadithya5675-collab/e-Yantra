import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Bottom-sheet presentation on mobile. */
  sheetOnMobile?: boolean;
  /** Set false for flows that must not be dismissed by backdrop/Escape. */
  dismissible?: boolean;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: role="dialog" + aria-modal, focus trap, focus restore,
 * Escape-to-close, scrim click, body scroll lock. Optional mobile sheet.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  sheetOnMobile = false,
  dismissible = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
      if (e.key === 'Tab' && panel) {
        const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          n => n.offsetParent !== null
        );
        if (nodes.length === 0) return;
        const firstEl = nodes[0];
        const lastEl = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  const titleId = 'modal-title';
  const descId = description ? 'modal-desc' : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="absolute inset-0 animate-[arc-fade-in_0.2s_ease]"
        style={{ background: 'var(--c-scrim)', backdropFilter: 'blur(2px)' }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={[
          'relative arc-elevated w-full outline-none',
          sheetOnMobile
            ? 'sm:max-w-lg rounded-b-none sm:rounded-2xl animate-[arc-sheet-in_0.3s_cubic-bezier(0.22,1,0.36,1)] sm:animate-[arc-dialog-in_0.28s_cubic-bezier(0.22,1,0.36,1)]'
            : 'max-w-lg rounded-2xl animate-[arc-dialog-in_0.28s_cubic-bezier(0.22,1,0.36,1)]',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div>
            <h2 id={titleId} className="text-[18px] font-semibold text-text-primary">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-[13.5px] text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button onClick={onClose} aria-label="Close dialog" className="icon-btn !w-9 !h-9 -mt-1 -mr-1">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="px-5 pb-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-hairline">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
