"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

type CountUpProps = {
  value: number;
  /**
   * Treats `value` as cents and shows currency. A boolean (not a function)
   * because functions cannot be passed from Server to Client Components.
   */
  money?: boolean;
  className?: string;
};

/** Counts from 0 to `value` once, when the number scrolls into view. */
export function CountUp({ value, money = false, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduceMotion) {
      return;
    }

    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
      onComplete: () => setDisplay(value),
    });

    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  const shown = reduceMotion || !inView ? value : display;
  const rounded = Math.round(shown);

  return (
    <span ref={ref} className={className}>
      {money ? formatPrice(rounded) : rounded.toLocaleString("en-US")}
    </span>
  );
}
