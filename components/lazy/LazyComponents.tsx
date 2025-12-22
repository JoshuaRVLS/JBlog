/**
 * Lazy loaded components for better performance
 * These components are only loaded when needed
 */

import dynamic from "next/dynamic";

// Lazy load heavy 3D components
export const LazyRobot3DViewer = dynamic(() => import("@/components/Robot3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gradient-to-br from-card/50 to-accent/20 rounded-lg border border-border flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading 3D model...</div>
    </div>
  ),
});

// Lazy load particle effects
export const LazyParticleBackground = dynamic(() => import("@/components/ParticleBackground"), {
  ssr: false,
});

export const LazyBroadcastParticles = dynamic(() => import("@/components/BroadcastParticles"), {
  ssr: false,
});

// Lazy load heavy chart components
export const LazyUsersWorldChart = dynamic(() => import("@/components/UsersWorldChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted/30 rounded-lg flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading chart...</div>
    </div>
  ),
});

export const LazyActivityChart = dynamic(() => import("@/components/ActivityChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted/30 rounded-lg flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading chart...</div>
    </div>
  ),
});

// Lazy load markdown editor (heavy)
export const LazyMDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted/30 rounded-lg flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading editor...</div>
    </div>
  ),
});

