import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { gsap, useGSAP, EASE } from '../../lib/motion';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Centered sheet on desktop, bottom sheet on mobile. Scrim fades, panel rises. */
export function Modal({ title, onClose, children }: ModalProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(['.gs-scrim', '.gs-panel'], { opacity: 1, y: 0 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline()
          .fromTo('.gs-scrim', { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'none' })
          .fromTo(
            '.gs-panel',
            { opacity: 0, y: 16, scale: 0.99 },
            { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: EASE.out, clearProps: 'transform' },
            '-=0.1'
          );
      });

      return () => mm.revert();
    },
    { scope }
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div ref={scope} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="gs-scrim absolute inset-0 bg-black/25"
        onClick={onClose}
      />

      <div className="gs-panel relative w-full sm:max-w-[440px] max-h-[90vh] overflow-y-auto bg-page border border-hairline rounded-t-[22px] sm:rounded-[22px] p-7">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-full text-text-secondary hover:bg-text-secondary/10 hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-text-secondary tracking-[0.01em]">
        {label}
      </label>
      {children}
    </div>
  );
}
