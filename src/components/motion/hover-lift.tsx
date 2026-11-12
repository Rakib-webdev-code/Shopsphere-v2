"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Gentle lift for cards. Answers the pointer, so it is not decoration. */
export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}
