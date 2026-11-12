"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * One place to respect the visitor's "reduce motion" setting. With
 * reducedMotion="user", Framer Motion skips transform and layout animation
 * for anyone who asked their device for less movement.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
