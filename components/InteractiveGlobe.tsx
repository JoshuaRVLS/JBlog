"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";
import { useInView } from "react-intersection-observer";

interface LocationData {
  country: string;
  count: number;
}

interface InteractiveGlobeProps {
  className?: string;
}

const countryCoordinates: Record<string, [number, number]> = {
  Indonesia: [-2.5489, 118.0149],
  "United States": [37.0902, -95.7129],
  "United Kingdom": [55.3781, -3.4360],
  India: [20.5937, 78.9629],
  China: [35.8617, 104.1954],
  Japan: [36.2048, 138.2529],
  Germany: [51.1657, 10.4515],
  France: [46.2276, 2.2137],
  Canada: [56.1304, -106.3468],
  Australia: [-25.2744, 133.7751],
  Brazil: [-14.2350, -51.9253],
  Russia: [61.5240, 105.3188],
  "South Korea": [35.9078, 127.7669],
  Mexico: [23.6345, -102.5528],
  Spain: [40.4637, -3.7492],
  Italy: [41.8719, 12.5674],
  Netherlands: [52.1326, 5.2913],
  Singapore: [1.3521, 103.8198],
  Malaysia: [4.2105, 101.9758],
  Thailand: [15.8700, 100.9925],
  Philippines: [12.8797, 121.7740],
  Vietnam: [14.0583, 108.2772],
  "Saudi Arabia": [23.8859, 45.0792],
  "United Arab Emirates": [23.4241, 53.8478],
  Turkey: [38.9637, 35.2433],
  Egypt: [26.8206, 30.8025],
  "South Africa": [-30.5595, 22.9375],
  Argentina: [-38.4161, -63.6167],
  Chile: [-35.6751, -71.5430],
  Poland: [51.9194, 19.1451],
  Sweden: [60.1282, 18.6435],
  Norway: [60.4720, 8.4689],
  Denmark: [56.2639, 9.5018],
  Finland: [61.9241, 25.7482],
  Belgium: [50.5039, 4.4699],
  Switzerland: [46.8182, 8.2275],
  Austria: [47.5162, 14.5501],
  Portugal: [39.3999, -8.2245],
  Greece: [39.0742, 21.8243],
  Ireland: [53.4129, -8.2439],
  "New Zealand": [-40.9006, 174.8860],
  Israel: [31.0461, 34.8516],
  Pakistan: [30.3753, 69.3451],
  Bangladesh: [23.6850, 90.3563],
  Nigeria: [9.0820, 8.6753],
  Kenya: [-0.0236, 37.9062],
  Colombia: [4.5709, -74.2973],
  Peru: [-9.1900, -75.0152],
  Venezuela: [6.4238, -66.5897],
  Ukraine: [48.3794, 31.1656],
  Czechia: [49.8175, 15.4730],
  Romania: [45.9432, 24.9668],
  Hungary: [47.1625, 19.5033],
  Croatia: [45.1000, 15.2000],
  Bulgaria: [42.7339, 25.4858],
  Serbia: [44.0165, 21.0059],
  "Sri Lanka": [7.8731, 80.7718],
  Nepal: [28.3949, 84.1240],
  Myanmar: [21.9162, 95.9560],
  Cambodia: [12.5657, 104.9910],
  Laos: [19.8563, 102.4955],
  "Hong Kong": [22.3193, 114.1694],
  Taiwan: [23.6978, 120.9605],
};

