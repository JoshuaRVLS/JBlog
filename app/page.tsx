"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
// GSAP will be loaded dynamically to reduce initial bundle size
import {
  Github,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  GraduationCap,
  Code,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Download,
  Eye,
  Target,
  Terminal,
  Database,
  Globe,
  Smartphone,
  Server,
  Layers,
  Zap,
} from "lucide-react";

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

  useEffect(() => {
    fetchGitHubData();
    fetchTotalViews();
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
          // Set initial state
          gsap.set(projectsTitleRef.current, { opacity: 0, y: 50 });
          // Animate in
          gsap.to(projectsTitleRef.current, {
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
          // Hobbies Section - Ensure visible first, then add animation
          if (hobbiesSectionRef.current) {
            const hobbyCards = hobbiesSectionRef.current.querySelectorAll(".hobby-card");
            const hobbyTitle = hobbiesSectionRef.current.querySelector("h2");
            
            // CRITICAL: Set all elements to visible state FIRST (no animation)
            gsap.set(hobbiesSectionRef.current, { 
              opacity: 1, 
              visibility: "visible",
              display: "block",
            });
            
            if (hobbyTitle) {
              gsap.set(hobbyTitle, { opacity: 1, y: 0, visibility: "visible" });
            }
            
            if (hobbyCards.length > 0) {
              gsap.set(hobbyCards, { opacity: 1, scale: 1, y: 0, visibility: "visible" });
            }
            
            // Title animation - faster
            if (hobbyTitle) {
              gsap.from(hobbyTitle, {
                scrollTrigger: {
                  trigger: hobbiesSectionRef.current,
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
            
            // Cards with simpler, faster animations
            hobbyCards.forEach((card, index) => {
              // Initial entrance animation - faster
              gsap.from(card, {
                scrollTrigger: {
                  trigger: card,
                  scroller: document.body,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                  once: true,
                },
                opacity: 0,
                scale: 0.8,
                y: 30,
                duration: 0.6,
                ease: "power2.out",
                delay: index * 0.1,
              });
            });
          }
          
          // Skills Section - Ensure visible first, then add animation
          if (skillsSectionRef.current) {
            const skillItems = skillsSectionRef.current.querySelectorAll(".skill-item");
            const skillTitle = skillsSectionRef.current.querySelector("h2");
            
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
        console.error("Error fetching projects:", projectsRes.statusText);
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
        console.error("Error fetching organizations:", orgsRes.statusText);
        // Set empty array to ensure section is still visible
        setOrganizations([]);
      }
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
      // Set empty array on error to ensure section is visible
      setOrganizations([]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section
          ref={heroRef}
          id="hero"
          className="relative min-h-screen flex items-center justify-center overflow-hidden pb-20"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
          <div className="absolute inset-0">
            <div className="hero-bg absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="hero-bg absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div ref={heroContentRef} className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-6 inline-block animate-float">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/20">
                  <Image
                    src="https://media.licdn.com/dms/image/v2/D5603AQGWAG8ZLiDaDg/profile-displayphoto-shrink_800_800/B56ZdsusstHoAc-/0/1749875871019?e=1767225600&v=beta&t=iX-N7nbInqbwlzwtguZabQsv4kXPKVWevdAAEP6BsFo"
                    alt="Joshua Ravael"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
              Joshua Ravael
            </h1>
            
            {/* Total Views */}
            <div className="mb-4 md:mb-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-sm sm:text-base md:text-lg font-medium">
                <span className="text-foreground font-bold">{totalViews.toLocaleString()}</span> Total Views
              </span>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-3 md:mb-4 flex items-center justify-center gap-2">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              <span className="text-center px-4">Institut Teknologi Sepuluh Nopember</span>
            </p>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Full Stack Developer yang passionate tentang teknologi dan programming
            </p>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a
                href="https://github.com/JoshuaRVLS"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-3 bg-card border border-border/50 rounded-full hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 shadow-sm hover:shadow-md"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a
                href="https://instagram.com/bknjos"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-3 bg-card border border-border rounded-full hover:bg-pink-500 hover:text-white transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a
                href="https://linkedin.com/in/joshua-ravael-a329b42a2"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-3 bg-card border border-border rounded-full hover:bg-blue-600 hover:text-white transition-all hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a
                href="mailto:joshua@example.com"
                className="p-2.5 sm:p-3 bg-card border border-border/50 rounded-full hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 shadow-sm hover:shadow-md"
                aria-label="Email"
              >
                <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 md:mb-16 px-4">
              <Link
                href="/blog"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm sm:text-base"
              >
                <span>Lihat Blog</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <a
                href="#projects"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-card border border-border/50 text-foreground rounded-lg font-semibold hover:bg-accent/50 transition-all shadow-sm hover:shadow-md text-sm sm:text-base text-center"
              >
                Lihat Projek
              </a>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce z-10">
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground rotate-90" />
            </div>
          </div>
        </section>

        {/* Gradient Transition Hero to Projects */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Projects Section */}
        <section ref={projectsSectionRef} id="projects" className="py-12 sm:py-16 md:py-20 overflow-hidden relative bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 ref={projectsTitleRef} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center px-4 text-gradient">Projek GitHub</h2>
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  {process.env.NEXT_PUBLIC_GITHUB_TOKEN
                    ? "Memuat projek..."
                    : "GitHub token belum dikonfigurasi. Lihat dokumentasi untuk setup."}
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Gradient Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
                
                {/* Infinite Scroll Container */}
                <div className="relative overflow-x-hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  <div
                    ref={scrollContainerRef}
                    className="flex gap-6"
                    style={{
                      width: "max-content",
                      userSelect: "none",
                      opacity: 1,
                    }}
                    onMouseEnter={() => {
                      if (tweenRef.current) {
                        tweenRef.current.timeScale(0.3); // Slow down to 30% speed
                      }
                    }}
                    onMouseLeave={() => {
                      if (tweenRef.current) {
                        tweenRef.current.timeScale(1); // Back to normal speed
                      }
                    }}
                  >
                    {/* Duplicate items untuk seamless loop */}
                    {[...projects, ...projects].map((project, index) => (
                    <div
                      key={`${project.id}-${index}`}
                      className="project-card flex-shrink-0 w-80 bg-card border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-xl card-hover group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <a
                          href={project.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </div>
                      {project.description && (
                        <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        {project.language && (
                          <div className="flex items-center gap-1">
                            <Code className="h-4 w-4" />
                            <span>{project.language}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          <span>{project.stargazers_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Github className="h-4 w-4" />
                          <span>{project.forks_count}</span>
                        </div>
                      </div>
                      {project.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.topics.slice(0, 3).map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}
            <div className="text-center mt-8">
              <a
                href="https://github.com/JoshuaRVLS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <span>Lihat Semua Projek di GitHub</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Gradient Transition Projects to Organizations */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Organizations Section - Always visible */}
        <section ref={organizationsSectionRef} id="organizations" className="py-12 sm:py-16 md:py-20 bg-background relative" style={{ opacity: 1 }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-gradient px-4">Organisasi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Default Organization - Always show */}
              <a
                href="https://www.linkedin.com/company/abinara-1"
                target="_blank"
                rel="noopener noreferrer"
                className="org-card bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:border-primary/50 hover:bg-card transition-all hover:shadow-xl card-hover text-center group opacity-100"
              >
                <Image
                  src="https://media.licdn.com/dms/image/v2/C560BAQEBqCtlGqtU2Q/company-logo_200_200/company-logo_200_200/0/1638160684744?e=2147483647&v=beta&t=xMwAxJxGACmsAT9zdQEy8NCyWYCPMOM-eFTX2za2f8s"
                  alt="ABINARA-1"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform object-cover"
                />
                <h3 className="text-sm sm:text-base font-bold mb-2 group-hover:text-primary transition-colors text-foreground">
                  ABINARA-1
                </h3>
              </a>
              
              {/* GitHub Organizations */}
              {organizations.length > 0 && organizations.map((org) => (
                <a
                  key={org.id}
                  href={org.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="org-card bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:border-primary/50 hover:bg-card transition-all hover:shadow-xl card-hover text-center group"
                >
                  <Image
                    src={org.avatar_url}
                    alt={org.login}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform"
                  />
                  <h3 className="text-sm sm:text-base font-bold mb-2 group-hover:text-primary transition-colors text-foreground">
                    {org.login}
                  </h3>
                  {org.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {org.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Gradient Transition Organizations to Hobbies */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Hobbies Section */}
        <section ref={hobbiesSectionRef} id="hobbies" className="py-16 sm:py-24 md:py-32 relative overflow-hidden bg-background" style={{ opacity: 1, visibility: "visible" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-12 md:mb-16 text-center text-gradient px-4">Hobi Saya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {/* Basketball Hobby */}
              <div className="hobby-card bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 md:p-8 hover:border-primary/50 transition-all group">
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-center group-hover:text-primary transition-colors">Basketball</h3>
                <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed">
                  Saya suka bermain basketball untuk menjaga kesehatan dan melatih teamwork. 
                  Olahraga ini membantu saya tetap aktif dan fokus dalam coding.
                </p>
                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Passion & Teamwork</span>
                </div>
              </div>
              
              {/* Coding Hobby */}
              <div className="hobby-card bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 md:p-8 hover:border-primary/50 transition-all group">
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Code className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-accent" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-center group-hover:text-primary transition-colors">Ngoding</h3>
                <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed">
                  Coding adalah passion utama saya. Saya senang membangun aplikasi web, 
                  memecahkan masalah kompleks, dan terus belajar teknologi terbaru.
                </p>
                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Innovation & Learning</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gradient Transition Hobbies to Skills */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* Skills Section */}
        <section ref={skillsSectionRef} id="skills" className="py-16 sm:py-24 md:py-32 pb-32 sm:pb-40 md:pb-48 relative overflow-visible bg-background" style={{ minHeight: "400px", opacity: 1, visibility: "visible" }}>
          <div className="skill-bg absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-20"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-12 md:mb-16 text-center text-gradient px-4">Skills & Technologies</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Frontend Skills */}
              <div className="skill-item bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4 md:p-6 text-center hover:border-primary/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Globe className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Frontend</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">React, Next.js, TypeScript</p>
              </div>
              
              <div className="skill-item bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4 md:p-6 text-center hover:border-primary/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                  <Server className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Backend</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Node.js, Express, Prisma</p>
              </div>
              
              <div className="skill-item bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4 md:p-6 text-center hover:border-primary/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Database className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Database</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">PostgreSQL, MongoDB</p>
              </div>
              
              <div className="skill-item bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4 md:p-6 text-center hover:border-primary/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                  <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Mobile</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">React Native</p>
              </div>
              
              {/* Specific Technologies */}
              <div className="skill-item bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4 md:p-6 text-center hover:border-primary/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Terminal className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">C++</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">System Programming</p>
              </div>
              
              <div className="skill-item bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4 md:p-6 text-center hover:border-primary/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Node.js</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Runtime Environment</p>
              </div>
              
              <div className="skill-item bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4 md:p-6 text-center hover:border-primary/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <Layers className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Full Stack</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">End-to-End Development</p>
              </div>
              
              <div className="skill-item bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3 sm:p-4 md:p-6 text-center hover:border-primary/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                  <Code className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">TypeScript</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Type Safety</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gradient Transition Skills to CTA */}
        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        {/* CTA Section */}
        <section ref={ctaSectionRef} className="py-12 sm:py-16 md:py-20 relative bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-6 sm:p-8 md:p-12 text-center shadow-xl backdrop-blur-sm">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Mari Berkolaborasi!</h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
                Tertarik untuk berkolaborasi atau punya pertanyaan? Jangan ragu untuk menghubungi saya!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <a
                  href="mailto:joshua@example.com"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Kirim Email</span>
                </a>
                <Link
                  href="/blog"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-card border border-border/50 text-foreground rounded-lg font-semibold hover:bg-accent/50 transition-all shadow-sm hover:shadow-md text-sm sm:text-base text-center"
                >
                  Lihat Blog
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
