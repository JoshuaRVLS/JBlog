"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Terminal, Moon, Sun, Menu, X, LogOut, User, Settings, Home, BookOpen, LayoutDashboard, MessageCircle, Shield, Rss, BookmarkCheck, MessageSquare } from "lucide-react";
import ThemeSelector from "../ThemeSelector";
import Image from "next/image";
import { AuthContext } from "@/providers/AuthProvider";
import AxiosInstance from "@/utils/api";
import NotificationsDropdown from "../NotificationsDropdown";
import Tooltip from "../Tooltip";
import { motion, AnimatePresence } from "motion/react";

interface MotionProps {
  children: React.ReactNode;
  initial?: {
    opacity?: number;
    x?: number;
    y?: number;
    rotate?: number;
    scale?: number;
  };
  animate?: {
    opacity?: number;
    x?: number;
    y?: number;
    rotate?: number;
    scale?: number;
  };
  transition?: {
    duration?: number;
    delay?: number;
    ease?: string;
  };
  whileHover?: {
    opacity?: number;
    x?: number;
    y?: number;
    rotate?: number;
    scale?: number;
  };
  whileTap?: {
    opacity?: number;
    x?: number;
    y?: number;
    rotate?: number;
    scale?: number;
  };
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

interface AnimationState {
  opacity?: number;
  x?: number;
  y?: number;
  rotate?: number;
  scale?: number;
}

// Framer Motion-style component
const MotionDiv: React.FC<MotionProps> = ({
  children,
  initial,
  animate,
  transition,
  whileHover,
  whileTap,
  className,
  style,
  onClick,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const getTransform = (props: AnimationState): string => {
      const transforms: string[] = [];
      if (props.rotate !== undefined)
        transforms.push(`rotate(${props.rotate}deg)`);
      if (props.scale !== undefined) transforms.push(`scale(${props.scale})`);
      if (props.x !== undefined) transforms.push(`translateX(${props.x}px)`);
      if (props.y !== undefined) transforms.push(`translateY(${props.y}px)`);
      return transforms.join(" ");
    };

    const applyStyles = (props: AnimationState): void => {
      if (props.opacity !== undefined) el.style.opacity = String(props.opacity);
      const transform = getTransform(props);
      if (transform) el.style.transform = transform;
    };

    if (initial) applyStyles(initial);

    if (animate) {
      const duration = transition?.duration || 0.3;
      const delay = transition?.delay || 0;
      el.style.transition = `all ${duration}s ${
        transition?.ease || "ease"
      } ${delay}s`;
      setTimeout(() => applyStyles(animate), 50);
    }

    const handleMouseEnter = (): void => {
      if (whileHover) {
        setIsHovered(true);
        el.style.transition = "all 0.2s ease";
        applyStyles(whileHover);
      }
    };

    const handleMouseLeave = (): void => {
      if (whileHover && animate) {
        setIsHovered(false);
        applyStyles(animate);
      }
    };

    const handleMouseDown = (): void => {
      if (whileTap) {
        el.style.transition = "all 0.1s ease";
        applyStyles(whileTap);
      }
    };

    const handleMouseUp = (): void => {
      if (whileTap) {
        if (isHovered && whileHover) {
          applyStyles(whileHover);
        } else if (animate) {
          applyStyles(animate);
        }
      }
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseup", handleMouseUp);
    };
  }, [initial, animate, transition, whileHover, whileTap, isHovered]);

