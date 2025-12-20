"use client";

import { forwardRef, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import MagneticButton from "@/components/MagneticButton";
import TextReveal from "@/components/TextReveal";
import GlowEffect from "@/components/GlowEffect";
import { Eye, GraduationCap, Github, Instagram, Linkedin, Mail, ArrowRight, Sparkles } from "lucide-react";

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
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

    return (
      <section
        ref={(node) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
          if (containerRef) containerRef.current = node;
        }}
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-0 pb-32 sm:pb-40"
      >
        {/* Enhanced Animated Gradient Background */}
        <div className="absolute inset-0 z-0">
          <AnimatedGradient className="absolute inset-0 opacity-40" />
          
          {/* Animated Background Blobs - More dynamic */}
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ willChange: "transform" }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            style={{ willChange: "transform" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.4, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ willChange: "transform" }}
          />

          {/* Floating particles effect */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.div
          ref={heroContentRef}
          style={{ y, opacity, scale }}
          className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 sm:pt-40 md:pt-48"
        >
          {/* Profile Picture with enhanced animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1,
            }}
            className="mb-6 sm:mb-8"
          >
            <GlowEffect className="inline-block">
              <div className="relative">
                {/* Animated rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-accent/30"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.5,
                    ease: "easeOut",
                  }}
                />
                
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.6, 0.4],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* Profile image */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/20 backdrop-blur-sm">
                  <Image
                    src="https://media.licdn.com/dms/image/v2/D5603AQGWAG8ZLiDaDg/profile-displayphoto-shrink_800_800/B56ZdsusstHoAc-/0/1749875871019?e=1767225600&v=beta&t=iX-N7nbInqbwlzwtguZabQsv4kXPKVWevdAAEP6BsFo"
                    alt="Joshua Ravael"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                    priority
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                </div>
              </div>
            </GlowEffect>
          </motion.div>

          {/* Name with enhanced gradient animation */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 md:mb-6 relative"
          >
            <motion.span
              className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
              animate={{
                backgroundPosition: ["0%", "200%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ backgroundPosition: "0%" }}
            >
              Joshua Ravael
            </motion.span>
            {/* Decorative sparkles */}
            <motion.div
              className="absolute -top-4 -right-4 sm:-right-8"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary/50" />
            </motion.div>
          </motion.h1>
          
          {/* Total Views with counter animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 sm:mb-4 md:mb-6 flex items-center justify-center gap-2 text-muted-foreground"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <Eye className="h-4 w-4 md:h-5 md:w-5" />
            </motion.div>
            <span className="text-sm sm:text-base md:text-lg font-medium">
              <motion.span
                className="text-foreground font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {totalViews.toLocaleString()}
              </motion.span>{" "}
              Total Views
            </span>
          </motion.div>

          {/* Education */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-2 sm:mb-3 md:mb-4 flex items-center justify-center gap-2"
          >
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
              className="inline-flex"
            >
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </motion.span>
            <span className="text-center px-4">Institut Teknologi Sepuluh Nopember</span>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-4 leading-relaxed"
          >
            Full Stack Developer yang passionate tentang teknologi dan programming
          </motion.div>

          {/* Social Links with staggered animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12"
          >
            {[
              { icon: Github, href: "https://github.com/JoshuaRVLS", label: "GitHub", color: "hover:bg-foreground hover:text-background" },
              { icon: Instagram, href: "https://instagram.com/bknjos", label: "Instagram", color: "hover:bg-pink-500 hover:text-white" },
              { icon: Linkedin, href: "https://linkedin.com/in/joshua-ravael-a329b42a2", label: "LinkedIn", color: "hover:bg-blue-600 hover:text-white" },
              { icon: Mail, href: "mailto:joshua@example.com", label: "Email", color: "hover:bg-primary hover:text-primary-foreground" },
            ].map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={social.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.85 + index * 0.05,
                }}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 sm:p-3 bg-card border border-border/50 rounded-full transition-all shadow-sm hover:shadow-md ${social.color}`}
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.a>
            ))}
          </motion.div>

          {/* CTA Buttons with enhanced animations */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 md:mb-16 px-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MagneticButton
                strength={0.3}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm sm:text-base relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                />
                <Link href="/blog" className="flex items-center gap-2 relative z-10">
                  <span>Lihat Blog</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </motion.div>
                </Link>
              </MagneticButton>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MagneticButton
                strength={0.3}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-card border-2 border-border/50 text-foreground rounded-lg font-semibold shadow-sm hover:shadow-md hover:border-primary/50 text-sm sm:text-base transition-all"
              >
                <a href="#projects">Lihat Projek</a>
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Enhanced Scroll Indicator */}
          <motion.div
            className="absolute -bottom-12 sm:-bottom-16 left-1/2 -translate-x-1/2 z-10"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="flex flex-col items-center gap-2 text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs font-medium">Scroll</span>
              <ArrowRight className="h-5 w-5 rotate-90" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";

export default HeroSection;
