"use client";

import { ReactNode, memo } from "react";
import { motion } from "motion/react";

interface ShimmerCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function ShimmerCard({
  children,
  className = "",
  delay = 0,
}: ShimmerCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ 
        scale: 1.02, 
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" } 
      }}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default memo(ShimmerCard);