  return (
    <div ref={ref} className={className} style={style} onClick={onClick}>
      {children}
    </div>
  );
};

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Navbar() {
  const { authenticated, logout, userId, loading, isSuspended } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const hasAnimatedRef = useRef<boolean>(false);
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set());
  const lastFetchedUserIdRef = useRef<string | null>(null); // Track last fetched userId to prevent refetch

  useEffect(() => {
    setMounted(true);
    hasAnimatedRef.current = true;
  }, []);

  // Load user data from cache first, then fetch if needed (only when userId changes)
  useEffect(() => {
    if (!userId || (!authenticated && !isSuspended) || loading) {
      if (!authenticated && !isSuspended) {
        setUser(null);
        lastFetchedUserIdRef.current = null;
      }
      return;
    }

    // Only fetch if userId changed (not on every page navigation)
    if (lastFetchedUserIdRef.current === userId) {
      // User already fetched for this userId, check cache
      const cachedUser = localStorage.getItem(`user_${userId}`);
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          if (!user || user.id !== parsedUser.id) {
            setUser(parsedUser);
          }
        } catch (e) {
          // Invalid cache, fetch fresh
        }
      }
      return; // Don't refetch if same userId
    }

    // Load from cache immediately (show cached data while fetching)
    const cachedUser = localStorage.getItem(`user_${userId}`);
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        setUser(parsedUser); // Show cached data immediately
      } catch (e) {
        // Invalid cache
        localStorage.removeItem(`user_${userId}`);
      }
    }

    // Fetch fresh data in background (update cache)
    lastFetchedUserIdRef.current = userId;
    AxiosInstance.get(`/users/${userId}`)
      .then((res) => {
        setUser(res.data);
        // Cache user data in localStorage
        localStorage.setItem(`user_${userId}`, JSON.stringify(res.data));
      })
      .catch(() => {
        // On error, allow retry on next userId change
        lastFetchedUserIdRef.current = null;
      });
  }, [userId, authenticated, isSuspended, loading]);

  // Listen for profile updates to invalidate cache
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (userId) {
        localStorage.removeItem(`user_${userId}`);
        lastFetchedUserIdRef.current = null; // Force refetch
        // Fetch fresh data
        AxiosInstance.get(`/users/${userId}`)
          .then((res) => {
            setUser(res.data);
            localStorage.setItem(`user_${userId}`, JSON.stringify(res.data));
            lastFetchedUserIdRef.current = userId;
          })
          .catch(() => {});
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".profile-dropdown")) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);


  const navItems: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    ...(isSuspended ? [] : [{ name: "Blog", href: "/blog", icon: BookOpen }]),
    ...(authenticated && !isSuspended
      ? [
          { name: "Feed", href: "/feed", icon: Rss },
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "Bookmarks", href: "/bookmarks", icon: BookmarkCheck },
          { name: "Messages", href: "/messages", icon: MessageSquare },
          { name: "Group Chat", href: "/groupchat", icon: MessageCircle },
        ]
      : []),
  ];

  useEffect(() => {
    const newActiveLabels = new Set<string>();
    navItems.forEach((item) => {
      const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
      if (isActive) {
        newActiveLabels.add(item.name);
      }
    });
    setActiveLabels(newActiveLabels);
  }, [pathname, authenticated, user]);

  useEffect(() => {
    const newActiveLabels = new Set<string>();
    navItems.forEach((item) => {
      const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
      if (isActive) {
        newActiveLabels.add(item.name);
      }
    });
    setActiveLabels(newActiveLabels);
  }, [pathname, authenticated, user]);

  if (!mounted || loading) {
    return (
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Terminal className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground terminal-glow tracking-tight">
                  jblog<span className="text-primary">.space</span>
                </span>
              </div>
            </Link>
            {/* Loading state - minimal navbar */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-sm overflow-visible">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <div className="flex h-16 items-center justify-between overflow-visible">
          {/* Logo */}
          <Link href="/">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="relative h-8 w-8 rounded-xl overflow-hidden bg-card border border-border/60 shadow-sm">
                <Image
                  src="/jblog-logo.svg"
                  alt="jblog.space logo"
                  fill
                  sizes="32px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold text-foreground terminal-glow tracking-tight">
                jblog<span className="text-primary">.space</span>
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation - Icon Only with Animated Label */}
          <div className="hidden md:flex items-center gap-3">
            {navItems.map((item: NavItem, index: number) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              
              return (
                <motion.div
                  key={item.name}
                  initial={hasAnimatedRef.current ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={hasAnimatedRef.current ? { duration: 0 } : { duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <div className="flex items-center">
                    <Tooltip content={item.name} delay={200}>
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <Link
                          href={item.href}
                          className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 flex-shrink-0 ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground/60 hover:text-primary hover:bg-accent/50"
                          }`}
                        >
                          <motion.div
                            animate={isActive ? { scale: 1.1, rotate: 0 } : { scale: 1, rotate: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                          </motion.div>
                        </Link>
                      </motion.div>
                    </Tooltip>
                    
                    {/* Animated Label - Only show when active, slide from left to right */}
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.div
                          key={`label-${item.name}-${pathname}`}
                          initial={{ opacity: 0, x: -20, width: 0 }}
                          animate={{ opacity: 1, x: 0, width: "auto" }}
                          exit={{ opacity: 0, x: -20, width: 0 }}
                          transition={{ 
                            duration: 0.3, 
                            ease: [0.4, 0, 0.2, 1],
                            opacity: { duration: 0.2 }
                          }}
                          className="ml-3 whitespace-nowrap overflow-hidden flex-shrink-0"
                        >
                          <span className="inline-block px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium backdrop-blur-sm border border-primary/20 shadow-sm">
                            {item.name}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

             {/* Right Side - Auth, Theme Toggle & Mobile Menu */}
             <div className="flex items-center gap-3">
               {(authenticated || isSuspended) ? (
                 <>
                   {!isSuspended && (
                     <NotificationsDropdown />
                   )}
                   
                   {/* Profile Dropdown */}
                <div className="hidden md:block relative profile-dropdown">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    {user?.profilePicture ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={user.profilePicture}
                          alt={user.name || "Profile"}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground/80">
                      {user?.name || "User"}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-[60]"
                      >
                        <motion.div
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          <Link
                            href={`/users/${userId}`}
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-all"
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Profil Saya</span>
                          </Link>
                        </motion.div>
                        <motion.div
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          <Link
                            href="/profile/settings"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-all"
                          >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Pengaturan</span>
                          </Link>
                        </motion.div>
                        {(user?.isAdmin || user?.isOwner) && (
                          <>
                            <div className="border-t border-border"></div>
                            <motion.div
                              whileTap={{ scale: 0.97 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                            >
                              <Link
                                href="/admin"
                                onClick={() => setProfileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-all"
                              >
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Admin Panel</span>
                              </Link>
                            </motion.div>
                          </>
                        )}
                        <div className="border-t border-border"></div>
                        <motion.div
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          <button
                            onClick={async () => {
                              setProfileMenuOpen(false);
                              await logout();
                              router.push("/");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-all"
                          >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm">Logout</span>
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-all active:scale-95 shadow-sm"
                >
                  <span>Login</span>
                </Link>
              </motion.div>
            )}
            {/* Theme Selector */}
            <ThemeSelector />

            {/* Mobile Menu Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="md:hidden"
            >
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 rounded-lg bg-card hover:bg-accent border border-border flex items-center justify-center transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-foreground" />
                )}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-4 max-h-[calc(100vh-64px)] overflow-y-auto">
                {/* Main Navigation - Grid Layout */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {navItems.map((item: NavItem, index: number) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.05,
                          ease: [0.4, 0, 0.2, 1]
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all duration-200 ${
                            isActive
                              ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
                              : "bg-card/50 border-border/50 text-foreground/70 hover:bg-accent/50 hover:border-primary/20 hover:text-primary hover:shadow-md"
                          }`}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="mobileActiveIndicator"
                              className="absolute inset-0 rounded-xl bg-primary/5 border-2 border-primary/30"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          
                          {/* Icon */}
                          <div className={`relative z-10 p-1.5 rounded-md transition-all ${
                            isActive 
                              ? "bg-primary/20" 
                              : "bg-muted/50 group-hover:bg-primary/10"
                          }`}>
                            <Icon className={`h-4 w-4 transition-colors ${
                              isActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
                            }`} />
                          </div>
                          
                          {/* Label */}
                          <span className={`relative z-10 text-xs font-medium text-center transition-colors ${
                            isActive ? "text-primary" : "text-foreground/70 group-hover:text-primary"
                          }`}>
                            {item.name}
                          </span>
                          
                          {/* Hover glow effect */}
                          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 to-transparent blur-xl" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Divider */}
                {authenticated && (
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 text-xs font-medium text-muted-foreground bg-background">
                        Account
                      </span>
                    </div>
                  </div>
                )}

                {/* Account Actions */}
                {authenticated ? (
                  <div className="space-y-1.5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: navItems.length * 0.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link
                        href={`/users/${userId}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card/50 border border-border/50 text-foreground/80 hover:text-primary hover:bg-accent/50 hover:border-primary/20 transition-all group"
                      >
                        <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
                          <User className="h-4 w-4 text-foreground/60 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-sm font-medium">Profil Saya</span>
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: (navItems.length + 1) * 0.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link
                        href="/profile/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card/50 border border-border/50 text-foreground/80 hover:text-primary hover:bg-accent/50 hover:border-primary/20 transition-all group"
                      >
                        <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
                          <Settings className="h-4 w-4 text-foreground/60 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-sm font-medium">Pengaturan</span>
                      </Link>
                    </motion.div>
                    {(user?.isAdmin || user?.isOwner) && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: (navItems.length + 2) * 0.05 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card/50 border border-border/50 text-foreground/80 hover:text-primary hover:bg-accent/50 hover:border-primary/20 transition-all group"
                        >
                          <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
                            <Shield className="h-4 w-4 text-foreground/60 group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-sm font-medium">Admin Panel</span>
                        </Link>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: (navItems.length + (user?.isAdmin || user?.isOwner ? 3 : 2)) * 0.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <button
                        onClick={async () => {
                          await logout();
                          setMobileMenuOpen(false);
                          router.push("/");
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-card/50 border border-border/50 text-foreground/80 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all group"
                      >
                        <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-destructive/10 transition-colors">
                          <LogOut className="h-4 w-4 text-foreground/60 group-hover:text-destructive transition-colors" />
                        </div>
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: navItems.length * 0.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                      <span>Sign In</span>
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
