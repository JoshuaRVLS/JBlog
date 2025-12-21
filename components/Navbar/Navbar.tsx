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
  submenu?: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export default function Navbar() {
  const { authenticated, logout, userId, loading, isSuspended } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [blogMenuOpen, setBlogMenuOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const hasAnimatedRef = useRef<boolean>(false);
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set());
  const lastFetchedUserIdRef = useRef<string | null>(null); // Track last fetched userId to prevent refetch
  const blogMenuRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    hasAnimatedRef.current = true;
    
    // Detect touch device
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".profile-dropdown")) {
        setProfileMenuOpen(false);
      }
      if (!target.closest(".blog-menu")) {
        setBlogMenuOpen(false);
      }
    };

    if (profileMenuOpen || blogMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [profileMenuOpen, blogMenuOpen]);


  const navItems: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    ...(isSuspended ? [] : [
      {
        name: "Blog",
        href: "/blog",
        icon: BookOpen,
        ...(authenticated && !isSuspended ? {
          submenu: [
            { name: "Blog", href: "/blog", icon: BookOpen },
          { name: "Feed", href: "/feed", icon: Rss },
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "Bookmarks", href: "/bookmarks", icon: BookmarkCheck },
          ]
        } : {})
      }
    ]),
    ...(authenticated && !isSuspended
      ? [
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
      // Check submenu items
      if (item.submenu) {
        item.submenu.forEach((subItem) => {
          const isSubActive = pathname === subItem.href || (subItem.href !== "/" && pathname?.startsWith(subItem.href));
          if (isSubActive) {
        newActiveLabels.add(item.name);
          }
        });
      }
    });
    setActiveLabels(newActiveLabels);
  }, [pathname, authenticated, user]);

  if (!mounted || loading) {
    return (
      <nav className="fixed top-0 z-[100] w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-sm pointer-events-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
          <div className="flex h-16 items-center justify-between pointer-events-auto">
            {/* Logo */}
            <Link href="/" className="pointer-events-auto" style={{ pointerEvents: 'auto' }}>
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
    <nav className="fixed top-0 z-[100] md:z-[100] w-full border-b border-border/60 bg-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-black/5 overflow-visible pointer-events-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 overflow-visible pointer-events-auto">
        <div className="flex h-20 items-center justify-between overflow-visible pointer-events-auto">
          {/* Logo - Modern Redesign */}
          <Link href="/" className="pointer-events-auto" style={{ pointerEvents: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative h-10 w-10 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 border border-border/60 shadow-md group-hover:shadow-lg transition-all duration-300">
                <Image
                  src="/jblog-logo.svg"
                  alt="jblog.space logo"
                  fill
                  sizes="40px"
                  className="object-contain p-1.5"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground terminal-glow tracking-tight leading-tight">
                jblog<span className="text-primary">.space</span>
              </span>
                <span className="text-[10px] text-muted-foreground/70 font-medium leading-tight -mt-0.5">
                  Modern Blogging
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation - Modern Redesign */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg shadow-black/5">
            {navItems.map((item: NavItem, index: number) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)) ||
                (item.submenu && item.submenu.some(sub => pathname === sub.href || (sub.href !== "/" && pathname?.startsWith(sub.href))));
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              
              return (
                <motion.div
                  key={item.name}
                  initial={hasAnimatedRef.current ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={hasAnimatedRef.current ? { duration: 0 } : { duration: 0.4, delay: index * 0.05 }}
                  className="relative group blog-menu"
                  ref={hasSubmenu ? blogMenuRef : null}
                  onMouseEnter={() => {
                    // Only use hover for desktop (non-touch devices)
                    if (hasSubmenu && !isTouchDevice) {
                      setBlogMenuOpen(true);
                    }
                  }}
                  onMouseLeave={() => {
                    // Only use hover for desktop (non-touch devices)
                    if (hasSubmenu && !isTouchDevice) {
                      setBlogMenuOpen(false);
                    }
                  }}
                >
                  <Tooltip content={item.name} delay={150}>
                      <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                      {hasSubmenu ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setBlogMenuOpen(!blogMenuOpen);
                          }}
                          onTouchStart={(e) => {
                            // For touch devices, toggle on touch
                            e.preventDefault();
                            e.stopPropagation();
                            setBlogMenuOpen(!blogMenuOpen);
                          }}
                          className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 pointer-events-auto group ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
                          }`}
                          style={{ pointerEvents: 'auto' }}
                        >
                          {/* Active indicator background */}
                          {isActive && (
                            <motion.div
                              layoutId="desktopActiveIndicator"
                              className="absolute inset-0 rounded-xl bg-primary"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          
                          {/* Icon */}
                          <motion.div
                            className="relative z-10"
                            animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${
                              isActive ? "text-primary-foreground" : "text-foreground/70 group-hover:text-foreground"
                            }`} />
                          </motion.div>
                          
                          {/* Label */}
                          <span className={`relative z-10 text-sm font-medium whitespace-nowrap transition-colors ${
                            isActive ? "text-primary-foreground" : "text-foreground/70 group-hover:text-foreground"
                          }`}>
                            {item.name}
                          </span>
                          
                          {/* Dropdown arrow */}
                          <motion.div
                            className="relative z-10"
                            animate={{ rotate: blogMenuOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.div>
                          
                          {/* Hover glow effect */}
                          {!isActive && (
                            <motion.div
                              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/10 to-transparent blur-sm"
                              initial={false}
                            />
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 pointer-events-auto group ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
                          }`}
                          style={{ pointerEvents: 'auto' }}
                        >
                          {/* Active indicator background */}
                          {isActive && (
                          <motion.div
                              layoutId="desktopActiveIndicator"
                              className="absolute inset-0 rounded-xl bg-primary"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          
                          {/* Icon */}
                          <motion.div
                            className="relative z-10"
                            animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${
                              isActive ? "text-primary-foreground" : "text-foreground/70 group-hover:text-foreground"
                            }`} />
                          </motion.div>
                          
                          {/* Label */}
                          <span className={`relative z-10 text-sm font-medium whitespace-nowrap transition-colors ${
                            isActive ? "text-primary-foreground" : "text-foreground/70 group-hover:text-foreground"
                          }`}>
                            {item.name}
                          </span>
                          
                          {/* Hover glow effect */}
                          {!isActive && (
                            <motion.div
                              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/10 to-transparent blur-sm"
                              initial={false}
                            />
                          )}
                        </Link>
                      )}
                      </motion.div>
                    </Tooltip>
                    
                  {/* Blog Submenu Dropdown */}
                  {hasSubmenu && (
                    <AnimatePresence>
                      {blogMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="absolute top-full left-0 mt-2 w-56 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-[60]"
                        >
                          {item.submenu?.map((subItem, subIndex) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = pathname === subItem.href || (subItem.href !== "/" && pathname?.startsWith(subItem.href));
                            
                            return (
                              <motion.div
                                key={subItem.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: subIndex * 0.03 }}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Link
                                  href={subItem.href}
                                  onClick={() => setBlogMenuOpen(false)}
                                  className={`flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-all group ${
                                    isSubActive ? "bg-primary/10 border-l-2 border-primary" : ""
                                  }`}
                        >
                                  <div className={`p-1.5 rounded-lg transition-colors ${
                                    isSubActive 
                                      ? "bg-primary/20" 
                                      : "bg-muted/50 group-hover:bg-primary/10"
                                  }`}>
                                    <SubIcon className={`h-4 w-4 transition-colors ${
                                      isSubActive 
                                        ? "text-primary" 
                                        : "text-muted-foreground group-hover:text-primary"
                                    }`} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-medium transition-colors ${
                                      isSubActive ? "text-primary" : "text-foreground group-hover:text-primary"
                                    }`}>
                                      {subItem.name}
                          </span>
                                  </div>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </motion.div>
              );
            })}
          </div>

             {/* Right Side - Auth, Theme Toggle & Mobile Menu */}
             <div className="flex items-center gap-2.5">
               {(authenticated || isSuspended) ? (
                 <>
                   {!isSuspended && (
                     <div className="hidden md:block">
                     <NotificationsDropdown />
                     </div>
                   )}
                   
                   {/* Profile Dropdown - Modern Redesign */}
                <div className="hidden md:block relative profile-dropdown">
                  <motion.button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 ${
                      profileMenuOpen 
                        ? "bg-accent shadow-md" 
                        : "hover:bg-accent/60"
                    }`}
                  >
                    {user?.profilePicture ? (
                      <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-2 ring-border/50 shadow-sm">
                        <Image
                          src={user.profilePicture}
                          alt={user.name || "Profile"}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-border/50 shadow-sm">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-foreground leading-tight">
                      {user?.name || "User"}
                    </span>
                      <span className="text-xs text-muted-foreground leading-tight">
                        Profile
                      </span>
                    </div>
                  </motion.button>

                  {/* Dropdown Menu - Modern Redesign */}
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute right-0 mt-2.5 w-56 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-[60]"
                      >
                        <motion.div
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          <Link
                            href={`/users/${userId}`}
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-all group"
                          >
                            <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                              <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">Profil Saya</span>
                              <span className="text-xs text-muted-foreground">View profile</span>
                            </div>
                          </Link>
                        </motion.div>
                        <motion.div
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          <Link
                            href="/profile/settings"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-all group"
                          >
                            <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                              <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">Pengaturan</span>
                              <span className="text-xs text-muted-foreground">Account settings</span>
                            </div>
                          </Link>
                        </motion.div>
                        {(user?.isAdmin || user?.isOwner) && (
                          <>
                            <div className="border-t border-border/50 my-1"></div>
                            <motion.div
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                            >
                              <Link
                                href="/admin"
                                onClick={() => setProfileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-all group"
                              >
                                <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                                  <Shield className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground">Admin Panel</span>
                                  <span className="text-xs text-muted-foreground">Manage system</span>
                                </div>
                              </Link>
                            </motion.div>
                          </>
                        )}
                        <div className="border-t border-border/50 my-1"></div>
                        <motion.div
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          <button
                            onClick={async () => {
                              setProfileMenuOpen(false);
                              await logout();
                              router.push("/");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-all group rounded-lg"
                          >
                            <div className="p-1.5 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                            <LogOut className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">Logout</span>
                              <span className="text-xs text-muted-foreground">Sign out</span>
                            </div>
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
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
              className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden z-[400] relative"
            >
              <div className="px-4 py-4 max-h-[calc(100vh-64px)] overflow-y-auto">
                {/* Main Navigation - Grid Layout */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {navItems.map((item: NavItem, index: number) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    
                    // For items with submenu, show the submenu items instead
                    if (hasSubmenu && item.submenu) {
                      return (
                        <React.Fragment key={item.name}>
                          {/* Main Blog item */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ 
                              duration: 0.3, 
                              delay: index * 0.05,
                              ease: [0.4, 0, 0.2, 1]
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="col-span-2"
                          >
                            <Link
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`group relative flex items-center gap-2.5 p-3 rounded-lg border transition-all duration-200 pointer-events-auto ${
                                isActive
                                  ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
                                  : "bg-card/50 border-border/50 text-foreground/70 hover:bg-accent/50 hover:border-primary/20 hover:text-primary hover:shadow-md"
                              }`}
                              style={{ pointerEvents: 'auto' }}
                            >
                              <div className={`relative z-10 p-1.5 rounded-md transition-all ${
                                isActive 
                                  ? "bg-primary/20" 
                                  : "bg-muted/50 group-hover:bg-primary/10"
                              }`}>
                                <Icon className={`h-4 w-4 transition-colors ${
                                  isActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
                                }`} />
                              </div>
                              <span className={`relative z-10 text-sm font-medium transition-colors ${
                                isActive ? "text-primary" : "text-foreground/70 group-hover:text-primary"
                              }`}>
                                {item.name}
                              </span>
                            </Link>
                          </motion.div>
                          
                          {/* Submenu items */}
                          {item.submenu.map((subItem, subIndex) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = pathname === subItem.href || (subItem.href !== "/" && pathname?.startsWith(subItem.href));
                            return (
                              <motion.div
                                key={subItem.name}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ 
                                  duration: 0.3, 
                                  delay: (index * 0.05) + ((subIndex + 1) * 0.03),
                                  ease: [0.4, 0, 0.2, 1]
                                }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Link
                                  href={subItem.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={`group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all duration-200 pointer-events-auto ${
                                    isSubActive
                                      ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
                                      : "bg-card/50 border-border/50 text-foreground/70 hover:bg-accent/50 hover:border-primary/20 hover:text-primary hover:shadow-md"
                                  }`}
                                  style={{ pointerEvents: 'auto' }}
                                >
                                  {/* Active indicator */}
                                  {isSubActive && (
                                    <motion.div
                                      layoutId="mobileActiveIndicator"
                                      className="absolute inset-0 rounded-xl bg-primary/5 border-2 border-primary/30"
                                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                  )}
                                  
                                  {/* Icon */}
                                  <div className={`relative z-10 p-1.5 rounded-md transition-all ${
                                    isSubActive 
                                      ? "bg-primary/20" 
                                      : "bg-muted/50 group-hover:bg-primary/10"
                                  }`}>
                                    <SubIcon className={`h-4 w-4 transition-colors ${
                                      isSubActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
                                    }`} />
                                  </div>
                                  
                                  {/* Label */}
                                  <span className={`relative z-10 text-xs font-medium text-center transition-colors ${
                                    isSubActive ? "text-primary" : "text-foreground/70 group-hover:text-primary"
                                  }`}>
                                    {subItem.name}
                                  </span>
                                  
                                  {/* Hover glow effect */}
                                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 to-transparent blur-xl" />
                                </Link>
                              </motion.div>
                            );
                          })}
                        </React.Fragment>
                      );
                    }
                    
                    // Regular items without submenu
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
                          className={`group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all duration-200 pointer-events-auto ${
                            isActive
                              ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
                              : "bg-card/50 border-border/50 text-foreground/70 hover:bg-accent/50 hover:border-primary/20 hover:text-primary hover:shadow-md"
                          }`}
                          style={{ pointerEvents: 'auto' }}
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
