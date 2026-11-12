"use client";

import { motion } from "framer-motion";

/** A check mark that draws itself, shown once after a successful payment. */
export function PaidCheck({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-solid text-white ${className ?? ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
        />
      </svg>
    </span>
  );
}
