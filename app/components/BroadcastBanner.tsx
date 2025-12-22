import dynamic from "next/dynamic";
import type { Countdown } from "../types";

const BroadcastParticles = dynamic(
  () => import("@/components/BroadcastParticles"),
  { ssr: false }
);

interface BroadcastBannerProps {
  broadcast: any;
  showBroadcast: boolean;
  countdown: Countdown | null;
  countdownFinished: boolean;
}

export default function BroadcastBanner({
  broadcast,
  showBroadcast,
  countdown,
  countdownFinished,
}: BroadcastBannerProps) {
  if (!broadcast || (countdownFinished && broadcast.actionAfterCountdown === "hide")) {
    return null;
  }

  // Get type-based colors
  const getTypeColors = () => {
    if (broadcast.backgroundColor && broadcast.textColor) {
      return {
        bg: broadcast.backgroundColor,
        text: broadcast.textColor,
        border: broadcast.borderColor || broadcast.backgroundColor,
      };
    }

    switch (broadcast.type) {
      case "info":
        return {
          bg: "rgb(59, 130, 246)",
          text: "rgb(30, 64, 175)",
          border: "rgb(37, 99, 235)",
        };
      case "warning":
        return {
          bg: "rgb(234, 179, 8)",
          text: "rgb(146, 64, 14)",
          border: "rgb(217, 119, 6)",
        };
      case "success":
        return {
          bg: "rgb(34, 197, 94)",
          text: "rgb(20, 83, 45)",
          border: "rgb(22, 163, 74)",
        };
      default:
        return {
          bg: "rgb(239, 68, 68)",
          text: "rgb(185, 28, 28)",
          border: "rgb(220, 38, 38)",
        };
    }
  };

  const colors = getTypeColors();

  return (
    <div
      className={`fixed top-20 left-0 right-0 z-[90] transition-all duration-500 ease-out relative ${
        showBroadcast ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      {/* Modern gradient background */}
      <div
        className="absolute inset-0 backdrop-blur-md border-b"
        style={{
          background: `linear-gradient(135deg, ${colors.bg}15 0%, ${colors.bg}08 100%)`,
          borderColor: `${colors.border}30`,
        }}
      />

      {/* Subtle animated gradient overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${colors.bg}20 50%, transparent 100%)`,
          animation: "broadcast-shimmer 3s ease-in-out infinite",
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
        }}
      />

      {/* Bottom shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <BroadcastParticles
        effect={
          countdownFinished && broadcast.particleEffectAfterCountdown
            ? broadcast.particleEffectAfterCountdown || "none"
            : broadcast.particleEffect || "none"
        }
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 relative z-10 pointer-events-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {broadcast.icon && (
              <div 
                className="flex-shrink-0 mt-0.5 sm:mt-0 text-xl sm:text-2xl transition-transform duration-300 hover:scale-110"
                style={{ color: colors.border }}
              >
                {broadcast.icon}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1.5">
              <h3
                className="font-bold text-sm sm:text-base leading-tight text-foreground"
                style={{
                  color: broadcast.textColor || colors.text,
                }}
              >
                {countdownFinished &&
                broadcast.actionAfterCountdown === "change_message" &&
                broadcast.messageAfterCountdown
                  ? broadcast.messageAfterCountdown
                  : broadcast.title}
              </h3>
              {(!countdownFinished ||
                broadcast.actionAfterCountdown !== "change_message" ||
                !broadcast.messageAfterCountdown) && (
                <p
                  className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2 sm:line-clamp-3"
                  style={{
                    color: broadcast.textColor
                      ? `${broadcast.textColor}DD`
                      : undefined,
                  }}
                    >
                      {broadcast.message}
                </p>
              )}
            </div>
          </div>
          
          {broadcast.hasCountdown && countdown && !countdownFinished && (
            <div className="flex items-center justify-end sm:justify-center gap-2 flex-shrink-0">
              <div 
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl backdrop-blur-sm border shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                style={{
                  backgroundColor: `${colors.bg}15`,
                  borderColor: `${colors.border}40`,
                }}
              >
                {countdown.days > 0 && (
                    <span
                    className="px-2.5 py-1 rounded-lg font-bold text-xs sm:text-sm"
                    style={{
                      backgroundColor: `${colors.bg}25`,
                      color: colors.text,
                    }}
                    >
                      {countdown.days}d
                  </span>
                )}
                <span
                  className="tabular-nums font-bold text-sm sm:text-base"
                  style={{
                    color: broadcast.textColor || colors.text,
                  }}
                >
                  {String(countdown.hours).padStart(2, "0")}:
                  {String(countdown.minutes).padStart(2, "0")}:
                  {String(countdown.seconds).padStart(2, "0")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
