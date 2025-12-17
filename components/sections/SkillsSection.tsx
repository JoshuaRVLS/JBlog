"use client";

import { forwardRef } from "react";
import ShimmerCard from "@/components/ShimmerCard";
import SectionTitle from "@/components/SectionTitle";
import { Award, Globe, Server, Database, Smartphone, Terminal, Zap, Layers, Code as CodeIcon } from "lucide-react";

interface SkillsSectionProps {
}

const SkillsSection = forwardRef<HTMLElement, SkillsSectionProps>(
  (props, ref) => {
    return (
      <section ref={ref} id="skills" className="py-16 sm:py-24 md:py-32 pb-32 sm:pb-40 md:pb-48 relative overflow-visible bg-background" style={{ minHeight: "400px", opacity: 1, visibility: "visible" }}>
        <div className="skill-bg absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-20"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionTitle
            title="Skills & Technologies"
            subtitle="Expertise"
            icon={Award}
            align="center"
            className="px-4"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Frontend Skills */}
            <ShimmerCard delay={0} className="skill-item p-3 sm:p-4 md:p-6 text-center group cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <Globe className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Frontend</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">React, Next.js, TypeScript</p>
            </ShimmerCard>
            
            <ShimmerCard delay={0.1} className="skill-item p-3 sm:p-4 md:p-6 text-center group cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                <Server className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Backend</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Node.js, Express, Prisma</p>
            </ShimmerCard>
            
            <ShimmerCard delay={0.2} className="skill-item p-3 sm:p-4 md:p-6 text-center group cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <Database className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Database</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">PostgreSQL, MongoDB</p>
            </ShimmerCard>
            
            <ShimmerCard delay={0.3} className="skill-item p-3 sm:p-4 md:p-6 text-center group cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Mobile</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">React Native</p>
            </ShimmerCard>
            
            {/* Specific Technologies */}
            <ShimmerCard delay={0.4} className="skill-item p-3 sm:p-4 md:p-6 text-center group cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <Terminal className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">C++</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">System Programming</p>
            </ShimmerCard>
            
            <ShimmerCard delay={0.5} className="skill-item p-3 sm:p-4 md:p-6 text-center group cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                <Zap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Node.js</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Runtime Environment</p>
            </ShimmerCard>
            
            <ShimmerCard delay={0.6} className="skill-item p-3 sm:p-4 md:p-6 text-center group cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <Layers className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">Full Stack</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">End-to-End Development</p>
            </ShimmerCard>
            
            <ShimmerCard delay={0.7} className="skill-item p-3 sm:p-4 md:p-6 text-center group cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                <CodeIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">TypeScript</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Type Safety</p>
            </ShimmerCard>
          </div>
        </div>
      </section>
    );
  }
);

SkillsSection.displayName = "SkillsSection";

export default SkillsSection;
