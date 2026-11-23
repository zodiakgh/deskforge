import { cubicOut } from 'svelte/easing';
import { fly, fade } from 'svelte/transition';

export const reduced =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Duration that collapses to zero when the system asks for reduced motion. */
export const ms = (n: number) => (reduced ? 0 : n);

export const enter = (node: Element, o: { y?: number; x?: number; delay?: number; duration?: number } = {}) =>
  fly(node, { y: o.y ?? 10, x: o.x ?? 0, delay: reduced ? 0 : o.delay ?? 0, duration: ms(o.duration ?? 240), easing: cubicOut });

export const soft = (node: Element, o: { duration?: number } = {}) => fade(node, { duration: ms(o.duration ?? 140) });
