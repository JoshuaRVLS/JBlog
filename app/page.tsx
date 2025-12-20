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
import {
  Home as HomeIcon,
  Briefcase,
  Building2,
  Heart,
  Lightbulb,
  Globe2,
  Sparkles,
  Mail,
} from "lucide-react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import type { GitHubProject, GitHubOrg, ReportData, NavSection } from "./types";
import BroadcastBanner from "./components/BroadcastBanner";
import ReportBugModal from "./components/ReportBugModal";
import NavigationMenu from "./components/NavigationMenu";
import UpdatesSection from "./components/UpdatesSection";
import { useScrollTracking } from "./hooks/useScrollTracking";
import { useCountdown } from "./hooks/useCountdown";
import { useGSAPAnimations } from "./hooks/useGSAPAnimations";

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
  const [countdownFinished, setCountdownFinished] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<any>(null);

  // Refs for scroll animations
  const heroRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const projectsSectionRef = useRef<HTMLElement>(null);
  const projectsTitleRef = useRef<HTMLHeadingElement>(null);
  const organizationsSectionRef = useRef<HTMLElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);
  const hobbiesSectionRef = useRef<HTMLElement>(null);
  const skillsSectionRef = useRef<HTMLElement>(null);
  const updateLogsContainerRef = useRef<HTMLDivElement>(null);

  // Navigation menu state
  const [activeSection, setActiveSection] = useState<string>("hero");

  // Report Bug state
  const [showReportBug, setShowReportBug] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
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
      return lastPage.pagination?.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
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
        fetch(
          "https://api.github.com/users/JoshuaRVLS/repos?sort=updated&per_page=6&type=all",
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        ),
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

  // Navigation menu sections
  const navSections: NavSection[] = [
    { id: "hero", label: "Home", icon: HomeIcon },
    { id: "projects", label: "Projects", icon: Briefcase },
    { id: "organizations", label: "Organizations", icon: Building2 },
    { id: "hobbies", label: "Hobbies", icon: Heart },
    { id: "skills", label: "Skills", icon: Lightbulb },
    { id: "world", label: "World", icon: Globe2 },
    ...(updateLogs.length > 0
      ? [{ id: "updates", label: "Updates", icon: Sparkles }]
      : []),
    { id: "contact", label: "Contact", icon: Mail },
  ];

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 1024;
    const navbarHeight = 64;
    const bottomNavHeight = isMobile ? 80 : 0;
    const padding = 16;
    const totalOffset = navbarHeight + bottomNavHeight + padding;

    const elementTop =
      element.getBoundingClientRect().top + window.pageYOffset;
    const targetScroll = Math.max(0, elementTop - totalOffset);

    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });

    setTimeout(() => {
      setActiveSection(sectionId);
    }, 100);
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
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : null;

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
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.msg || "Gagal mengirim report");
    } finally {
      setSubmittingReport(false);
    }
  };

  // Use hooks
  useScrollTracking(setActiveSection, setShowBroadcast);
  const countdown = useCountdown(broadcast, setCountdownFinished);
  useGSAPAnimations({
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
  });

  // Auto-scroll mobile bottom nav
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(`mobile-nav-${activeSection}`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeSection]);

  // Infinite scroll animation for projects
  useEffect(() => {
    if (projects.length === 0 || !scrollContainerRef.current) return;

    let timeoutId: NodeJS.Timeout | undefined;
    let cleanupFn: (() => void) | undefined;

    loadGSAP().then(({ gsap }) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const cardWidth = 320;
      const gap = 24;
      const singleSetWidth = (cardWidth + gap) * projects.length;
      const duration = projects.length * 2;

      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }

      gsap.set(container, {
        x: 0,
        opacity: 1,
        clearProps: "opacity,transform",
      });

      timeoutId = setTimeout(() => {
        if (!scrollContainerRef.current) return;

        const animate = () => {
          if (!scrollContainerRef.current || !container) return;

          const startX = (gsap.getProperty(container, "x") as number) || 0;
          const endX = startX - singleSetWidth;

          tweenRef.current = gsap.to(container, {
            x: endX,
            duration,
            ease: "none",
            onComplete: () => {
              gsap.set(container, { x: 0 });
              animate();
            },
          });
        };

        animate();
      }, 500);

      cleanupFn = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (tweenRef.current) {
          tweenRef.current.kill();
          tweenRef.current = null;
        }
        if (scrollContainerRef.current) {
          gsap.set(scrollContainerRef.current, {
            x: 0,
            opacity: 1,
            clearProps: "opacity,transform",
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

      <NavigationMenu
        navSections={navSections}
        activeSection={activeSection}
        onScrollToSection={scrollToSection}
      />

      <ReportBugModal
        isOpen={showReportBug}
        reportData={reportData}
        submittingReport={submittingReport}
        onClose={() => setShowReportBug(false)}
        onSubmit={handleReportBugSubmit}
        onDataChange={setReportData}
      />

      <main className="pb-20 lg:pb-0">
        <BroadcastBanner
          broadcast={broadcast}
          showBroadcast={showBroadcast}
          countdown={countdown}
          countdownFinished={countdownFinished}
        />

        {/* Hero Section */}
        <HeroSection
          ref={heroRef}
          totalViews={totalViews}
          heroContentRef={heroContentRef}
        />

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
        <OrganizationsSection
          ref={organizationsSectionRef}
          organizations={organizations}
        />

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

        <UpdatesSection
          updateLogs={updateLogs}
          updateLogsContainerRef={updateLogsContainerRef}
          hasNextPage={hasNextPage || false}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />

        <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>

        <CTASection ref={ctaSectionRef} />
      </main>
    </div>
  );
}
