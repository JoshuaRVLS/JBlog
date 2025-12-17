"use client";

import { forwardRef } from "react";
import ShimmerCard from "@/components/ShimmerCard";
import SectionTitle from "@/components/SectionTitle";
import { Heart, Target, Code, Sparkles } from "lucide-react";

interface HobbiesSectionProps {
  // No props needed for now, but keeping for future extensibility
}

const HobbiesSection = forwardRef<HTMLElement, HobbiesSectionProps>(
  (props, ref) => {
    return (
      <section ref={ref} id="hobbies" className="py-16 sm:py-24 md:py-32 relative overflow-hidden bg-background" style={{ opacity: 1, visibility: "visible" }}>
        <div className="hobby-bg-gradient absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionTitle
            title="Hobi Saya"
            subtitle="Passions"
            icon={Heart}
            align="center"
            className="px-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Basketball Hobby */}
            <ShimmerCard delay={0} className="hobby-card p-4 sm:p-6 md:p-8 group cursor-pointer">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" style={{ willChange: "opacity" }}></div>
                  <div className="hobby-icon relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-primary/10 rounded-full flex items-center justify-center">
                    <Target className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-center group-hover:text-primary transition-colors">Basketball</h3>
              <p className="hobby-text text-sm sm:text-base text-muted-foreground text-center leading-relaxed">
                Saya suka bermain basketball untuk menjaga kesehatan dan melatih teamwork. 
                Olahraga ini membantu saya tetap aktif dan fokus dalam coding.
              </p>
              <div className="hobby-sparkle mt-4 sm:mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Passion & Teamwork</span>
              </div>
            </ShimmerCard>
            
            {/* Coding Hobby */}
            <ShimmerCard delay={0.2} className="hobby-card p-4 sm:p-6 md:p-8 group cursor-pointer">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" style={{ willChange: "opacity" }}></div>
                  <div className="hobby-icon relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-accent/10 rounded-full flex items-center justify-center">
                    <Code className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-accent" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-center group-hover:text-primary transition-colors">Ngoding</h3>
              <p className="hobby-text text-sm sm:text-base text-muted-foreground text-center leading-relaxed">
                Coding adalah passion utama saya. Saya senang membangun aplikasi web, 
                memecahkan masalah kompleks, dan terus belajar teknologi terbaru.
              </p>
              <div className="hobby-sparkle mt-4 sm:mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Innovation & Learning</span>
              </div>
            </ShimmerCard>
          </div>
        </div>
      </section>
    );
  }
);

HobbiesSection.displayName = "HobbiesSection";

export default HobbiesSection;
