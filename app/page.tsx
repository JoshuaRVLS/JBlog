"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import OrganizationsSection from "@/components/sections/OrganizationsSection";
import HobbiesSection from "@/components/sections/HobbiesSection";
import SkillsSection from "@/components/sections/SkillsSection";
import UsersWorldChartSection from "@/components/sections/UsersWorldChartSection";
import CTASection from "@/components/sections/CTASection";
import { Menu, Home as HomeIcon, Briefcase, Building2, Heart, Lightbulb } from "lucide-react";

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
  const [loading, setLoading] = useState(false); // Start with false, no loading screen
  const [projects, setProjects] = useState<GitHubProject[]>([]);
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [totalViews, setTotalViews] = useState<number>(0);
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
  
  // Navigation menu state
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [showNavMenu, setShowNavMenu] = useState(false);

  useEffect(() => {
    fetchGitHubData();
    fetchTotalViews();
  }, []);

  // Navigation menu sections
  const navSections = [
    { id: "hero", label: "Home", icon: HomeIcon },
    { id: "projects", label: "Projects", icon: Briefcase },
    { id: "organizations", label: "Organizations", icon: Building2 },
    { id: "hobbies", label: "Hobbies", icon: Heart },
    { id: "skills", label: "Skills", icon: Lightbulb },
  ];

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Offset for fixed navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
      setShowNavMenu(false);
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ["hero", "projects", "organizations", "hobbies", "skills"];
      const scrollPosition = window.scrollY + 150;

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
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchTotalViews = async () => {
    try {
      const response = await fetch("/api/posts/total-views");
      if (response.ok) {
        const data = await response.json();
        setTotalViews(data.totalViews || 0);
      }
    } catch (error) {
      console.error("Error fetching total views:", error);
    }
  };

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

  const fetchGitHubData = async () => {
    try {
      const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      if (!githubToken) {
        console.warn("GitHub token tidak ditemukan, skip fetch GitHub data");
        // Set organizations to empty array to ensure section is visible
        setOrganizations([]);
        return;
      }

      // Fetch projects
      const projectsRes = await fetch(
        "https://api.github.com/users/JoshuaRVLS/repos?sort=updated&per_page=6&type=all",
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      } else {
        const errorText = projectsRes.statusText || `Status: ${projectsRes.status}`;
        console.error("Error fetching projects:", errorText);
        try {
          const errorData = await projectsRes.json();
          if (errorData.message) {
            console.error("GitHub API error:", errorData.message);
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
        setProjects([]);
      }

      // Fetch organizations
      const orgsRes = await fetch(
        "https://api.github.com/users/JoshuaRVLS/orgs",
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(orgsData);
      } else {
        const errorText = orgsRes.statusText || `Status: ${orgsRes.status}`;
        console.error("Error fetching organizations:", errorText);
        try {
          const errorData = await orgsRes.json();
          if (errorData.message) {
            console.error("GitHub API error:", errorData.message);
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
        // Set empty array to ensure section is still visible
        setOrganizations([]);
      }
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
      // Set empty arrays on error to prevent UI issues
      setProjects([]);
      setOrganizations([]);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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

      {/* Mobile Navigation Menu */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <button
          onClick={() => setShowNavMenu(!showNavMenu)}
          className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {showNavMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
              onClick={() => setShowNavMenu(false)}
            />
            <nav className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl p-3 shadow-xl z-40 min-w-[200px]">
              <ul className="flex flex-col gap-2">
                {navSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                        <span className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                          {section.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>
        )}
      </div>
      
      <main>
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
        <UsersWorldChartSection />

        {/* Gradient Transition Globe to CTA */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* CTA Section */}
        <CTASection ref={ctaSectionRef} />
      </main>
    </div>
  );
}
