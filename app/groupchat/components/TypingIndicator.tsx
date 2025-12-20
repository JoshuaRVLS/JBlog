"use client";

import { Loader2 } from "lucide-react";
import { TypingUser } from "../types";

interface TypingIndicatorProps {
  typingUsers: Map<string, TypingUser>;
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.size === 0) return null;

  return (
    <div className="flex gap-3 items-start">
      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        </div>
      </div>
      <div className="flex-1">
        <div className="inline-block px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">
              {Array.from(typingUsers.values())
                .map((user) => user.name)
                .join(", ")}
              {typingUsers.size === 1 ? " sedang mengetik" : " sedang mengetik"}
            </span>
            <div className="flex gap-1 ml-2">
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