const worldMapPoints: Array<{ lat: number; lng: number }> = [
  { lat: 70, lng: -180 },
  { lat: 70, lng: -100 },
  { lat: 60, lng: -100 },
  { lat: 50, lng: -120 },
  { lat: 40, lng: -125 },
  { lat: 30, lng: -115 },
  { lat: 25, lng: -110 },
  { lat: 20, lng: -105 },
  { lat: 15, lng: -100 },
  { lat: 10, lng: -95 },
  { lat: 5, lng: -80 },
  { lat: 0, lng: -75 },
  { lat: -5, lng: -70 },
  { lat: -10, lng: -65 },
  { lat: -20, lng: -60 },
  { lat: -30, lng: -50 },
  { lat: -35, lng: -40 },
  { lat: -40, lng: -30 },
  { lat: -50, lng: -20 },
  { lat: -55, lng: -10 },
  { lat: -60, lng: 0 },
  { lat: -65, lng: 20 },
  { lat: -70, lng: 40 },
  { lat: -70, lng: 60 },
  { lat: -70, lng: 80 },
  { lat: -70, lng: 100 },
  { lat: -70, lng: 120 },
  { lat: -70, lng: 140 },
  { lat: -70, lng: 160 },
  { lat: -70, lng: 180 },
  { lat: -60, lng: 180 },
  { lat: -50, lng: 170 },
  { lat: -40, lng: 150 },
  { lat: -30, lng: 135 },
  { lat: -20, lng: 120 },
  { lat: -10, lng: 110 },
  { lat: 0, lng: 100 },
  { lat: 5, lng: 95 },
  { lat: 10, lng: 100 },
  { lat: 15, lng: 105 },
  { lat: 20, lng: 110 },
  { lat: 25, lng: 115 },
  { lat: 30, lng: 120 },
  { lat: 35, lng: 125 },
  { lat: 40, lng: 130 },
  { lat: 45, lng: 135 },
  { lat: 50, lng: 140 },
  { lat: 55, lng: 145 },
  { lat: 60, lng: 150 },
  { lat: 65, lng: 160 },
  { lat: 70, lng: 170 },
  { lat: 70, lng: 180 },
  { lat: 70, lng: -180 },
];

