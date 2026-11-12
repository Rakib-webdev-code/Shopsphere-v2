"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
};

/** A grid whose children settle in one after another when it first appears. */
export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.ul
      role="list"
      className={className}
      variants={list}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.ul>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.li variants={item} className={className}>
      {children}
    </motion.li>
  );
}
