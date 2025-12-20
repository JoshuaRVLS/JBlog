"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const themes = [
  { name: "blue", label: "Blue", color: "oklch(0.55 0.18 240)" },
  { name: "green", label: "Green", color: "oklch(0.55 0.18 145)" },
  { name: "purple", label: "Purple", color: "oklch(0.55 0.18 300)" },
  { name: "orange", label: "Orange", color: "oklch(0.55 0.18 45)" },
  { name: "pink", label: "Pink", color: "oklch(0.55 0.18 350)" },
  { name: "red", label: "Red", color: "oklch(0.55 0.18 15)" },
];

export default function ThemeSelector() {
  const { theme: mode, setTheme: setMode, resolvedTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<string>("blue");
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved color theme from localStorage
    const savedColorTheme = localStorage.getItem("jblog-color-theme") || "blue";
    setColorTheme(savedColorTheme);
    // Apply theme class
    document.documentElement.classList.remove(...themes.map(t => `theme-${t.name}`));
    document.documentElement.classList.add(`theme-${savedColorTheme}`);
  }, []);

  const handleColorThemeChange = (themeName: string) => {
    setColorTheme(themeName);
    localStorage.setItem("jblog-color-theme", themeName);
    // Remove all theme classes and add new one
    const htmlElement = document.documentElement;
    themes.forEach(t => htmlElement.classList.remove(`theme-${t.name}`));
    htmlElement.classList.add(`theme-${themeName}`);
    setIsOpen(false);
  };

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Color Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative h-10 w-10 rounded-lg bg-card hover:bg-accent border border-border flex items-center justify-center overflow-hidden transition-all hover:scale-105"
            aria-label="Select color theme"
          >
            <Palette className="h-4 w-4 text-foreground" />
          </button>

          <AnimatePresence>
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-12 z-50 w-48 rounded-lg bg-popover border border-border shadow-lg p-2"
                >
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mb-1">
                    Color Theme
                  </div>
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => handleColorThemeChange(theme.name)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors group"
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 border-border"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span className="flex-1 text-sm text-left">{theme.label}</span>
                      {colorTheme === theme.name && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Dark/Light Mode Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMode}
          className="relative h-10 w-10 rounded-lg bg-card hover:bg-accent border border-border flex items-center justify-center overflow-hidden transition-colors"
          aria-label="Toggle theme"
        >
          <motion.div
            key={mode}
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4 text-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-foreground" />
            )}
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}