const continentOutlines: Array<Array<{ lat: number; lng: number }>> = [
  [
    { lat: 70, lng: -170 },
    { lat: 70, lng: -50 },
    { lat: 65, lng: -50 },
    { lat: 60, lng: -60 },
    { lat: 55, lng: -70 },
    { lat: 50, lng: -80 },
    { lat: 45, lng: -90 },
    { lat: 40, lng: -100 },
    { lat: 35, lng: -110 },
    { lat: 30, lng: -115 },
    { lat: 25, lng: -110 },
    { lat: 20, lng: -105 },
    { lat: 15, lng: -100 },
    { lat: 10, lng: -95 },
    { lat: 5, lng: -80 },
    { lat: 0, lng: -75 },
    { lat: -5, lng: -70 },
    { lat: -10, lng: -65 },
    { lat: -15, lng: -60 },
    { lat: -20, lng: -55 },
    { lat: -25, lng: -50 },
    { lat: -30, lng: -45 },
    { lat: -35, lng: -40 },
    { lat: -40, lng: -35 },
    { lat: -45, lng: -30 },
    { lat: -50, lng: -25 },
    { lat: -55, lng: -20 },
    { lat: -60, lng: -15 },
    { lat: -65, lng: -10 },
    { lat: -70, lng: 0 },
    { lat: -70, lng: -170 },
  ],
  [
    { lat: 12, lng: -82 },
    { lat: 8, lng: -78 },
    { lat: 5, lng: -75 },
    { lat: 0, lng: -72 },
    { lat: -5, lng: -68 },
    { lat: -10, lng: -65 },
    { lat: -15, lng: -60 },
    { lat: -20, lng: -55 },
    { lat: -25, lng: -50 },
    { lat: -30, lng: -45 },
    { lat: -35, lng: -40 },
    { lat: -40, lng: -35 },
    { lat: -45, lng: -30 },
    { lat: -50, lng: -25 },
    { lat: -55, lng: -20 },
    { lat: -60, lng: -15 },
    { lat: -65, lng: -10 },
    { lat: -70, lng: -5 },
    { lat: -70, lng: -170 },
    { lat: 12, lng: -82 },
  ],
  [
    { lat: 35, lng: -10 },
    { lat: 40, lng: 0 },
    { lat: 45, lng: 10 },
    { lat: 50, lng: 20 },
    { lat: 55, lng: 30 },
    { lat: 60, lng: 40 },
    { lat: 65, lng: 50 },
    { lat: 70, lng: 60 },
    { lat: 70, lng: 180 },
    { lat: 50, lng: 180 },
    { lat: 45, lng: 140 },
    { lat: 40, lng: 130 },
    { lat: 35, lng: 125 },
    { lat: 30, lng: 120 },
    { lat: 25, lng: 115 },
    { lat: 20, lng: 110 },
    { lat: 15, lng: 105 },
    { lat: 10, lng: 100 },
    { lat: 5, lng: 95 },
    { lat: 0, lng: 100 },
    { lat: -5, lng: 105 },
    { lat: -10, lng: 110 },
    { lat: -15, lng: 115 },
    { lat: -20, lng: 120 },
    { lat: -25, lng: 125 },
    { lat: -30, lng: 130 },
    { lat: -35, lng: 135 },
    { lat: -40, lng: 140 },
    { lat: -45, lng: 145 },
    { lat: -50, lng: 150 },
    { lat: -55, lng: 155 },
    { lat: -60, lng: 160 },
    { lat: -65, lng: 165 },
    { lat: -70, lng: 170 },
    { lat: -70, lng: 180 },
    { lat: 35, lng: -10 },
  ],
  [
    { lat: 37, lng: -10 },
    { lat: 40, lng: -5 },
    { lat: 42, lng: 0 },
    { lat: 45, lng: 5 },
    { lat: 48, lng: 10 },
    { lat: 50, lng: 15 },
    { lat: 52, lng: 20 },
    { lat: 55, lng: 25 },
    { lat: 58, lng: 30 },
    { lat: 60, lng: 35 },
    { lat: 62, lng: 40 },
    { lat: 65, lng: 50 },
    { lat: 70, lng: 60 },
    { lat: 70, lng: 180 },
    { lat: 50, lng: 180 },
    { lat: 45, lng: 140 },
    { lat: 40, lng: 130 },
    { lat: 35, lng: 120 },
    { lat: 30, lng: 110 },
    { lat: 25, lng: 100 },
    { lat: 20, lng: 90 },
    { lat: 15, lng: 80 },
    { lat: 10, lng: 70 },
    { lat: 5, lng: 60 },
    { lat: 0, lng: 50 },
    { lat: -5, lng: 40 },
    { lat: -10, lng: 30 },
    { lat: -15, lng: 20 },
    { lat: -20, lng: 10 },
    { lat: -25, lng: 0 },
    { lat: -30, lng: -10 },
    { lat: -35, lng: -15 },
    { lat: -30, lng: -20 },
    { lat: -25, lng: -15 },
    { lat: -20, lng: -10 },
    { lat: -15, lng: -5 },
    { lat: -10, lng: 0 },
    { lat: -5, lng: 5 },
    { lat: 0, lng: 10 },
    { lat: 5, lng: 15 },
    { lat: 10, lng: 20 },
    { lat: 15, lng: 25 },
    { lat: 20, lng: 30 },
    { lat: 25, lng: 35 },
    { lat: 30, lng: 40 },
    { lat: 35, lng: 35 },
    { lat: 37, lng: -10 },
  ],
  [
    { lat: -10, lng: 110 },
    { lat: -15, lng: 115 },
    { lat: -20, lng: 120 },
    { lat: -25, lng: 125 },
    { lat: -30, lng: 130 },
    { lat: -35, lng: 135 },
    { lat: -40, lng: 140 },
    { lat: -45, lng: 145 },
    { lat: -50, lng: 150 },
    { lat: -55, lng: 155 },
    { lat: -60, lng: 160 },
    { lat: -65, lng: 165 },
    { lat: -70, lng: 170 },
    { lat: -70, lng: 180 },
    { lat: -50, lng: 180 },
    { lat: -45, lng: 170 },
    { lat: -40, lng: 160 },
    { lat: -35, lng: 150 },
    { lat: -30, lng: 140 },
    { lat: -25, lng: 130 },
    { lat: -20, lng: 125 },
    { lat: -15, lng: 120 },
    { lat: -10, lng: 115 },
    { lat: -10, lng: 110 },
  ],
];

