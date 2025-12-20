import { useRef, useEffect } from "react";
import MessageItem from "./MessageItem";
import type { Message } from "../types";

interface MessageListProps {
  messages: Message[];
  userId: string | null;
  playingAudioId: string | null;
  onPlayAudio: (messageId: string, audioUrl: string) => void;
  onPauseAudio: (messageId: string) => void;
  onViewImage: (imageUrl: string) => void;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
}

export default function MessageList({
  messages,
  userId,
  playingAudioId,
  onPlayAudio,
  onPauseAudio,
  onViewImage,
  audioRefs,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" data-lenis-prevent>
      {messages.map((message) => {
        const isOwn = message.senderId === userId;
        return (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={isOwn}
            playingAudioId={playingAudioId}
            onPlayAudio={onPlayAudio}
            onPauseAudio={onPauseAudio}
            onViewImage={onViewImage}
            audioRefs={audioRefs}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

