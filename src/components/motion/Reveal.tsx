import { useRef } from 'react';
import { gsap, useGSAP, EASE, DURATION } from '../../lib/motion';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds between each child's entrance. */
  stagger?: number;
  /** Pixels travelled on the way in. */
  y?: number;
  delay?: number;
  /** Wait until the block scrolls into view instead of animating on mount. */
  onScroll?: boolean;
  /** Re-run the entrance when these change (e.g. async data arriving). */
  deps?: unknown[];
}

/**
 * Staggers its direct children into place. Children are animated from
 * `.gs-reveal`'s hidden state, so there is no flash before GSAP takes over.
 */
export function Reveal({
  children,
  className,
  stagger = 0.06,
  y = 18,
  delay = 0,
  onScroll = false,
  deps = [],
}: RevealProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>(scope.current!.children);
      if (!targets.length) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(targets, { opacity: 1, y: 0 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          targets,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration: DURATION.base,
            ease: EASE.out,
            stagger,
            delay,
            clearProps: 'transform',
            ...(onScroll && {
              scrollTrigger: {
                trigger: scope.current,
                start: 'top 88%',
                once: true,
              },
            }),
          }
        );
      });

      return () => mm.revert();
    },
    { scope, dependencies: deps, revertOnUpdate: true }
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
