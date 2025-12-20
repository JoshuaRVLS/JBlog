import { motion } from "motion/react";
import type { NavSection } from "../types";

interface NavigationMenuProps {
  navSections: NavSection[];
  activeSection: string;
  onScrollToSection: (sectionId: string) => void;
}

export default function NavigationMenu({
  navSections,
  activeSection,
  onScrollToSection,
}: NavigationMenuProps) {
  return (
    <>
      {/* Desktop Side Navigation */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
        <nav className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-2 shadow-xl">
          <ul className="flex flex-col gap-2">
            {navSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => onScrollToSection(section.id)}
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
                    <span
                      className={`text-sm font-medium whitespace-nowrap ${
                        isActive ? "text-primary" : ""
                      }`}
                    >
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
                  onClick={() => onScrollToSection(section.id)}
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
                  <div
                    className={`relative z-10 p-1.5 rounded-lg transition-colors ${
                      isActive ? "bg-primary/10" : ""
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`font-medium transition-colors whitespace-nowrap ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {section.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

