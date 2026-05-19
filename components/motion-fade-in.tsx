"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export function MotionFadeIn({
  children,
  delay = 0,
  y = 12,
  ...props
}: { delay?: number; y?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
