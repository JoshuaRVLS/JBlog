"use client";

import { forwardRef, useRef, useEffect } from "react";
import Image from "next/image";
import ShimmerCard from "@/components/ShimmerCard";
import SectionTitle from "@/components/SectionTitle";
import { Code, ExternalLink, Sparkles, Github } from "lucide-react";

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

interface ProjectsSectionProps {
  projects: GitHubProject[];
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  tweenRef?: React.MutableRefObject<any>;
  projectsTitleRef?: React.RefObject<HTMLHeadingElement | null>;
}

const ProjectsSection = forwardRef<HTMLElement, ProjectsSectionProps>(
  ({ projects, scrollContainerRef, tweenRef, projectsTitleRef }, ref) => {
    return (
      <section ref={ref} id="projects" className="py-12 sm:py-16 md:py-20 overflow-hidden relative bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionTitle
            ref={projectsTitleRef}
            title="Projek GitHub"
            subtitle="Portfolio"
            icon={Code}
            align="center"
            className="px-4"
          />
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
                    if (tweenRef?.current) {
                      tweenRef.current.timeScale(0.3);
                    }
                  }}
                  onMouseLeave={() => {
                    if (tweenRef?.current) {
                      tweenRef.current.timeScale(1);
                    }
                  }}
                >
                  {/* Duplicate items untuk seamless loop */}
                  {[...projects, ...projects].map((project, index) => (
                    <ShimmerCard
                      key={`${project.id}-${index}`}
                      delay={index * 0.1}
                      className="project-card flex-shrink-0 w-80 p-6 card-hover group"
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
                    </ShimmerCard>
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
    );
  }
);

ProjectsSection.displayName = "ProjectsSection";

export default ProjectsSection;
