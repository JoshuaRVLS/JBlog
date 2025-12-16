"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Terminal, Moon, Sun, Menu, X, LogOut, User, Settings, Home, BookOpen, LayoutDashboard, MessageCircle, Shield } from "lucide-react";
import Image from "next/image";
import { AuthContext } from "@/providers/AuthProvider";
import AxiosInstance from "@/utils/api";
import NotificationsDropdown from "../NotificationsDropdown";

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
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const hasAnimatedRef = useRef<boolean>(false);
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    // Set hasAnimated langsung saat mount untuk mencegah animasi reset
    hasAnimatedRef.current = true;
  }, []);

  useEffect(() => {
    // Fetch user data if authenticated or suspended (to show profile)
    if (userId && (authenticated || isSuspended) && !loading) {
      AxiosInstance.get(`/users/${userId}`)
        .then((res) => setUser(res.data))
        .catch(() => {});
    } else if (!authenticated && !isSuspended) {
      // Clear user data when not authenticated and not suspended
      setUser(null);
    }
  }, [userId, authenticated, isSuspended, loading]);

  // Close dropdown when clicking outside
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

  const toggleTheme = (): void => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    ...(isSuspended ? [] : [{ name: "Blog", href: "/blog", icon: BookOpen }]),
    ...(authenticated && !isSuspended
      ? [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "Group Chat", href: "/groupchat", icon: MessageCircle },
        ]
      : []),
    ...(user?.isAdmin || user?.isOwner
      ? [{ name: "Admin", href: "/admin", icon: Shield }]
      : []),
  ];

  // Track active labels untuk animasi yang smooth
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

  // Track active labels untuk animasi yang smooth
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

  // Wait for mount and auth loading to complete before rendering
  if (!mounted || loading) {
    return (
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Terminal className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground terminal-glow">
                  jblog.dev
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
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Terminal className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground terminal-glow">
                jblog.dev
              </span>
            </MotionDiv>
          </Link>

          {/* Desktop Navigation - Icon Only with Animated Label */}
          <div className="hidden md:flex items-center gap-3">
            {navItems.map((item: NavItem, index: number) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              const wasActive = activeLabels.has(item.name);
              const isNewlyActive = isActive && !wasActive;
              
              return (
                <MotionDiv
                  key={item.name}
                  initial={hasAnimatedRef.current ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={hasAnimatedRef.current ? { duration: 0 } : { duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="relative group"
                >
                  <div className="flex items-center">
                    <MotionDiv
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <Link
                        href={item.href}
                        className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 flex-shrink-0 active:scale-95 ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/60 hover:text-primary hover:bg-accent/50"
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                      </Link>
                    </MotionDiv>
                    
                    {/* Animated Label - Only show when active, slide from left to right */}
                    {isActive && (
                      <div className="ml-3 whitespace-nowrap flex-shrink-0">
                        <MotionDiv
                          key={`label-${item.name}`}
                          initial={isNewlyActive ? { opacity: 0, x: -30 } : { opacity: 1, x: 0 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={isNewlyActive ? { duration: 0.4, ease: "easeOut" } : { duration: 0 }}
                          className="inline-block"
                        >
                          <span className="inline-block px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium backdrop-blur-sm border border-primary/20 shadow-sm">
                            {item.name}
                          </span>
                        </MotionDiv>
                      </div>
                    )}
                  </div>
                </MotionDiv>
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
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                      <MotionDiv
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <Link
                          href={`/users/${userId}`}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-all active:scale-95"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Profil Saya</span>
                        </Link>
                      </MotionDiv>
                      <MotionDiv
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <Link
                          href="/profile/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-all active:scale-95"
                        >
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Pengaturan</span>
                        </Link>
                      </MotionDiv>
                      <div className="border-t border-border"></div>
                      <MotionDiv
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <button
                          onClick={async () => {
                            setProfileMenuOpen(false);
                            await logout();
                            router.push("/");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-all active:scale-95"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm">Logout</span>
                        </button>
                      </MotionDiv>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <MotionDiv
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all active:scale-95"
                >
                  Sign In
                </Link>
              </MotionDiv>
            )}
            {/* Theme Toggle Button */}
            <MotionDiv
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <button
                onClick={toggleTheme}
                className="relative h-10 w-10 rounded-lg bg-card hover:bg-accent border border-border flex items-center justify-center overflow-hidden transition-colors"
                aria-label="Toggle theme"
              >
                <MotionDiv
                  key={theme}
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                  className="absolute"
                >
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                </MotionDiv>
              </button>
            </MotionDiv>

            {/* Mobile Menu Button */}
            <MotionDiv
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
            </MotionDiv>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="py-4 space-y-2">
              {navItems.map((item: NavItem, index: number) => (
                <MotionDiv
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ x: 8 }}
                >
                  <MotionDiv
                    whileTap={{ scale: 0.97, x: 4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-md transition-all active:scale-95"
                    >
                      {item.name}
                    </Link>
                  </MotionDiv>
                </MotionDiv>
              ))}
              {authenticated ? (
                <>
                  <MotionDiv
                    whileTap={{ scale: 0.97, x: 4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <Link
                      href={`/users/${userId}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-md transition-all active:scale-95"
                    >
                      <User className="h-4 w-4" />
                      <span>Profil Saya</span>
                    </Link>
                  </MotionDiv>
                  <MotionDiv
                    whileTap={{ scale: 0.97, x: 4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <Link
                      href="/profile/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-md transition-all active:scale-95"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Pengaturan</span>
                    </Link>
                  </MotionDiv>
                  <MotionDiv
                    whileTap={{ scale: 0.97, x: 4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <button
                      onClick={async () => {
                        await logout();
                        setMobileMenuOpen(false);
                        router.push("/");
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-base font-medium text-foreground/80 hover:text-destructive hover:bg-accent/50 rounded-md transition-all active:scale-95"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </MotionDiv>
                </>
              ) : (
                <MotionDiv
                  whileTap={{ scale: 0.97, x: 4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-primary hover:bg-accent/50 rounded-md transition-all active:scale-95"
                  >
                    Sign In
                  </Link>
                </MotionDiv>
              )}
            </div>
          </MotionDiv>
        )}
      </div>
    </nav>
  );
}
