"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The single orchestrated moment on the homepage: the headline block settles
 * first, then the price tags swing in on their strings. Nothing else on the
 * page animates by itself.
 */
const easeOut = [0.22, 1, 0.36, 1] as const;

const column: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

export function HeroColumn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={column}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={rise} className={className}>
      {children}
    </motion.div>
  );
}

type TagSwingProps = {
  children: ReactNode;
  className?: string;
  /** Resting rotation in degrees, so the three tags do not hang identically. */
  tilt?: number;
  delay?: number;
};

export function TagSwing({
  children,
  className,
  tilt = 0,
  delay = 0,
}: TagSwingProps) {
  return (
    <motion.div
      className={className}
      style={{ transformOrigin: "50% 0%" }}
      initial={{ rotate: tilt - 14, opacity: 0, y: -12 }}
      animate={{ rotate: tilt, opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 70,
        damping: 9,
        mass: 0.9,
        delay: 0.35 + delay,
        opacity: { duration: 0.25, delay: 0.35 + delay },
      }}
      whileHover={{ rotate: tilt * 0.4, y: -3 }}
    >
      {children}
    </motion.div>
  );
}
