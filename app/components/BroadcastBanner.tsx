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

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 transition-transform duration-300 ease-out relative overflow-hidden ${
        showBroadcast ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Background with better opacity - light mode */}
      <div
        className="absolute inset-0 backdrop-blur-xl dark:hidden"
        style={{
          backgroundColor: broadcast.backgroundColor
            ? broadcast.type === "info"
              ? `color-mix(in srgb, ${broadcast.backgroundColor} 85%, white)`
              : broadcast.type === "warning"
              ? `color-mix(in srgb, ${broadcast.backgroundColor} 90%, white)`
              : broadcast.type === "success"
              ? `color-mix(in srgb, ${broadcast.backgroundColor} 85%, white)`
              : `color-mix(in srgb, ${broadcast.backgroundColor} 90%, white)`
            : broadcast.type === "info"
            ? "color-mix(in srgb, rgb(59, 130, 246) 85%, white)"
            : broadcast.type === "warning"
            ? "color-mix(in srgb, rgb(234, 179, 8) 90%, white)"
            : broadcast.type === "success"
            ? "color-mix(in srgb, rgb(34, 197, 94) 85%, white)"
            : "color-mix(in srgb, rgb(239, 68, 68) 90%, white)",
        }}
      />
      {/* Background with better opacity - dark mode */}
      <div
        className="absolute inset-0 backdrop-blur-xl hidden dark:block"
        style={{
          backgroundColor: broadcast.backgroundColor
            ? broadcast.type === "info"
              ? `color-mix(in srgb, ${broadcast.backgroundColor} 75%, black)`
              : broadcast.type === "warning"
              ? `color-mix(in srgb, ${broadcast.backgroundColor} 80%, black)`
              : broadcast.type === "success"
              ? `color-mix(in srgb, ${broadcast.backgroundColor} 75%, black)`
              : `color-mix(in srgb, ${broadcast.backgroundColor} 80%, black)`
            : broadcast.type === "info"
            ? "color-mix(in srgb, rgb(59, 130, 246) 75%, black)"
            : broadcast.type === "warning"
            ? "color-mix(in srgb, rgb(234, 179, 8) 80%, black)"
            : broadcast.type === "success"
            ? "color-mix(in srgb, rgb(34, 197, 94) 75%, black)"
            : "color-mix(in srgb, rgb(239, 68, 68) 80%, black)",
        }}
      />

      {/* Border with gradient effect */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: broadcast.borderColor
            ? `linear-gradient(90deg, transparent, ${broadcast.borderColor}, transparent)`
            : broadcast.type === "info"
            ? "linear-gradient(90deg, transparent, rgb(59, 130, 246), transparent)"
            : broadcast.type === "warning"
            ? "linear-gradient(90deg, transparent, rgb(234, 179, 8), transparent)"
            : broadcast.type === "success"
            ? "linear-gradient(90deg, transparent, rgb(34, 197, 94), transparent)"
            : "linear-gradient(90deg, transparent, rgb(239, 68, 68), transparent)",
        }}
      />

      {/* Shadow for depth */}
      <div className="absolute inset-0 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3)] pointer-events-none" />

      <BroadcastParticles
        effect={
          countdownFinished && broadcast.particleEffectAfterCountdown
            ? broadcast.particleEffectAfterCountdown || "none"
            : broadcast.particleEffect || "none"
        }
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 relative z-10 pointer-events-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {broadcast.icon && (
              <div className="flex-shrink-0 mt-0.5 sm:mt-0 text-lg sm:text-xl">
                {broadcast.icon}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <div
                className="font-bold text-sm sm:text-base leading-tight dark:text-white/95"
                style={{
                  color:
                    broadcast.textColor ||
                    (broadcast.type === "info"
                      ? "rgb(30, 64, 175)"
                      : broadcast.type === "warning"
                      ? "rgb(146, 64, 14)"
                      : broadcast.type === "success"
                      ? "rgb(20, 83, 45)"
                      : "rgb(185, 28, 28)"),
                }}
              >
                {countdownFinished &&
                broadcast.actionAfterCountdown === "change_message" &&
                broadcast.messageAfterCountdown
                  ? broadcast.messageAfterCountdown
                  : broadcast.title}
              </div>
              {(!countdownFinished ||
                broadcast.actionAfterCountdown !== "change_message" ||
                !broadcast.messageAfterCountdown) && (
                <div
                  className="text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3 dark:text-white/90"
                  style={{
                    color: broadcast.textColor
                      ? undefined
                      : broadcast.type === "info"
                      ? "rgb(30, 64, 175)"
                      : broadcast.type === "warning"
                      ? "rgb(146, 64, 14)"
                      : broadcast.type === "success"
                      ? "rgb(20, 83, 45)"
                      : "rgb(185, 28, 28)",
                  }}
                >
                  {broadcast.textColor ? (
                    <span
                      className="opacity-90 dark:opacity-95"
                      style={{ color: broadcast.textColor }}
                    >
                      {broadcast.message}
                    </span>
                  ) : (
                    <span className="opacity-90 dark:opacity-95">
                      {broadcast.message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {broadcast.hasCountdown && countdown && !countdownFinished && (
            <div className="flex items-center justify-end sm:justify-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full border border-white/50 dark:border-white/10 shadow-lg">
                {countdown.days > 0 && (
                  <span className="px-2 py-1 bg-primary/10 dark:bg-primary/20 font-bold rounded-md text-xs sm:text-sm">
                    <span
                      className="dark:!text-white/95"
                      style={
                        !broadcast.textColor
                          ? {
                              color:
                                broadcast.type === "info"
                                  ? "rgb(30, 64, 175)"
                                  : broadcast.type === "warning"
                                  ? "rgb(146, 64, 14)"
                                  : broadcast.type === "success"
                                  ? "rgb(20, 83, 45)"
                                  : "rgb(185, 28, 28)",
                            }
                          : undefined
                      }
                    >
                      {countdown.days}d
                    </span>
                  </span>
                )}
                <span
                  className="tabular-nums font-bold text-sm sm:text-base dark:text-white/95"
                  style={{
                    color:
                      broadcast.textColor ||
                      (broadcast.type === "info"
                        ? "rgb(30, 64, 175)"
                        : broadcast.type === "warning"
                        ? "rgb(146, 64, 14)"
                        : broadcast.type === "success"
                        ? "rgb(20, 83, 45)"
                        : "rgb(185, 28, 28)"),
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
