"use client";

import { Suspense, useRef, useState, useEffect, ErrorInfo, ReactNode } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface Robot3DViewerProps {
  modelUrl: string;
  className?: string;
}

const Robot3DViewer = dynamic(
  async () => {
    const React = await import("react");
    const [r3f, drei, three] = await Promise.all([
      import("@react-three/fiber"),
      import("@react-three/drei"),
      import("three"),
    ]);
    
    const { Canvas } = r3f;
    const { OrbitControls, useGLTF } = drei;
    const { Box3, Vector3 } = three;

    class ErrorBoundary extends React.Component<
      { children: ReactNode },
      { hasError: boolean; error?: Error }
    > {
      constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("3D Model Error:", error?.message || error, errorInfo);
      }

      render() {
        if (this.state.hasError) {
          return (
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
          );
        }
        return this.props.children;
      }
    }

    function RobotModel({ url }: { url: string }) {
      const modelRef = useRef<any>(null);
      
      let gltf;
      try {
        gltf = useGLTF(url);
      } catch (error) {
        throw error;
      }

      if (!gltf || !gltf.scene) {
        return null;
      }

      // Auto-scale dan center model
      useEffect(() => {
        if (gltf.scene) {
          const box = new Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new Vector3());
          const size = box.getSize(new Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.2 / maxDim; // Scale agar model pas di viewport
          
          // Reset scale dulu
          gltf.scene.scale.setScalar(1);
          // Apply new scale
          gltf.scene.scale.setScalar(scale);
          // Center model
          gltf.scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        }
      }, [gltf]);

      return (
        <primitive
          ref={modelRef}
          object={gltf.scene}
        />
      );
    }

    function Viewer({ modelUrl, className = "" }: Robot3DViewerProps) {
      const [mounted, setMounted] = useState(false);

      useEffect(() => {
        setMounted(true);
      }, []);

      if (!mounted) {
        return (
          <div className={`w-full h-96 bg-gradient-to-br from-card/50 to-accent/20 rounded-lg border border-border flex items-center justify-center ${className}`}>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }

      return (
        <div className={`w-full h-96 bg-gradient-to-br from-card/50 to-accent/20 rounded-lg border border-border overflow-hidden ${className}`}>
          <Canvas
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
            camera={{ position: [3, 2, 5], fov: 50 }}
          >
            <Suspense
              fallback={
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="orange" />
                </mesh>
              }
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <pointLight position={[-10, -10, -5]} intensity={0.5} />
              <ErrorBoundary>
                <RobotModel url={modelUrl} />
              </ErrorBoundary>
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={2}
                maxDistance={15}
                autoRotate={false}
                target={[0, 0, 0]}
              />
            </Suspense>
          </Canvas>
        </div>
      );
    }

    return Viewer;
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gradient-to-br from-card/50 to-accent/20 rounded-lg border border-border flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

export default Robot3DViewer;

