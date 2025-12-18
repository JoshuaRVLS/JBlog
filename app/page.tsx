"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { OrganizationJsonLd } from "next-seo";
import Navbar from "@/components/Navbar/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import OrganizationsSection from "@/components/sections/OrganizationsSection";
import HobbiesSection from "@/components/sections/HobbiesSection";
import SkillsSection from "@/components/sections/SkillsSection";
import UsersWorldChartSection from "@/components/sections/UsersWorldChartSection";
import CTASection from "@/components/sections/CTASection";
import BroadcastParticles from "@/components/BroadcastParticles";
import { Menu, X, Home as HomeIcon, Briefcase, Building2, Heart, Lightbulb, Bug, Send, Loader2, Globe2, Sparkles, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

interface GitHubProject {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

interface GitHubOrg {
  id: number;
  login: string;
  avatar_url: string;
  description: string | null;
  html_url: string;
}

// Component for infinite scroll trigger
function LoadMoreTriggerComponent({ onLoadMore, isLoading, containerRef }: { onLoadMore: () => void; isLoading: boolean; containerRef?: React.RefObject<HTMLDivElement | null> }) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: "100px",
        root: containerRef?.current || null // Use container as root for scroll detection
      }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onLoadMore, isLoading, containerRef]);

  return (
    <div ref={observerRef} className="h-20 flex items-center justify-center">
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-sm">Memuat update logs...</span>
        </div>
      )}
    </div>
  );
}

// Lazy load GSAP to reduce initial bundle size
const loadGSAP = async () => {
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }
  return { gsap, ScrollTrigger };
};

