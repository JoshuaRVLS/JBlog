"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
}

export default function Tooltip({ children, content, delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    const top = triggerRect.top - tooltipRect.height - 10;
    const left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

    const padding = 8;
    let finalLeft = left;
    let finalTop = top;
    
    if (finalLeft < padding) {
      finalLeft = padding;
    }
    
    if (finalLeft + tooltipRect.width > window.innerWidth - padding) {
      finalLeft = window.innerWidth - tooltipRect.width - padding;
    }

    if (finalTop < padding) {
      finalTop = triggerRect.bottom + 10;
    }

    setPosition({
      top: finalTop,
      left: finalLeft,
    });
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return;

    const timer1 = setTimeout(() => {
      updatePosition();
    }, 0);

    const timer2 = setTimeout(() => {
      updatePosition();
    }, 50);

    const handleResize = () => {
      if (isVisible) updatePosition();
    };
    const handleScroll = () => {
      if (isVisible) updatePosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isVisible]);

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && mounted && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999,
            pointerEvents: "none",
          }}
          className="px-3 py-1.5 text-sm font-medium text-foreground bg-card/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl whitespace-nowrap"
        >
          {content}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card/95 border-r border-b border-border/50 rotate-45 -mt-0.5"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {children}
      </div>
      
      {mounted && createPortal(tooltipContent, document.body)}
    </>
  );
}
