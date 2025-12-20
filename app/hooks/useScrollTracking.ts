import { useEffect, useState } from "react";

export function useScrollTracking(
  setActiveSection: (section: string) => void,
  setShowBroadcast: (show: boolean) => void
) {
  useEffect(() => {
    let lastScrollY = 0;
    let rafId: number | null = null;
    let lastUpdateTime = 0;
    const throttleMs = 50;

    const handleScroll = () => {
      const now = performance.now();
      if (now - lastUpdateTime < throttleMs) {
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            handleScroll();
          });
        }
        return;
      }

      lastUpdateTime = now;
      const currentScrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop;

      if (Math.abs(currentScrollY - lastScrollY) < 3) {
        return;
      }

      const sectionIds = [
        "hero",
        "projects",
        "organizations",
        "hobbies",
        "skills",
        "world",
        "updates",
        "contact",
      ];
      const scrollPosition = currentScrollY + 150;

      // If user is at (or very near) the bottom, force active section to "contact"
      const doc = document.documentElement;
      const atBottom =
        window.innerHeight + currentScrollY >= doc.scrollHeight - 10;

      if (atBottom) {
        setActiveSection("contact");
      } else {
        for (let i = sectionIds.length - 1; i >= 0; i--) {
          const section = document.getElementById(sectionIds[i]);
          if (section) {
            const sectionTop = section.offsetTop;
            if (scrollPosition >= sectionTop) {
              setActiveSection(sectionIds[i]);
              break;
            }
          }
        }
      }

      if (currentScrollY < 50) {
        setShowBroadcast(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowBroadcast(false);
      } else if (currentScrollY < lastScrollY) {
        setShowBroadcast(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: false,
    });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll, {
        capture: false,
      } as any);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [setActiveSection, setShowBroadcast]);
}

