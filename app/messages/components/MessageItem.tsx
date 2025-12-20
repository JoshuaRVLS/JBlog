import Image from "next/image";
import { Play, Pause } from "lucide-react";
import type { Message } from "../types";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  playingAudioId: string | null;
  onPlayAudio: (messageId: string, audioUrl: string) => void;
  onPauseAudio: (messageId: string) => void;
  onViewImage: (imageUrl: string) => void;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
}

export default function MessageItem({
  message,
  isOwn,
  playingAudioId,
  onPlayAudio,
  onPauseAudio,
  onViewImage,
  audioRefs,
}: MessageItemProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {message.type === "image" && message.mediaUrl && (
          <div
            className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-lg overflow-hidden mb-2 cursor-pointer"
            onClick={() => onViewImage(message.mediaUrl!)}
          >
            <Image
              src={message.mediaUrl}
              alt="Image"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 192px, 256px"
              unoptimized
            />
          </div>
        )}
        {message.type === "video" && message.mediaUrl && (
          <video
            src={message.mediaUrl}
            controls
            className="max-w-full max-h-96 rounded-lg mb-2"
          />
        )}
        {message.type === "audio" && message.mediaUrl && (
          <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg mb-2">
            <button
              onClick={() => {
                const audioElement = audioRefs.current.get(message.id);
                if (!audioElement) {
                  onPlayAudio(message.id, message.mediaUrl!);
                } else {
                  if (audioElement.paused) {
                    audioElement.play();
                  } else {
                    onPauseAudio(message.id);
                  }
                }
              }}
              className="p-1 rounded-full bg-background text-foreground hover:opacity-80 transition-opacity"
            >
              {playingAudioId === message.id &&
              !audioRefs.current.get(message.id)?.paused ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <audio
              ref={(el) => {
                if (el) audioRefs.current.set(message.id, el);
                else audioRefs.current.delete(message.id);
              }}
              src={message.mediaUrl}
              onEnded={() => onPauseAudio(message.id)}
            />
            <span className="text-sm">Voice message</span>
          </div>
        )}

        {message.content &&
          message.content !== "Image" &&
          message.content !== "Video" &&
          message.content !== "Voice message" && (
            <p className="text-sm">{message.content}</p>
          )}
        <p className="text-xs opacity-70 mt-1">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

