"use client";

import Image from "next/image";
import { MessageCircle, Users, Globe, Lock, Crown } from "lucide-react";
import { GroupChat } from "../types";

interface ExploreGroupCardProps {
  group: GroupChat;
  onSelect: (group: GroupChat) => void;
  onJoin: (groupId: string) => void;
}

export default function ExploreGroupCard({
  group,
  onSelect,
  onJoin,
}: ExploreGroupCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 hover:bg-accent/40 transition-all shadow-sm hover:shadow-lg overflow-hidden flex flex-col">
      {/* Banner */}
      <div className="relative w-full h-24 bg-gradient-to-r from-primary/20 via-background to-accent/20">
        {group.banner ? (
          <Image
            src={group.banner}
            alt={group.name}
            fill
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        {/* Logo bubble */}
        <div className="absolute left-4 bottom-[-20px]">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center border border-border/80 shadow-md">
            {group.logo ? (
              <Image
                src={group.logo}
                alt={group.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <MessageCircle className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6 px-4 pb-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="pr-2">
            <h3 className="font-semibold text-foreground truncate max-w-[150px]">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{group._count?.members || 0}</span>
              </div>
              {group.isPublic ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Globe className="h-3 w-3" />
                  Public
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Lock className="h-3 w-3" />
                  Private
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/80">
              {group._count?.messages || 0} messages
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20">
              <Crown className="h-3 w-3 text-primary" />
              {group.creator?.name || "Creator"}
            </span>
          </div>
          {group.isMember ? (
            <button
              onClick={() => onSelect(group)}
              className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors"
            >
              Buka
            </button>
          ) : (
            <button
              onClick={() => onJoin(group.id)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

