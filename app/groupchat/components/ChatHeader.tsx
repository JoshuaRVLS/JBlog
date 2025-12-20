"use client";

import Image from "next/image";
import { ArrowLeft, MessageCircle, Users, Settings } from "lucide-react";
import { GroupChat } from "../types";

interface ChatHeaderProps {
  selectedGroup: GroupChat;
  isAdmin: boolean;
  isCreator: boolean;
  onBack: () => void;
  onShowMembers: () => void;
  onShowSettings: () => void;
}

export default function ChatHeader({
  selectedGroup,
  isAdmin,
  isCreator,
  onBack,
  onShowMembers,
  onShowSettings,
}: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-border/50">
      {/* Back button for mobile */}
      <button
        onClick={onBack}
        className="lg:hidden mb-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
        title="Back to Groups"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
            {selectedGroup.logo ? (
              <Image
                src={selectedGroup.logo}
                alt={selectedGroup.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <MessageCircle className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gradient truncate">{selectedGroup.name}</h3>
            {selectedGroup.description && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {selectedGroup.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{selectedGroup._count?.members || selectedGroup.members?.length || 0} members</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowMembers}
            className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
            title="Members"
          >
            <Users className="h-5 w-5 text-foreground" />
          </button>
          {(isAdmin || isCreator) && (
            <button
              onClick={onShowSettings}
              className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