function InteractiveGlobe({ className = "" }: InteractiveGlobeProps) {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const rotationRef = useRef(0);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/users/locations");
        if (response.ok) {
          const data = await response.json();
          setLocations(data.locations || []);
          setTotalUsers(data.totalUsers || 0);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const latLngToXY = useCallback((lat: number, lng: number, radius: number, rotation: number) => {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + rotation * (180 / Math.PI) + 180) * Math.PI) / 180;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = -radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    const scale = 1 + z / radius;
    return {
      x: x * scale,
      y: y * scale,
      visible: z > -radius * 0.3,
    };
  }, []);

  const drawContinent = useCallback(
    (ctx: CanvasRenderingContext2D, points: Array<{ lat: number; lng: number }>, radius: number, rotation: number) => {
      ctx.beginPath();
      let firstPoint = true;

      for (const point of points) {
        const { x, y, visible } = latLngToXY(point.lat, point.lng, radius, rotation);
        if (visible) {
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }

      ctx.closePath();
      ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
    [latLngToXY]
  );

  useEffect(() => {
    if (!canvasRef.current || !inView || loading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    const drawGlobe = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(centerX, centerY);

      const rotation = rotationRef.current;

      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
      ctx.lineWidth = 0.5;
      for (let i = -90; i <= 90; i += 30) {
        const y = (i / 90) * radius;
        const ellipseRadius = Math.abs(radius * Math.cos((i * Math.PI) / 180));
        if (ellipseRadius > 0) {
          ctx.beginPath();
          ctx.ellipse(0, y, radius, ellipseRadius, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      for (let i = -180; i <= 180; i += 30) {
        const x = (i / 180) * radius;
        const ellipseRadius = Math.abs(radius * Math.cos((i * Math.PI) / 180));
        if (ellipseRadius > 0) {
          ctx.beginPath();
          ctx.ellipse(x, 0, ellipseRadius, radius, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      continentOutlines.forEach((outline) => {
        drawContinent(ctx, outline, radius, rotation);
      });

      locations.forEach((loc) => {
        const coords = countryCoordinates[loc.country];
        if (!coords) return;

        const [lat, lng] = coords;
        const { x, y, visible } = latLngToXY(lat, lng, radius, rotation);

        if (!visible) return;

        const pointSize = Math.min(loc.count * 0.5 + 3, 8);
        const isHovered = hoveredCountry === loc.country;

        ctx.fillStyle = isHovered ? "#3b82f6" : "#f59e0b";
        ctx.shadowBlur = isHovered ? 15 : 5;
        ctx.shadowColor = isHovered ? "#3b82f6" : "#f59e0b";
        ctx.beginPath();
        ctx.arc(x, y, pointSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();
    };

    const animate = () => {
      if (inView) {
        rotationRef.current += 0.005;
        drawGlobe();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    drawGlobe();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [locations, inView, loading, hoveredCountry, latLngToXY, drawContinent]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2;
    const y = e.clientY - rect.top - canvas.height / 2;

    let foundCountry: string | null = null;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;

    locations.forEach((loc) => {
      const coords = countryCoordinates[loc.country];
      if (!coords) return;

      const [lat, lng] = coords;
      const { x: pointX, y: pointY } = latLngToXY(lat, lng, radius, rotationRef.current);
      const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);

      if (distance < 15) {
        foundCountry = loc.country;
      }
    });

    setHoveredCountry(foundCountry);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-[500px] ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="h-[500px] md:h-[600px] rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCountry(null)}
        />
        {hoveredCountry && (
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 shadow-lg z-10">
            <p className="text-sm font-semibold text-foreground">{hoveredCountry}</p>
            <p className="text-xs text-muted-foreground">
              {locations.find((l) => l.country === hoveredCountry)?.count || 0} users
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {totalUsers > 0 && (
            <>
              <span className="font-bold text-foreground">{totalUsers}</span> users dari{" "}
              <span className="font-bold text-foreground">{locations.length}</span> negara
            </>
          )}
        </p>
        {locations.length > 0 && (
          <div className="mt-4 max-h-32 overflow-y-auto space-y-1 text-xs text-muted-foreground">
            {locations.slice(0, 8).map((loc) => (
              <div key={loc.country} className="flex justify-between items-center">
                <span>{loc.country}</span>
                <span className="font-semibold text-foreground">{loc.count}</span>
              </div>
            ))}
            {locations.length > 8 && (
              <div className="text-muted-foreground">+{locations.length - 8} negara lainnya</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(InteractiveGlobe);
