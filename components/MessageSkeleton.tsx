"use client";

import { Loader2 } from "lucide-react";

interface MessageSkeletonProps {
  count?: number;
  variant?: "default" | "compact";
}

export default function MessageSkeleton({ count = 5, variant = "default" }: MessageSkeletonProps) {
  return (
    <>
      <style jsx global>{`
        @keyframes skeletonFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .skeleton-item {
          animation: skeletonFadeIn 0.4s ease-out both;
        }
      `}</style>
      <div className="space-y-4 p-4">
        {Array.from({ length: count }).map((_, i) => {
          const isOwn = i % 2 === 0;
          const widths = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-4/5"];
          const randomWidth = widths[i % widths.length];
          
          return (
            <div
              key={i}
              className={`flex gap-3 items-start skeleton-item ${
                isOwn ? "flex-row-reverse" : ""
              }`}
              style={{
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {/* Avatar skeleton */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex-shrink-0 animate-pulse" />
              
              {/* Message bubble skeleton */}
              <div
                className={`flex-1 ${isOwn ? "flex flex-col items-end max-w-[70%]" : ""}`}
              >
                {!isOwn && variant === "default" && (
                  <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/80 to-muted/60 rounded mb-2 animate-pulse" />
                )}
                
                <div
                  className={`rounded-lg p-3 bg-gradient-to-br from-muted via-muted/80 to-muted/60 ${
                    isOwn
                      ? "rounded-tr-none bg-primary/10"
                      : "rounded-tl-none"
                  } animate-pulse`}
                >
                  {/* Content lines */}
                  <div className="space-y-2">
                    <div
                      className={`h-4 bg-background/30 rounded ${randomWidth} animate-pulse`}
                    />
                    {i % 3 === 0 && (
                      <div className="h-4 bg-background/20 rounded w-1/2 animate-pulse" />
                    )}
                    {i % 4 === 0 && (
                      <div className="h-4 bg-background/20 rounded w-3/4 animate-pulse" />
                    )}
                  </div>
                  
                  {/* Timestamp skeleton */}
                  <div className="h-3 w-16 bg-background/20 rounded mt-2 animate-pulse" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ConversationSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      <style jsx global>{`
        @keyframes conversationFadeIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .conversation-skeleton-item {
          animation: conversationFadeIn 0.35s ease-out both;
        }
      `}</style>
      <div className="p-2 space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-gradient-to-r from-muted via-muted/80 to-muted/60 conversation-skeleton-item"
            style={{
              animationDelay: `${i * 0.06}s`,
            }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar skeleton */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-background/30 via-background/20 to-background/10 flex-shrink-0 animate-pulse" />
              
              {/* Content skeleton */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-background/30 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-background/20 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ChatLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" style={{ animationDuration: "1s" }} />
        <div className="absolute inset-0 h-8 w-8 border-2 border-primary/20 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        Memuat pesan...
      </p>
    </div>
  );
}

