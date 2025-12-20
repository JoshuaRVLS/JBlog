import { useEffect, useRef } from "react";

// Lazy load GSAP to reduce initial bundle size
const loadGSAP = async () => {
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }
  return { gsap, ScrollTrigger };
};

interface UseGSAPAnimationsProps {
  heroRef: React.RefObject<HTMLElement | null>;
  heroContentRef: React.RefObject<HTMLDivElement | null>;
  projectsSectionRef: React.RefObject<HTMLElement | null>;
  projectsTitleRef: React.RefObject<HTMLHeadingElement | null>;
  organizationsSectionRef: React.RefObject<HTMLElement | null>;
  ctaSectionRef: React.RefObject<HTMLElement | null>;
  hobbiesSectionRef: React.RefObject<HTMLElement | null>;
  skillsSectionRef: React.RefObject<HTMLElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  organizations: any[];
  projects: any[];
}

export function useGSAPAnimations({
  heroRef,
  heroContentRef,
  projectsSectionRef,
  projectsTitleRef,
  organizationsSectionRef,
  ctaSectionRef,
  hobbiesSectionRef,
  skillsSectionRef,
  scrollContainerRef,
  organizations,
  projects,
}: UseGSAPAnimationsProps) {
  const hasAnimatedRef = useRef<boolean>(false);

  // Main GSAP animations setup
  useEffect(() => {
    if (hasAnimatedRef.current) return;

    loadGSAP().then(({ gsap, ScrollTrigger }) => {
      const ctx = gsap.context(() => {
        // Hero section animations
        if (heroContentRef.current) {
          const heroElements = heroContentRef.current.children;
          gsap.set(heroElements, { opacity: 0, y: 50 });
          gsap.to(heroElements, {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out",
            delay: 0.2,
          });
        }

        // Parallax effect for hero background
        if (heroRef.current) {
          const bgElements = heroRef.current.querySelectorAll(".hero-bg");
          bgElements.forEach((el) => {
            gsap.to(el, {
              scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
              y: 100,
              ease: "none",
            });
          });
        }

        hasAnimatedRef.current = true;

        // Projects section animation
        if (projectsTitleRef.current) {
          const titleElement =
            projectsTitleRef.current.querySelector(".section-title") ||
            projectsTitleRef.current.querySelector("h2");
          if (titleElement) {
            gsap.set(titleElement, { opacity: 0, y: 50 });
            gsap.to(titleElement, {
              scrollTrigger: {
                trigger: projectsTitleRef.current,
                scroller: document.body,
                start: "top 85%",
                toggleActions: "play none none reverse",
                once: true,
              },
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
            });
          }
        }

        if (scrollContainerRef.current) {
          gsap.set(scrollContainerRef.current, {
            opacity: 1,
            clearProps: "opacity",
          });
        }

        // Organizations section animation
        if (organizationsSectionRef.current) {
          const orgCards =
            organizationsSectionRef.current.querySelectorAll(".org-card");
          if (orgCards.length > 0) {
            gsap.set(orgCards, { opacity: 0, scale: 0.8 });
            gsap.to(orgCards, {
              scrollTrigger: {
                trigger: organizationsSectionRef.current,
                start: "top 85%",
                toggleActions: "play none none reverse",
                once: true,
              },
              opacity: 1,
              scale: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "back.out(1.7)",
            });
          }
          gsap.set(organizationsSectionRef.current, {
            opacity: 1,
            clearProps: "opacity",
          });
        }

        // CTA section animation
        if (ctaSectionRef.current) {
          const ctaContent = ctaSectionRef.current.querySelector("div");
          if (ctaContent) {
            const ctaChildren = ctaContent.children;
            gsap.set(ctaChildren, { opacity: 0, y: 50 });
            gsap.to(ctaChildren, {
              scrollTrigger: {
                trigger: ctaSectionRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
                once: true,
              },
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.2,
              ease: "power3.out",
            });
          }
        }

        ScrollTrigger.refresh();
      });
    });
  }, []);

  // Dynamic content animations
  useEffect(() => {
    if (hasAnimatedRef.current && (organizations.length > 0 || projects.length > 0)) {
      loadGSAP().then(({ gsap, ScrollTrigger }) => {
        const ctx = gsap.context(() => {
          if (organizationsSectionRef.current) {
            const orgCards =
              organizationsSectionRef.current.querySelectorAll(".org-card");
            if (orgCards.length > 0) {
              gsap.set(orgCards, { opacity: 0, scale: 0.8 });
              gsap.to(orgCards, {
                scrollTrigger: {
                  trigger: organizationsSectionRef.current,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                  once: true,
                },
                opacity: 1,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.7)",
              });
            }
          }

          if (ctaSectionRef.current) {
            const ctaContent = ctaSectionRef.current.querySelector("div");
            if (ctaContent) {
              const ctaChildren = ctaContent.children;
              gsap.set(ctaChildren, { opacity: 0, y: 50 });
              gsap.to(ctaChildren, {
                scrollTrigger: {
                  trigger: ctaSectionRef.current,
                  start: "top 80%",
                  toggleActions: "play none none reverse",
                  once: true,
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "power3.out",
              });
            }
          }

          ScrollTrigger.refresh();
        });
      });
    }
  }, [organizations, projects, organizationsSectionRef, ctaSectionRef]);

  // Hobbies and Skills animations (complex)
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let refreshInterval: NodeJS.Timeout | null = null;

    const setupAnimations = async () => {
      const { gsap, ScrollTrigger } = await loadGSAP();
      const ctx = gsap.context(() => {
        // Hobbies Section
        if (hobbiesSectionRef.current) {
          const hobbyCards =
            hobbiesSectionRef.current.querySelectorAll(".hobby-card");
          hobbyCards.forEach((card, index) => {
            const icon = card.querySelector(".hobby-icon");
            const text = card.querySelector(".hobby-text");
            const sparkle = card.querySelector(".sparkle");

            gsap.set(card, { opacity: 0, y: 30, scale: 0.9 });
            gsap.set(icon, { opacity: 0, scale: 0, rotation: -180 });
            gsap.set(text, { opacity: 0, y: 20 });
            gsap.set(sparkle, { opacity: 0, scale: 0 });

            gsap.to(card, {
              scrollTrigger: {
                trigger: hobbiesSectionRef.current,
                scroller: document.body,
                start: "top 85%",
                toggleActions: "play none none reverse",
                once: true,
              },
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.5,
              ease: "back.out(1.7)",
              delay: index * 0.15,
            });

            if (icon) {
              gsap.to(icon, {
                scrollTrigger: {
                  trigger: card,
                  scroller: document.body,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                  once: true,
                },
                opacity: 1,
                scale: 1,
                rotation: 0,
                duration: 0.6,
                ease: "back.out(1.7)",
                delay: index * 0.15 + 0.2,
              });
            }

            if (text) {
              gsap.to(text, {
                scrollTrigger: {
                  trigger: card,
                  scroller: document.body,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                  once: true,
                },
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                delay: index * 0.2 + 0.4,
              });
            }

            if (sparkle) {
              gsap.to(sparkle, {
                scrollTrigger: {
                  trigger: card,
                  scroller: document.body,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                  once: true,
                },
                opacity: 1,
                scale: 1,
                duration: 0.5,
                ease: "power2.out",
                delay: index * 0.2 + 0.5,
              });
            }

            card.addEventListener("mouseenter", () => {
              gsap.to(card, {
                scale: 1.05,
                y: -10,
                rotationY: 5,
                duration: 0.4,
                ease: "power2.out",
              });
              if (icon) {
                gsap.to(icon, {
                  scale: 1.2,
                  rotation: 360,
                  duration: 0.6,
                  ease: "power2.out",
                });
              }
            });

            card.addEventListener("mouseleave", () => {
              gsap.to(card, {
                scale: 1,
                y: 0,
                rotationY: 0,
                duration: 0.4,
                ease: "power2.out",
              });
              if (icon) {
                gsap.to(icon, {
                  scale: 1,
                  rotation: 0,
                  duration: 0.4,
                  ease: "power2.out",
                });
              }
            });
          });
        }

        // Skills Section
        if (skillsSectionRef.current) {
          const skillItems =
            skillsSectionRef.current.querySelectorAll(".skill-item");
          const skillTitle =
            skillsSectionRef.current.querySelector(".section-title") ||
            skillsSectionRef.current.querySelector("h2");

          gsap.set(skillsSectionRef.current, {
            opacity: 1,
            visibility: "visible",
            display: "block",
          });

          if (skillTitle) {
            gsap.set(skillTitle, { opacity: 1, y: 0, visibility: "visible" });
          }

          if (skillItems.length > 0) {
            gsap.set(skillItems, {
              opacity: 1,
              scale: 1,
              y: 0,
              visibility: "visible",
            });
          }

          if (skillTitle) {
            gsap.from(skillTitle, {
              scrollTrigger: {
                trigger: skillsSectionRef.current,
                scroller: document.body,
                start: "top 85%",
                toggleActions: "play none none reverse",
                once: true,
              },
              opacity: 0,
              y: 30,
              duration: 0.5,
              ease: "power2.out",
            });
          }

          if (skillItems.length > 0) {
            gsap.from(skillItems, {
              scrollTrigger: {
                trigger: skillsSectionRef.current,
                scroller: document.body,
                start: "top 85%",
                toggleActions: "play none none reverse",
                once: true,
              },
              opacity: 0,
              scale: 0.8,
              y: 20,
              duration: 0.4,
              stagger: {
                amount: 0.4,
                from: "start",
              },
              ease: "power2.out",
            });
          }
        }
      });

      setTimeout(() => {
        ScrollTrigger.refresh();
        refreshInterval = setInterval(() => {
          ScrollTrigger.refresh();
        }, 500);

        setTimeout(() => {
          if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
          }
        }, 2000);
      }, 500);

      cleanup = () => {
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = null;
        }
        ctx.revert();
      };
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            if (hobbiesSectionRef.current && skillsSectionRef.current) {
              observer.disconnect();
              setupAnimations();
            }
          }
        });
      },
      { threshold: 0 }
    );

    setTimeout(() => {
      if (hobbiesSectionRef.current) {
        observer.observe(hobbiesSectionRef.current);
      }
      if (skillsSectionRef.current) {
        observer.observe(skillsSectionRef.current);
      }

      setTimeout(() => {
        if (hobbiesSectionRef.current || skillsSectionRef.current) {
          observer.disconnect();
          setupAnimations();
        }
      }, 1000);
    }, 100);

    return () => {
      if (cleanup) {
        cleanup();
      }
      observer.disconnect();
    };
  }, [hobbiesSectionRef, skillsSectionRef]);
}

