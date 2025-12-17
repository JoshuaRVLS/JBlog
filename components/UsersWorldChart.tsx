"use client";

import { useEffect, useState, memo } from "react";
import { useInView } from "react-intersection-observer";
import { Globe, Users } from "lucide-react";

interface LocationData {
  country: string;
  count: number;
}

interface UsersWorldChartProps {
  className?: string;
}

function UsersWorldChart({ className = "" }: UsersWorldChartProps) {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/users/locations");
        if (response.ok) {
          const data = await response.json();
          const sorted = (data.locations || []).sort((a: LocationData, b: LocationData) => b.count - a.count);
          setLocations(sorted);
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

  const maxCount = locations.length > 0 ? locations[0].count : 1;

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-[400px] ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`${className}`}>
      <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Distribusi Pengguna</h3>
            <p className="text-sm text-muted-foreground">
              {totalUsers} users dari {locations.length} negara
            </p>
          </div>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Belum ada data pengguna</p>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.slice(0, 10).map((loc, index) => {
              const percentage = (loc.count / maxCount) * 100;
              const delay = index * 0.05;

              return (
                <div
                  key={loc.country}
                  className="group"
                  style={{
                    animation: inView
                      ? `slideInLeft 0.6s ease-out ${delay}s both`
                      : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{loc.country}</span>
                      <span className="text-xs text-muted-foreground">({loc.count})</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{loc.count}</span>
                  </div>
                  <div className="relative h-8 bg-muted/50 rounded-full overflow-hidden border border-border/30">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-1000 ease-out group-hover:from-primary/90 group-hover:via-primary group-hover:to-primary/90 shadow-lg"
                      style={{
                        width: inView ? `${percentage}%` : "0%",
                        transitionDelay: `${delay}s`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-end pr-3">
                      <span className="text-xs font-bold text-foreground/80">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {locations.length > 10 && (
              <div className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  +{locations.length - 10} negara lainnya
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default memo(UsersWorldChart);

