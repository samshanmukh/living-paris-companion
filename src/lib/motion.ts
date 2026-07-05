import type { Transition, Variants } from "framer-motion";

export const spring: Record<"soft" | "pop", Transition> = {
  soft: { type: "spring", stiffness: 120, damping: 18 },
  pop: { type: "spring", stiffness: 300, damping: 20 },
};

export const panelIn = {
  initial: { x: -24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: spring.soft,
};

export const ambientIn = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 24, opacity: 0 },
  transition: spring.soft,
};

export const bubbleIn: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const chipIn = (i: number) => ({
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { delay: i * 0.05, ...spring.pop },
});

export const markerIn = (i: number) => ({
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { delay: i * 0.03, ...spring.pop },
});

export const cardIn = (i: number) => ({
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 16, opacity: 0 },
  transition: { delay: i * 0.08, ...spring.soft },
});
