"use client";

import { forwardRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import MagneticButton from "@/components/MagneticButton";
import TextReveal from "@/components/TextReveal";
import GlowEffect from "@/components/GlowEffect";
import { Eye, GraduationCap, Github, Instagram, Linkedin, Mail, ArrowRight } from "lucide-react";

const AnimatedGradient = dynamic(() => import("@/components/AnimatedGradient"), {
  ssr: false,
  loading: () => null,
});

interface HeroSectionProps {
  totalViews: number;
  heroContentRef?: React.RefObject<HTMLDivElement | null>;
}

const HeroSection = forwardRef<HTMLElement, HeroSectionProps>(
  ({ totalViews, heroContentRef }, ref) => {
    return (
      <section
        ref={ref}
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-0 pb-20"
      >
        {/* Animated Gradient Background */}
        <AnimatedGradient className="absolute inset-0 z-0" />

        {/* Animated Background Blobs */}
        <div className="absolute inset-0 z-0">
          <div className="hero-bg absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-2xl animate-pulse" style={{ willChange: "transform" }}></div>
          <div className="hero-bg absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-2xl animate-pulse delay-1000" style={{ willChange: "transform" }}></div>
        </div>

        <div ref={heroContentRef} className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 sm:pt-0">
          <TextReveal delay={0.2}>
            <GlowEffect className="mb-4 sm:mb-6 inline-block animate-float">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" style={{ willChange: "opacity" }}></div>
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
            </GlowEffect>
          </TextReveal>

          <TextReveal delay={0.4} direction="up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Joshua Ravael
            </h1>
          </TextReveal>
          
          {/* Total Views */}
          <TextReveal delay={0.6} direction="up">
            <div className="mb-3 sm:mb-4 md:mb-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-sm sm:text-base md:text-lg font-medium">
                <span className="text-foreground font-bold">{totalViews.toLocaleString()}</span> Total Views
              </span>
            </div>
          </TextReveal>

          <TextReveal delay={0.8} direction="up">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-2 sm:mb-3 md:mb-4 flex items-center justify-center gap-2">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              <span className="text-center px-4">Institut Teknologi Sepuluh Nopember</span>
            </p>
          </TextReveal>

          <TextReveal delay={1} direction="up">
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Full Stack Developer yang passionate tentang teknologi dan programming
            </p>
          </TextReveal>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12">
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
          <TextReveal delay={1.2} direction="up">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 md:mb-16 px-4">
              <MagneticButton
                strength={0.3}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm sm:text-base"
              >
                <Link href="/blog" className="flex items-center gap-2">
                  <span>Lihat Blog</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </MagneticButton>
              <MagneticButton
                strength={0.3}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-card border border-border/50 text-foreground rounded-lg font-semibold shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                <a href="#projects">Lihat Projek</a>
              </MagneticButton>
            </div>
          </TextReveal>

          {/* Scroll Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce z-10">
            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground rotate-90" />
          </div>
        </div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";

export default HeroSection;
