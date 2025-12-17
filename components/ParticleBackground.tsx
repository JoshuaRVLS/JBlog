"use client";

import { useEffect, useMemo, useState, memo } from "react";
import dynamic from "next/dynamic";
import type { Container, Engine } from "@tsparticles/engine";

const Particles = dynamic(() => import("@tsparticles/react").then((mod) => mod.Particles), {
  ssr: false,
  loading: () => null,
});

interface ParticleBackgroundProps {
  className?: string;
}

function ParticleBackground({ className = "" }: ParticleBackgroundProps) {
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

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: false,
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          repulse: {
            distance: 100,
            duration: 0.2,
          },
        },
      },
      particles: {
        color: {
          value: ["#3b82f6", "#8b5cf6", "#ec4899"],
        },
        links: {
          color: "#ffffff",
          distance: 120,
          enable: true,
          opacity: 0.15,
          width: 0.5,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: false,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: {
            enable: false,
          },
          value: 40,
        },
        opacity: {
          value: 0.5,
        },
        shape: {
          type: ["circle", "triangle"],
        },
        size: {
          value: { min: 1, max: 4 },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      options={options}
      className={className}
    />
  );
}

export default memo(ParticleBackground);

