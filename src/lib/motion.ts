import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Apple's motion tone is restrained and polished — never playful.
 * Everything decelerates into place; nothing overshoots or bounces.
 */
export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
} as const;

export const DURATION = {
  fast: 0.35,
  base: 0.6,
  slow: 0.9,
} as const;

export { gsap, ScrollTrigger, useGSAP };
