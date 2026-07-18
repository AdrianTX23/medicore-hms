"use client";

import { motion, useReducedMotion } from "framer-motion";

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Starting vertical offset in pixels. */
  y?: number;
};

/** Generic fade + slide-up entrance wrapper for above-the-fold content. */
export function FadeIn({ children, delay = 0, className, y = 16 }: FadeInProps) {
  // Respect OS-level "reduce motion": keep the fade (harmless) but drop the
  // slide and shorten the delay/duration so nothing appears to move.
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.5, delay: reduceMotion ? 0 : delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
