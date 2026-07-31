import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, useGSAP, EASE, DURATION } from '../../lib/motion';

/** Fades each route in on navigation. Deliberately quiet — no slide, no scale. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(scope.current, { opacity: 1, y: 0 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          scope.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: DURATION.fast, ease: EASE.out, clearProps: 'transform' }
        );
      });

      return () => mm.revert();
    },
    { scope, dependencies: [pathname], revertOnUpdate: true }
  );

  return <div ref={scope}>{children}</div>;
}
