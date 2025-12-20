"use client";

import dynamic from "next/dynamic";

const BroadcastParticles = dynamic(
  () => import("@/components/BroadcastParticles"),
  { ssr: false }
);

interface BroadcastBannerProps {
  broadcast: any;
  showBroadcast: boolean;
  countdown: { days: number; hours: number; minutes: number; seconds: number } | null;
  countdownFinished: boolean;
  onClose?: () => void;
}

export default function BroadcastBanner({
  broadcast,
  showBroadcast,
  countdown,
  countdownFinished,
  onClose,
}: BroadcastBannerProps) {
  if (!broadcast || (countdownFinished && broadcast.actionAfterCountdown === "hide")) {
    return null;
  }

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 border-b backdrop-blur-md transition-transform duration-200 ease-out relative overflow-hidden shadow-lg ${
        showBroadcast ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{
        backgroundColor: broadcast.backgroundColor
          ? `${broadcast.backgroundColor}25`
          : broadcast.type === "info"
          ? "rgba(59, 130, 246, 0.2)"
          : broadcast.type === "warning"
          ? "rgba(234, 179, 8, 0.2)"
          : broadcast.type === "success"
          ? "rgba(34, 197, 94, 0.2)"
          : "rgba(239, 68, 68, 0.2)",
        borderColor: broadcast.borderColor
          ? `${broadcast.borderColor}50`
          : broadcast.type === "info"
          ? "rgba(59, 130, 246, 0.4)"
          : broadcast.type === "warning"
          ? "rgba(234, 179, 8, 0.4)"
          : broadcast.type === "success"
          ? "rgba(34, 197, 94, 0.4)"
          : "rgba(239, 68, 68, 0.4)",
        color: broadcast.textColor || (broadcast.type === "info"
          ? "#1e40af"
          : broadcast.type === "warning"
          ? "#b45309"
          : broadcast.type === "success"
          ? "#15803d"
          : "#b91c1c"),
      }}
    >
      <BroadcastParticles 
        effect={countdownFinished && broadcast.particleEffectAfterCountdown 
          ? (broadcast.particleEffectAfterCountdown || "none")
          : (broadcast.particleEffect || "none")
        } 
      />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 relative z-10 pointer-events-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {broadcast.icon && (
              <span className="text-base sm:text-lg flex-shrink-0 mt-0.5 sm:mt-0">
                {broadcast.icon}
              </span>
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-xs sm:text-sm truncate">
                  {countdownFinished && broadcast.actionAfterCountdown === "change_message" && broadcast.messageAfterCountdown
                    ? broadcast.messageAfterCountdown
                    : broadcast.title}
                </div>
              </div>
              <div className="text-[11px] sm:text-xs opacity-80 leading-snug line-clamp-2 sm:line-clamp-3">
                {countdownFinished && broadcast.actionAfterCountdown === "change_message" && broadcast.messageAfterCountdown
                  ? ""
                  : broadcast.message}
              </div>
            </div>
          </div>
          {broadcast.hasCountdown && countdown && !countdownFinished && (
            <div className="flex items-center justify-end sm:justify-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-full border border-white/40 dark:border-white/20 shadow-lg text-[11px] sm:text-xs font-bold">
                {countdown.days > 0 && (
                  <span className="px-1.5 py-0.5 bg-white/40 dark:bg-white/20 rounded">
                    {countdown.days}d
                  </span>
                )}
                <span className="tabular-nums">
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

