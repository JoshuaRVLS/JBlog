"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Compass, Plus, Loader2 } from "lucide-react";
import { GroupChat } from "../types";

interface GroupSidebarProps {
  groupChats: GroupChat[];
  selectedGroup: GroupChat | null;
  loadingGroups: boolean;
  onSelectGroup: (group: GroupChat) => void;
  onShowExplore: () => void;
  onShowCreate: () => void;
}

export default function GroupSidebar({
  groupChats,
  selectedGroup,
  loadingGroups,
  onSelectGroup,
  onShowExplore,
  onShowCreate,
}: GroupSidebarProps) {
  return (
    <>
      {/* Server rail ala Discord (desktop only) */}
      <aside className="hidden lg:flex flex-col items-center gap-3 w-20 py-4 mr-1 rounded-2xl bg-card/90 border border-border/60 shadow-xl">
        {/* JBlog home icon */}
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:rounded-3xl transition-all"
          title="Kembali ke Home"
        >
          J+
        </Link>
        <div className="w-8 border-t border-border/40 my-2" />
        {/* Group icons */}
        <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-border/60 scrollbar-track-transparent">
          {groupChats.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden transition-all ${
                selectedGroup?.id === group.id
                  ? "bg-primary/90 shadow-lg shadow-primary/30 scale-105"
                  : "bg-muted/60 hover:bg-accent/60 hover:rounded-3xl"
              }`}
              title={group.name}
            >
              {group.logo ? (
                <Image
                  src={group.logo}
                  alt={group.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-primary">
                  {group.name.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={onShowExplore}
            className="mt-1 flex items-center justify-center w-10 h-10 rounded-2xl border border-dashed border-border/70 text-muted-foreground hover:border-primary/60 hover:text-primary hover:rounded-3xl transition-all"
            title="Explore Groups"
          >
            <Compass className="h-4 w-4" />
          </button>
          <button
            onClick={onShowCreate}
            className="flex items-center justify-center w-10 h-10 rounded-2xl border border-dashed border-border/70 text-muted-foreground hover:border-primary/60 hover:text-primary hover:rounded-3xl transition-all"
            title="Buat Group"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Group List - mobile / small sidebar */}
      {!selectedGroup && (
        <div className="block lg:hidden bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 overflow-y-auto shadow-lg overscroll-contain" data-lenis-prevent="true">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gradient">Group Chats</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowExplore}
                className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
                title="Explore Groups"
              >
                <Compass className="h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={onShowCreate}
                className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
                title="Create Group"
              >
                <Plus className="h-5 w-5 text-foreground" />
              </button>
            </div>
          </div>

          {loadingGroups ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : groupChats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Tidak ada group chat
            </div>
          ) : (
            <div className="space-y-2">
              {groupChats.map((group) => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup(group)}
                  className="w-full text-left p-3 rounded-lg transition-colors hover:bg-accent/50 text-foreground"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {group._count?.members || 0} members
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

