"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Staggered fade/slide-in for the results list — purely decorative, no
 * layout impact if JS is disabled (children just render immediately). */
export function AnimatedList({ children }: { children: ReactNode[] }) {
  return (
    <>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4), ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}
