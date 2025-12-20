"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Message, GroupChat, HoveredMention } from "../types";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { Loader2 } from "lucide-react";

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  selectedGroup: GroupChat;
  userId: string | null;
  router: ReturnType<typeof useRouter>;
  onImageClick: (url: string) => void;
  hoveredMention: HoveredMention | null;
  onMentionHover: (e: React.MouseEvent<HTMLSpanElement>, username: string, userId: string, isEveryone: boolean) => void;
  onMentionLeave: () => void;
  mentionHoverTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export default function MessageItem({
  message,
  isOwnMessage,
  selectedGroup,
  userId,
  router,
  onImageClick,
  hoveredMention,
  onMentionHover,
  onMentionLeave,
  mentionHoverTimeoutRef,
}: MessageItemProps) {
  return (
    <div
      className={`flex gap-3 items-start ${isOwnMessage ? "flex-row-reverse" : ""}`}
    >
      <div className="w-10 h-10 flex-shrink-0">
        <Image
          src={
            message.user.profilePicture ||
            generateAvatarUrl(message.user.name)
          }
          alt={message.user.name}
          width={40}
          height={40}
          className="rounded-full w-10 h-10 object-cover"
        />
      </div>
      <div className={`flex-1 ${isOwnMessage ? "flex flex-col items-end max-w-[70%]" : ""}`}>
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{message.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
        {isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
        <div
          className={`inline-block px-4 py-2 rounded-lg ${
            isOwnMessage
              ? "bg-primary/10 border border-primary/20"
              : "bg-muted/50 border border-border/50"
          }`}
        >
          {message.type === "image" && message.mediaUrl && (
            <div className="mb-2 cursor-pointer" onClick={() => onImageClick(message.mediaUrl!)}>
              <Image
                src={message.mediaUrl}
                alt="Shared image"
                width={300}
                height={300}
                className="rounded-lg max-w-full h-auto hover:opacity-90 transition-opacity"
                unoptimized
              />
            </div>
          )}
          {message.type === "video" && message.mediaUrl && (
            <div className="mb-2">
              <video
                src={message.mediaUrl}
                controls
                className="rounded-lg max-w-full h-auto max-h-96"
              />
            </div>
          )}
          {message.type === "audio" && message.mediaUrl && (
            <div className="mb-2">
              <audio src={message.mediaUrl} controls className="w-full" />
            </div>
          )}
          {message.content && (
            <p className="text-foreground">
              {message.content.split(/(@[^\s@]+|@everyone)/g).map((part, idx) => {
                if (part.startsWith("@")) {
                  const username = part.substring(1);
                  const isEveryone = username.toLowerCase() === "everyone";
                  const mentionedUser = isEveryone 
                    ? null 
                    : selectedGroup.members?.find(
                        (m) => m.user?.name?.toLowerCase() === username.toLowerCase()
                      );
                  
                  return (
                    <span
                      key={idx}
                      className="text-primary font-semibold bg-primary/10 px-1 rounded cursor-pointer hover:bg-primary/20 transition-colors relative"
                      onMouseEnter={(e) => {
                        if (mentionHoverTimeoutRef.current) {
                          clearTimeout(mentionHoverTimeoutRef.current);
                        }
                        
                        const target = e.currentTarget;
                        const rect = target.getBoundingClientRect();
                        
                        if (isEveryone) {
                          onMentionHover(e, "everyone", "everyone", true);
                        } else if (mentionedUser?.user) {
                          mentionHoverTimeoutRef.current = setTimeout(() => {
                            const freshRect = target.getBoundingClientRect();
                            onMentionHover(e, mentionedUser.user.name, mentionedUser.user.id, false);
                          }, 300);
                        }
                      }}
                      onMouseLeave={onMentionLeave}
                      onClick={(e) => {
                        e.preventDefault();
                        if (mentionedUser?.user && mentionedUser.user.id !== userId) {
                          router.push(`/users/${mentionedUser.user.id}`);
                        }
                      }}
                    >
                      {part}
                    </span>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

