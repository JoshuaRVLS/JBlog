"use client";

import { useEffect, useMemo, useState, memo } from "react";
import dynamic from "next/dynamic";
import type { Container, Engine } from "@tsparticles/engine";

const Particles = dynamic(() => import("@tsparticles/react").then((mod) => mod.Particles), {
  ssr: false,
  loading: () => null,
});

interface BroadcastParticlesProps {
  effect: string; // "none", "snow", "confetti", "stars", "hearts", "fireworks", "sparkles"
  className?: string;
}

function BroadcastParticles({ effect, className = "" }: BroadcastParticlesProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    import("@tsparticles/react").then(({ initParticlesEngine }) => {
      import("@tsparticles/slim").then(({ loadSlim }) => {
        if (!mounted) return;
        initParticlesEngine(async (engine: Engine) => {
          await loadSlim(engine);
        }).then(() => {
          if (mounted) setInit(true);
        });
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    // Particles loaded
  };

  const getParticleOptions = (effectType: string) => {
    const baseOptions = {
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      detectRetina: true,
    };

    switch (effectType) {
      case "snow":
        return {
          ...baseOptions,
          particles: {
            color: {
              value: "#ffffff",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.8,
            },
            size: {
              value: { min: 2, max: 5 },
            },
            move: {
              direction: "bottom" as const,
              enable: true,
              outModes: {
                default: "out" as const,
              },
              speed: { min: 1, max: 3 },
              gravity: {
                enable: true,
                acceleration: 0.5,
              },
            },
            number: {
              density: {
                enable: false,
              },
              value: 50,
            },
          },
        };

      case "confetti":
        return {
          ...baseOptions,
          particles: {
            color: {
              value: ["#f59e0b", "#ec4899", "#3b82f6", "#10b981", "#8b5cf6", "#fbbf24"],
            },
            shape: {
              type: ["circle", "square", "triangle"],
            },
            opacity: {
              value: 0.9,
            },
            size: {
              value: { min: 3, max: 8 },
            },
            move: {
              direction: "bottom" as const,
              enable: true,
              outModes: {
                default: "out" as const,
              },
              speed: { min: 2, max: 5 },
              gravity: {
                enable: true,
                acceleration: 0.8,
              },
              rotate: {
                value: { min: 0, max: 360 },
                animation: {
                  enable: true,
                  speed: 5,
                },
              },
            },
            number: {
              density: {
                enable: false,
              },
              value: 80,
            },
          },
        };

      case "stars":
        return {
          ...baseOptions,
          particles: {
            color: {
              value: "#fbbf24",
            },
            shape: {
              type: ["circle", "triangle"],
            },
            opacity: {
              value: { min: 0.3, max: 0.9 },
              animation: {
                enable: true,
                speed: 1,
                sync: false,
              },
            },
            size: {
              value: { min: 1, max: 4 },
            },
            move: {
              direction: "none" as const,
              enable: true,
              outModes: {
                default: "out" as const,
              },
              speed: 0.3,
            },
            number: {
              density: {
                enable: false,
              },
              value: 100,
            },
          },
        };

      case "hearts":
        return {
          ...baseOptions,
          particles: {
            color: {
              value: "#ec4899",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: { min: 0.4, max: 0.8 },
            },
            size: {
              value: { min: 4, max: 8 },
            },
            move: {
              direction: "bottom" as const,
              enable: true,
              outModes: {
                default: "out" as const,
              },
              speed: { min: 1, max: 2 },
              gravity: {
                enable: true,
                acceleration: 0.3,
              },
            },
            number: {
              density: {
                enable: false,
              },
              value: 30,
            },
          },
        };

      case "fireworks":
        return {
          ...baseOptions,
          particles: {
            color: {
              value: ["#f59e0b", "#ec4899", "#3b82f6", "#10b981", "#8b5cf6"],
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.9,
            },
            size: {
              value: { min: 2, max: 6 },
            },
            move: {
              direction: "none" as const,
              enable: true,
              outModes: {
                default: "out" as const,
              },
              speed: { min: 1, max: 4 },
              gravity: {
                enable: true,
                acceleration: 0.5,
              },
            },
            number: {
              density: {
                enable: false,
              },
              value: 60,
            },
          },
        };

      case "sparkles":
        return {
          ...baseOptions,
          particles: {
            color: {
              value: ["#fbbf24", "#f59e0b", "#ffffff"],
            },
            shape: {
              type: ["circle", "triangle"],
            },
            opacity: {
              value: { min: 0.5, max: 1 },
              animation: {
                enable: true,
                speed: 2,
                sync: false,
              },
            },
            size: {
              value: { min: 1, max: 3 },
            },
            move: {
              direction: "none" as const,
              enable: true,
              outModes: {
                default: "out" as const,
              },
              speed: 0.5,
            },
            number: {
              density: {
                enable: false,
              },
              value: 80,
            },
          },
        };

      default:
        return null;
    }
  };

  const options = useMemo(() => getParticleOptions(effect), [effect]);

  if (!init || effect === "none" || !options) return null;

  return (
    <Particles
      id={`broadcast-particles-${effect}`}
      particlesLoaded={particlesLoaded}
      options={options}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
}

export default memo(BroadcastParticles);

