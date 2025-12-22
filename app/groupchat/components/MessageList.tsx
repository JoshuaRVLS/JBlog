"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { MessageCircle, Loader2, Eye } from "lucide-react";
import MessageSkeleton from "@/components/MessageSkeleton";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { Message, GroupChat, HoveredMention, MessageRead } from "../types";

interface MessageListProps {
  messages: (Message & { reads?: MessageRead[] })[];
  loadingMessages: boolean;
  userId: string | null;
  selectedGroup: GroupChat | null;
  hoveredMention: HoveredMention | null;
  onMentionHover: (mention: HoveredMention | null) => void;
  onMentionClick: (userId: string) => void;
  onImageClick: (url: string) => void;
  typingUsers: Map<string, { name: string; timeout: NodeJS.Timeout }>;
  mentionHoverTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export default function MessageList({
  messages,
  loadingMessages,
  userId,
  selectedGroup,
  hoveredMention,
  onMentionHover,
  onMentionClick,
  onImageClick,
  typingUsers,
  mentionHoverTimeoutRef,
}: MessageListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessageContent = (message: Message) => {
    if (!message.content) return null;

    return (
      <p className="text-foreground">
        {message.content.split(/(@[^\s@]+|@everyone)/g).map((part, idx) => {
          if (part.startsWith("@")) {
            const username = part.substring(1);
            const isEveryone = username.toLowerCase() === "everyone";
            const mentionedUser = isEveryone
              ? null
              : selectedGroup?.members?.find(
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
                    onMentionHover({
                      username: "everyone",
                      userId: "everyone",
                      x: rect.left,
                      y: rect.top,
                    });
                  } else if (mentionedUser?.user) {
                    mentionHoverTimeoutRef.current = setTimeout(() => {
                      const freshRect = target.getBoundingClientRect();
                      onMentionHover({
                        username: mentionedUser.user.name,
                        userId: mentionedUser.user.id,
                        x: freshRect.left,
                        y: freshRect.top - 10,
                      });
                    }, 300);
                  }
                }}
                onMouseLeave={() => {
                  if (mentionHoverTimeoutRef.current) {
                    clearTimeout(mentionHoverTimeoutRef.current);
                  }
                  setTimeout(() => onMentionHover(null), 200);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (mentionedUser?.user && mentionedUser.user.id !== userId) {
                    onMentionClick(mentionedUser.user.id);
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
    );
  };

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 overscroll-contain"
      data-lenis-prevent="true"
      style={{
        WebkitOverflowScrolling: "touch",
        scrollBehavior: "smooth",
      }}
    >
      {loadingMessages && messages.length === 0 ? (
        <MessageSkeleton count={6} />
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground text-lg font-medium mb-2">
            Belum ada pesan
          </p>
          <p className="text-muted-foreground/70 text-sm">
            Mulai percakapan dengan mengirim pesan pertama!
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => {
            const isOwnMessage = message.user.id === userId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 items-start ${
                  isOwnMessage ? "flex-row-reverse" : ""
                }`}
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
                <div
                  className={`flex-1 ${
                    isOwnMessage ? "flex flex-col items-end max-w-[70%]" : ""
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {message.user.name}
                      </span>
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
                      <div
                        className="mb-2 cursor-pointer"
                        onClick={() => onImageClick(message.mediaUrl!)}
                      >
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
                    {renderMessageContent(message)}
                    {isOwnMessage && message.reads && message.reads.length > 0 && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>
                          Dilihat oleh {message.reads.length}{" "}
                          {message.reads.length === 1 ? "orang" : "orang"}
                        </span>
                        {message.reads.length <= 3 && (
                          <span className="text-muted-foreground/70">
                            ({message.reads.map((r) => r.user.name || "Unknown").join(", ")})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {typingUsers.size > 0 && (
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
                      <span
                        className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