export default function Home() {
  const [showBroadcast, setShowBroadcast] = useState(true);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [countdownFinished, setCountdownFinished] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<any>(null);
  const hasAnimatedRef = useRef<boolean>(false);
  
  // Refs for scroll animations
  const heroRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const projectsSectionRef = useRef<HTMLElement>(null);
  const projectsTitleRef = useRef<HTMLHeadingElement>(null);
  const organizationsSectionRef = useRef<HTMLElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);
  const hobbiesSectionRef = useRef<HTMLElement>(null);
  const skillsSectionRef = useRef<HTMLElement>(null);
  const lenisRef = useRef<any>(null);
  const updateLogsContainerRef = useRef<HTMLDivElement>(null);
  
  // Navigation menu state
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [showNavMenu, setShowNavMenu] = useState(false);
  
  // Report Bug state
  const [showReportBug, setShowReportBug] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportData, setReportData] = useState({
    title: "",
    description: "",
    type: "bug",
  });

  const { data: totalViews = 0 } = useQuery({
    queryKey: ["totalViews"],
    queryFn: async () => {
      const response = await fetch("/api/posts/total-views");
      if (!response.ok) throw new Error("Failed to fetch total views");
      const data = await response.json();
      return data.totalViews || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: broadcast } = useQuery({
    queryKey: ["broadcast", "active"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/broadcast/active");
        if (!response.ok) return null;
        const data = await response.json();
        return data.broadcast || null;
      } catch (error) {
        console.error("Error fetching broadcast:", error);
        return null;
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const {
    data: updateLogsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["updateLogs"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/updatelog/", window.location.origin);
      url.searchParams.set("limit", "10");
      if (pageParam) {
        url.searchParams.set("cursor", pageParam);
      }
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch update logs");
      const data = await response.json();
      return data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasMore ? lastPage.pagination.nextCursor : undefined;
    },
    initialPageParam: undefined,
    staleTime: 5 * 60 * 1000,
  });

  const updateLogs = updateLogsData?.pages.flatMap((page) => page.logs || []) || [];

  const { data: githubData } = useQuery({
    queryKey: ["githubData"],
    queryFn: async () => {
      const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      if (!githubToken) {
        return { projects: [], organizations: [] };
      }

      const [projectsRes, orgsRes] = await Promise.all([
        fetch("https://api.github.com/users/JoshuaRVLS/repos?sort=updated&per_page=6&type=all", {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }),
        fetch("https://api.github.com/users/JoshuaRVLS/orgs", {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }),
      ]);

      const projects = projectsRes.ok ? await projectsRes.json() : [];
      const organizations = orgsRes.ok ? await orgsRes.json() : [];

      return { projects, organizations };
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const projects = githubData?.projects || [];
  const organizations = githubData?.organizations || [];

  // Navigation menu sections (built dynamically for responsiveness)
  const navSections = [
    { id: "hero", label: "Home", icon: HomeIcon },
    { id: "projects", label: "Projects", icon: Briefcase },
    { id: "organizations", label: "Organizations", icon: Building2 },
    { id: "hobbies", label: "Hobbies", icon: Heart },
    { id: "skills", label: "Skills", icon: Lightbulb },
    { id: "world", label: "World", icon: Globe2 },
    ...(updateLogs.length > 0 ? [{ id: "updates", label: "Updates", icon: Sparkles }] : []),
    { id: "contact", label: "Contact", icon: Mail },
  ];

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    // Calculate offset based on screen size
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const navbarHeight = 64;
    const bottomNavHeight = isMobile ? 80 : 0;
    const padding = 16;
    const totalOffset = navbarHeight + bottomNavHeight + padding;

    // Get element's position relative to document
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    
    // Calculate target scroll position
    const targetScroll = Math.max(0, elementTop - totalOffset);

    // Smooth scroll
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });

    // Update active section after a short delay to ensure scroll has started
    setTimeout(() => {
      setActiveSection(sectionId);
    }, 100);
    
    setShowNavMenu(false);
  };

  // Handle report bug submit
  const handleReportBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportData.title || !reportData.description) {
      toast.error("Judul dan deskripsi harus diisi");
      return;
    }

    try {
      setSubmittingReport(true);
      const pageUrl = typeof window !== "undefined" ? window.location.href : null;

      await AxiosInstance.post("/reports", {
        ...reportData,
        pageUrl,
      });

      toast.success("Report berhasil dikirim! Terima kasih atas feedbacknya.");
      setShowReportBug(false);
      setReportData({
        title: "",
        description: "",
        type: "bug",
      });
      setShowNavMenu(false);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.msg || "Gagal mengirim report");
    } finally {
      setSubmittingReport(false);
    }
  };

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
      const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

      if (Math.abs(currentScrollY - lastScrollY) < 3) {
        return;
      }

      const sectionIds = ["hero", "projects", "organizations", "hobbies", "skills", "world", "updates", "contact"];
      const scrollPosition = currentScrollY + 150;

      // If user is at (or very near) the bottom, force active section to "contact"
      const doc = document.documentElement;
      const atBottom = window.innerHeight + currentScrollY >= (doc.scrollHeight - 10);

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

    window.addEventListener("scroll", handleScroll, { passive: true, capture: false });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: false } as any);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);
  
  // Auto-scroll mobile bottom nav so active item selalu kelihatan
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(`mobile-nav-${activeSection}`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeSection]);


  useEffect(() => {
    if (broadcast?.hasCountdown && broadcast?.countdownEndDate) {
      setCountdownFinished(false);
    }
  }, [broadcast]);

  useEffect(() => {
    if (!broadcast?.hasCountdown || !broadcast?.countdownEndDate || countdownFinished) return;

    let intervalId: NodeJS.Timeout;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endDate = new Date(broadcast.countdownEndDate).getTime();
      const distance = endDate - now;

      if (distance < 0) {
        setCountdownFinished(true);
        setCountdown(null);

        if (broadcast.actionAfterCountdown === "hide") {
          setShowBroadcast(false);
        } else if (broadcast.actionAfterCountdown === "redirect" && broadcast.redirectUrlAfterCountdown) {
          window.location.href = broadcast.redirectUrlAfterCountdown;
        }

        if (intervalId) {
          clearInterval(intervalId);
        }
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    intervalId = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [broadcast, countdownFinished]);


  // Setup scroll trigger animations - Hero and Parallax (only once)
  useEffect(() => {
    // Prevent multiple animations on refresh
    if (hasAnimatedRef.current) return;
    
    // Load GSAP dynamically
    loadGSAP().then(({ gsap, ScrollTrigger }) => {
      const ctx = gsap.context(() => {
        // Hero section animations - run immediately on mount
        if (heroContentRef.current) {
          const heroElements = heroContentRef.current.children;
          // Set initial state
          gsap.set(heroElements, { opacity: 0, y: 50 });
          // Animate in
          gsap.to(heroElements, {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out",
            delay: 0.2, // Small delay to ensure elements are ready
          });
        }

        // Parallax effect for hero background - only setup once
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
          const titleElement = projectsTitleRef.current.querySelector(".section-title") || projectsTitleRef.current.querySelector("h2");
          if (titleElement) {
            // Set initial state
            gsap.set(titleElement, { opacity: 0, y: 50 });
            // Animate in
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

        // Projects cards animation - skip karena dalam infinite scroll container
        // Animation di-handle oleh infinite scroll sendiri
        // Pastikan container tidak di-animate oleh scroll trigger
        if (scrollContainerRef.current) {
          gsap.set(scrollContainerRef.current, { opacity: 1, clearProps: "opacity" });
        }

        // Organizations section animation
        if (organizationsSectionRef.current) {
          const orgCards = organizationsSectionRef.current.querySelectorAll(".org-card");
          if (orgCards.length > 0) {
            // Set initial state untuk animation
            gsap.set(orgCards, { opacity: 0, scale: 0.8 });
            
            // Create scroll trigger animation
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
          // Always ensure section is visible (fallback)
          gsap.set(organizationsSectionRef.current, { opacity: 1, clearProps: "opacity" });
        }

        // CTA section animation - use more specific selector
        if (ctaSectionRef.current) {
          const ctaContent = ctaSectionRef.current.querySelector("div");
          if (ctaContent) {
            const ctaChildren = ctaContent.children;
            // Set initial state
            gsap.set(ctaChildren, { opacity: 0, y: 50 });
            // Animate with ScrollTrigger
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

        // Refresh ScrollTrigger after all animations are set up
        ScrollTrigger.refresh();
      });
    });
    
    return () => {
      // Don't revert on cleanup to prevent re-animation
      // Cleanup will be handled by GSAP context
    };
  }, []); // Remove dependencies to prevent re-trigger

  // Setup scroll trigger animations for dynamic content (organizations, projects)
  useEffect(() => {
    if (hasAnimatedRef.current && (organizations.length > 0 || projects.length > 0)) {
      loadGSAP().then(({ gsap, ScrollTrigger }) => {
        const ctx = gsap.context(() => {
          // Projects section animation (duplicate removed - handled in main useEffect)

          // Organizations section animation
          if (organizationsSectionRef.current) {
            const orgCards = organizationsSectionRef.current.querySelectorAll(".org-card");
            if (orgCards.length > 0) {
              // Set initial state untuk animation
              gsap.set(orgCards, { opacity: 0, scale: 0.8 });
              
              // Create scroll trigger animation
              gsap.to(orgCards, {
                scrollTrigger: {
                  trigger: organizationsSectionRef.current,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                  once: true, // Only trigger once
                },
                opacity: 1,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.7)",
              });
            }
          }

          // CTA section animation - use more specific selector
          if (ctaSectionRef.current) {
            const ctaContent = ctaSectionRef.current.querySelector("div");
            if (ctaContent) {
              const ctaChildren = ctaContent.children;
              // Set initial state
              gsap.set(ctaChildren, { opacity: 0, y: 50 });
              // Animate with ScrollTrigger
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

          // Refresh ScrollTrigger after animations are set up
          ScrollTrigger.refresh();
        });
      });
    }
    
    return () => {
      // Cleanup will be handled by GSAP context
    };
  }, [organizations, projects]);

  // Setup complex scroll trigger animations for hobbies and skills
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let refreshInterval: NodeJS.Timeout | null = null;
    
    // Wait for DOM to be ready and Lenis to initialize
    const setupAnimations = () => {
      loadGSAP().then(({ gsap, ScrollTrigger }) => {
        const ctx = gsap.context(() => {
          // Hobbies Section - Enhanced animations with parallax and stagger
          if (hobbiesSectionRef.current) {
            const hobbyCards = hobbiesSectionRef.current.querySelectorAll(".hobby-card");
            const hobbyTitle = hobbiesSectionRef.current.querySelector(".section-title") || hobbiesSectionRef.current.querySelector("h2");
            const hobbyIcons = hobbiesSectionRef.current.querySelectorAll(".hobby-icon");
            const hobbyTexts = hobbiesSectionRef.current.querySelectorAll(".hobby-text");
            const bgGradient = hobbiesSectionRef.current.querySelector(".hobby-bg-gradient");
            
            // Set initial state
            gsap.set(hobbiesSectionRef.current, { 
              opacity: 1, 
              visibility: "visible",
              display: "block",
            });
            
            if (hobbyTitle) {
              gsap.set(hobbyTitle, { opacity: 0, y: 50, scale: 0.9 });
            }
            
            if (hobbyCards.length > 0) {
              gsap.set(hobbyCards, { 
                opacity: 0, 
                scale: 0.8, 
                y: 60,
                rotationY: -15,
                transformOrigin: "center center"
              });
            }
            
            if (hobbyIcons.length > 0) {
              gsap.set(hobbyIcons, { 
                scale: 0,
                rotation: -180,
                opacity: 0
              });
            }
            
            if (hobbyTexts.length > 0) {
              gsap.set(hobbyTexts, { 
                opacity: 0,
                y: 20
              });
            }
            
            // Parallax background effect
            if (bgGradient) {
              gsap.to(bgGradient, {
                scrollTrigger: {
                  trigger: hobbiesSectionRef.current,
                  scroller: document.body,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1,
                },
                y: -50,
                opacity: 0.8,
                ease: "none",
              });
            }
            
            // Title animation with scale and blur effect
            if (hobbyTitle) {
              gsap.to(hobbyTitle, {
                scrollTrigger: {
                  trigger: hobbiesSectionRef.current,
                  scroller: document.body,
                  start: "top 80%",
                  toggleActions: "play none none reverse",
                  once: true,
                },
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1,
                ease: "back.out(1.7)",
              });
            }
            
            // Cards stagger animation with 3D rotation and scale
            hobbyCards.forEach((card, index) => {
              const icon = card.querySelector(".hobby-icon");
              const title = card.querySelector("h3");
              const text = card.querySelector(".hobby-text");
              const sparkle = card.querySelector(".hobby-sparkle");
              
              // Main card animation
              gsap.to(card, {
                scrollTrigger: {
                  trigger: card,
                  scroller: document.body,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                  once: true,
                },
                opacity: 1,
                scale: 1,
                y: 0,
                rotationY: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: index * 0.2,
              });
              
              // Icon animation with bounce
              if (icon) {
                gsap.to(icon, {
                  scrollTrigger: {
                    trigger: card,
                    scroller: document.body,
                    start: "top 85%",
                    toggleActions: "play none none reverse",
                    once: true,
                  },
                  scale: 1,
                  rotation: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "elastic.out(1, 0.5)",
                  delay: index * 0.2 + 0.2,
                });
              }
              
              // Title reveal
              if (title) {
                gsap.to(title, {
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
                  delay: index * 0.2 + 0.3,
                });
              }
              
              // Text reveal
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
              
              // Sparkle animation
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
              
              // Hover interaction with GSAP
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
          
          // Skills Section - Ensure visible first, then add animation
          if (skillsSectionRef.current) {
            const skillItems = skillsSectionRef.current.querySelectorAll(".skill-item");
            const skillTitle = skillsSectionRef.current.querySelector(".section-title") || skillsSectionRef.current.querySelector("h2");
            
            // CRITICAL: Set all elements to visible state FIRST (no animation)
            gsap.set(skillsSectionRef.current, { 
              opacity: 1, 
              visibility: "visible",
              display: "block",
            });
            
            if (skillTitle) {
              gsap.set(skillTitle, { opacity: 1, y: 0, visibility: "visible" });
            }
            
            if (skillItems.length > 0) {
              gsap.set(skillItems, { opacity: 1, scale: 1, y: 0, visibility: "visible" });
            }
            
            // Title animation
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
            
            // Skills animation
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
        
        // Initial refresh after a delay
        setTimeout(() => {
          ScrollTrigger.refresh();
          refreshInterval = setInterval(() => {
            ScrollTrigger.refresh();
          }, 500);
          
          // Stop refreshing after 2 seconds
          setTimeout(() => {
            if (refreshInterval) {
              clearInterval(refreshInterval);
              refreshInterval = null;
            }
          }, 2000);
        }, 500);
        
        // Store cleanup function
        cleanup = () => {
          if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
          }
          ctx.revert();
        };
      });
    };

    // Use IntersectionObserver to ensure sections are in DOM before setting up animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            // Section is in viewport or exists, setup animations
            if (hobbiesSectionRef.current && skillsSectionRef.current) {
              observer.disconnect();
              setupAnimations();
            }
          }
        });
      },
      { threshold: 0 }
    );

    // Start observing after a short delay to ensure DOM is ready
    setTimeout(() => {
      if (hobbiesSectionRef.current) {
        observer.observe(hobbiesSectionRef.current);
      }
      if (skillsSectionRef.current) {
        observer.observe(skillsSectionRef.current);
      }
      
      // Fallback: setup animations anyway after 1 second
      setTimeout(() => {
        if (hobbiesSectionRef.current || skillsSectionRef.current) {
          observer.disconnect();
          setupAnimations();
        }
      }, 1000);
    }, 100);
    
    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (projects.length === 0 || !scrollContainerRef.current) return;

    // Load GSAP dynamically for infinite scroll
    let timeoutId: NodeJS.Timeout | undefined;
    let cleanupFn: (() => void) | undefined;
    
    loadGSAP().then(({ gsap }) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const cardWidth = 320;
      const gap = 24;
      const singleSetWidth = (cardWidth + gap) * projects.length;
      const duration = projects.length * 2; // 2 seconds per project

      // Kill previous animation
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }

      // Set initial position and ensure opacity is visible
      gsap.set(container, { 
        x: 0, 
        opacity: 1,
        clearProps: "opacity,transform" 
      });

      // Wait a bit for DOM to be ready
      timeoutId = setTimeout(() => {
        if (!scrollContainerRef.current) return;

        // Create infinite scroll animation with seamless loop
        const animate = () => {
          if (!scrollContainerRef.current || !container) return;
          
          // Start from current position (or 0)
          const startX = gsap.getProperty(container, "x") as number || 0;
          const endX = startX - singleSetWidth;
          
          tweenRef.current = gsap.to(container, {
            x: endX,
            duration,
            ease: "none",
            onComplete: () => {
              // Seamlessly reset: karena kita duplicate 2x, reset ke posisi yang sama
              // Setelah scroll satu set, kita reset ke 0 (karena duplicate kedua set identik)
              gsap.set(container, { x: 0 });
              // Continue animation seamlessly
              animate();
            },
          });
        };

        // Start the animation
        animate();
      }, 500);

      cleanupFn = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (tweenRef.current) {
          tweenRef.current.kill();
          tweenRef.current = null;
        }
        // Reset on cleanup
        if (scrollContainerRef.current) {
          gsap.set(scrollContainerRef.current, { 
            x: 0, 
            opacity: 1,
            clearProps: "opacity,transform"
          });
        }
      };
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [projects]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <OrganizationJsonLd
        name="JBlog"
        url={siteUrl}
        logo={`${siteUrl}/og-image.png`}
        description="Platform blogging modern dengan fitur lengkap untuk berbagi ide, pengalaman, dan pengetahuan."
      />
      <Navbar />
      
      {/* Floating Navigation Menu */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
        <nav className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-2 shadow-xl">
          <ul className="flex flex-col gap-2">
            {navSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                    title={section.label}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-1 h-6 bg-primary rounded-full"></span>
                    )}
                    <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                    <span className={`text-sm font-medium whitespace-nowrap ${isActive ? "text-primary" : ""}`}>
                      {section.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="safe-area-bottom px-2 py-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {navSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <motion.button
                  key={section.id}
                  id={`mobile-nav-${section.id}`}
                  onClick={() => scrollToSection(section.id)}
                  whileTap={{ scale: 0.9 }}
                  className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px] flex-shrink-0 text-[10px] ${
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground"
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileBottomNavActive"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-b-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  {/* Icon */}
                  <div className={`relative z-10 p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-primary/10" 
                      : ""
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                  
                  {/* Label */}
                  <span className={`font-medium transition-colors whitespace-nowrap ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {section.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Report Bug Modal */}
      <AnimatePresence>
        {showReportBug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReportBug(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bug className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Report Bug</h2>
                    <p className="text-sm text-muted-foreground">
                      Laporkan bug atau berikan feedback
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportBug(false)}
                  className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleReportBugSubmit} className="p-6 space-y-6">
                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Tipe Report
                  </label>
                  <select
                    value={reportData.type}
                    onChange={(e) => setReportData({ ...reportData, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="bug">Bug</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Judul <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportData.title}
                    onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                    placeholder="Contoh: Tombol tidak berfungsi di halaman dashboard"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Deskripsi <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={reportData.description}
                    onChange={(e) =>
                      setReportData({ ...reportData, description: e.target.value })
                    }
                    placeholder="Jelaskan secara detail tentang bug atau feature yang ingin dilaporkan..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReportBug(false)}
                    className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-accent transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submittingReport ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Kirim Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="pb-20 lg:pb-0">
        {broadcast && !(countdownFinished && broadcast.actionAfterCountdown === "hide") && (
          <div
            className={`fixed top-16 left-0 right-0 z-40 border-b backdrop-blur-sm transition-transform duration-200 ease-out relative overflow-hidden ${
              showBroadcast ? "translate-y-0" : "-translate-y-full"
            }`}
            style={{
              backgroundColor: broadcast.backgroundColor
                ? `${broadcast.backgroundColor}15`
                : broadcast.type === "info"
                ? "rgba(59, 130, 246, 0.1)"
                : broadcast.type === "warning"
                ? "rgba(234, 179, 8, 0.1)"
                : broadcast.type === "success"
                ? "rgba(34, 197, 94, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              borderColor: broadcast.borderColor
                ? `${broadcast.borderColor}30`
                : broadcast.type === "info"
                ? "rgba(59, 130, 246, 0.2)"
                : broadcast.type === "warning"
                ? "rgba(234, 179, 8, 0.2)"
                : broadcast.type === "success"
                ? "rgba(34, 197, 94, 0.2)"
                : "rgba(239, 68, 68, 0.2)",
              color: broadcast.textColor || (broadcast.type === "info"
                ? "#3b82f6"
                : broadcast.type === "warning"
                ? "#eab308"
                : broadcast.type === "success"
                ? "#22c55e"
                : "#ef4444"),
            }}
          >
            <BroadcastParticles 
              effect={countdownFinished && broadcast.particleEffectAfterCountdown 
                ? (broadcast.particleEffectAfterCountdown || "none")
                : (broadcast.particleEffect || "none")
              } 
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2.5 relative z-10 pointer-events-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {broadcast.icon && (
                    <span className="text-lg flex-shrink-0">{broadcast.icon}</span>
                  )}
                  <div className="font-bold whitespace-nowrap text-sm">
                    {countdownFinished && broadcast.actionAfterCountdown === "change_message" && broadcast.messageAfterCountdown
                      ? broadcast.messageAfterCountdown
                      : broadcast.title}
                  </div>
                  <div className="text-xs opacity-80 truncate">
                    {countdownFinished && broadcast.actionAfterCountdown === "change_message" && broadcast.messageAfterCountdown
                      ? ""
                      : broadcast.message}
                  </div>
                </div>
                {broadcast.hasCountdown && countdown && !countdownFinished && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded backdrop-blur-sm">
                      {countdown.days > 0 && (
                        <span className="text-xs font-bold">
                          {countdown.days}d
                        </span>
                      )}
                      <span className="text-xs font-bold">
                        {String(countdown.hours).padStart(2, "0")}:
                        {String(countdown.minutes).padStart(2, "0")}:
                        {String(countdown.seconds).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Hero Section */}
        <HeroSection ref={heroRef} totalViews={totalViews} heroContentRef={heroContentRef} />

        {/* Gradient Transition Hero to Projects */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Projects Section */}
        <ProjectsSection
          ref={projectsSectionRef}
          projects={projects}
          scrollContainerRef={scrollContainerRef}
          tweenRef={tweenRef}
          projectsTitleRef={projectsTitleRef}
        />

        {/* Gradient Transition Projects to Organizations */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Organizations Section */}
        <OrganizationsSection ref={organizationsSectionRef} organizations={organizations} />

        {/* Gradient Transition Organizations to Hobbies */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Hobbies Section */}
        <HobbiesSection ref={hobbiesSectionRef} />

        {/* Gradient Transition Hobbies to Skills */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Skills Section */}
        <SkillsSection ref={skillsSectionRef} />

        {/* Gradient Transition Skills to Globe */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Users World Chart Section */}
        <section id="world">
          <UsersWorldChartSection />
        </section>

        {/* Gradient Transition Globe to CTA */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {updateLogs.length > 0 && (
          <>
            <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>
            <section id="updates" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Update Logs</h2>
              <div className="max-w-3xl mx-auto">
                {/* Fixed height container with scroll */}
                <div 
                  ref={updateLogsContainerRef}
                  className="h-[600px] overflow-y-auto space-y-4 update-logs-scroll"
                >
                  {updateLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all"
                    >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{log.title}</h3>
                          {log.version && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-sm font-medium">
                              v{log.version}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {log.author && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{log.author}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {new Date(log.date || log.createdAt).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          {log.commitHash && (
                            <span className="font-mono text-xs">
                              {log.commitHash.substring(0, 7)}
                            </span>
                          )}
                        </div>
                      </div>
                      {log.commitUrl && (
                        <a
                          href={log.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
                          title="View on GitHub"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                    {(() => {
                      if (!log.description) return null;
                      const branchMatch = log.description.match(/\[(?:Branch|Branches):\s*([^\]]+)\]/);
                      const branches = branchMatch?.[1]?.split(",").map((b: string) => b.trim()) || [];
                      const cleanDescription = log.description.replace(/\[(?:Branch|Branches):[^\]]+\]/g, "").trim();
                      
                      return (
                        <div className="mb-3">
                          {cleanDescription && (
                            <p className="text-muted-foreground leading-relaxed mb-2">{cleanDescription}</p>
                          )}
                          {/* Display branch badges */}
                          {branches.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {branches.map((branch: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium"
                                >
                                  {branch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {log.changes && log.changes.length > 0 && (
                      <ul className="space-y-2 mt-4">
                        {log.changes.map((change: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  ))}
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 mt-6">
                  <button
                    onClick={() => {
                      if (updateLogsContainerRef.current) {
                        updateLogsContainerRef.current.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span>Previous</span>
                  </button>
                  
                  {hasNextPage ? (
                    <button
                      onClick={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                          fetchNextPage();
                        }
                      }}
                      disabled={isFetchingNextPage}
                      className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Semua update logs telah dimuat
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      if (updateLogsContainerRef.current) {
                        updateLogsContainerRef.current.scrollTo({
                          top: updateLogsContainerRef.current.scrollHeight,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* J+ banner temporarily hidden */}
        {/* <JPlusBanner /> */}
        <CTASection ref={ctaSectionRef} />
      </main>
    </div>
  );
}
