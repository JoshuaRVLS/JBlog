"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowLeft, User, Lock, Key } from "lucide-react";
import { Message, Conversation } from "../types";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import MediaPreview from "./MediaPreview";
import MessageSkeleton from "@/components/MessageSkeleton";
import { MessageSquare } from "lucide-react";

interface MessagesAreaProps {
  selectedUserId: string | null;
  selectedConversation: Conversation | undefined;
  messages: Message[];
  loadingMessages: boolean;
  userId: string | null;
  playingAudioId: string | null;
  newMessage: string;
  selectedMedia: {
    file: File;
    preview: string;
    type: "image" | "video" | "audio";
  } | null;
  uploading: boolean;
  isRecording: boolean;
  enableEncryption: boolean;
  encryption: any;
  showKeyPairModal: boolean;
  onSelectUser: (userId: string | null) => void;
  onMessageChange: (message: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onPlayAudio: (messageId: string, audioUrl: string) => void;
  onPauseAudio: (messageId: string) => void;
  onViewImage: (imageUrl: string) => void;
  onShowKeyPairModal: () => void;
  onGenerateKeyPair: () => Promise<void>;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  loadMoreTriggerRef: React.RefObject<HTMLDivElement>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export default function MessagesArea({
  selectedUserId,
  selectedConversation,
  messages,
  loadingMessages,
  userId,
  playingAudioId,
  newMessage,
  selectedMedia,
  uploading,
  isRecording,
  enableEncryption,
  encryption,
  showKeyPairModal,
  onSelectUser,
  onMessageChange,
  onFileSelect,
  onSend,
  onPlayAudio,
  onPauseAudio,
  onViewImage,
  onShowKeyPairModal,
  onGenerateKeyPair,
  audioRefs,
  messagesContainerRef,
  messagesEndRef,
  loadMoreTriggerRef,
  hasNextPage,
  isFetchingNextPage,
}: MessagesAreaProps) {
  if (!selectedUserId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectUser(null)}
            className="md:hidden p-2 hover:bg-accent rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border">
            {selectedConversation?.user.profilePicture ? (
              <Image
                src={selectedConversation.user.profilePicture}
                alt={selectedConversation.user.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold">
              {selectedConversation?.user.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {enableEncryption && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs">
              <Lock className="h-3.5 w-3.5" />
              <span>E2EE</span>
            </div>
          )}
          {encryption && !encryption.hasKeys && (
            <button
              onClick={onShowKeyPairModal}
              className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition-colors"
              title="Aktifkan enkripsi end-to-end"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Aktifkan E2EE</span>
            </button>
          )}
          {encryption && encryption.hasKeys && (
            <button
              type="button"
              onClick={onGenerateKeyPair}
              className="p-1 rounded-full hover:bg-accent transition-colors"
              title="Generate ulang key E2EE"
            >
              <Key className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        data-lenis-prevent
      >
        {loadingMessages && messages.length === 0 ? (
          <MessageSkeleton count={6} />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground/70 mt-2">Start a conversation!</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Load more trigger */}
            {hasNextPage && (
              <div ref={loadMoreTriggerRef} className="flex justify-center py-2">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Loading older messages...</span>
                  </div>
                ) : (
                  <div className="h-1 w-full" />
                )}
              </div>
            )}

            <MessageList
              messages={messages}
              userId={userId}
              playingAudioId={playingAudioId}
              onPlayAudio={onPlayAudio}
              onPauseAudio={onPauseAudio}
              onViewImage={onViewImage}
              audioRefs={audioRefs}
            />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {selectedMedia && (
        <MediaPreview
          selectedMedia={selectedMedia}
          recordingTime={0}
          uploading={uploading}
          uploadProgress={0}
          onCancel={() => {
            // Will be handled by parent
          }}
          onPlayAudio={(preview) => {
            // Will be handled by parent
          }}
        />
      )}

      {/* Input */}
      <MessageInput
        newMessage={newMessage}
        selectedMedia={selectedMedia}
        uploading={uploading}
        isRecording={isRecording}
        onMessageChange={onMessageChange}
        onFileSelect={onFileSelect}
        onSend={onSend}
      />
    </>
  );
}

