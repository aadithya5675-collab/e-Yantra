import { useRef } from 'react';
import { gsap, useGSAP, EASE } from '../../lib/motion';

/** Counts up to `value`. Used for dashboard stat tiles. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        el.textContent = String(value);
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const counter = { n: Number(el.textContent) || 0 };
        gsap.to(counter, {
          n: value,
          duration: 0.9,
          ease: EASE.out,
          onUpdate: () => {
            el.textContent = String(Math.round(counter.n));
          },
        });
      });

      return () => mm.revert();
    },
    { dependencies: [value] }
  );

  return <span ref={ref} className={className}>0</span>;
}
