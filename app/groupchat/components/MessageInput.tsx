"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Send,
  Loader2,
  Image as ImageIcon,
  Video,
  Mic,
  VideoIcon,
  X,
  Plus,
  Users,
  Pause,
} from "lucide-react";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { GroupChat, SelectedMedia } from "../types";
import { useMentions } from "../hooks/useMentions";
import { useMediaUpload } from "../hooks/useMediaUpload";
import ConfirmModal from "@/components/modals/ConfirmModal";

interface MessageInputProps {
  messageInput: string;
  setMessageInput: (value: string) => void;
  selectedGroup: GroupChat | null;
  userId: string | null;
  currentUserProfile: { name: string; profilePicture: string | null } | null;
  socket: any;
  sending: boolean;
  isUserMember: boolean;
  onSendMessage: (e?: React.FormEvent) => void;
  onTyping: (groupId: string) => void;
  onStopTyping: (groupId: string) => void;
}

export default function MessageInput({
  messageInput,
  setMessageInput,
  selectedGroup,
  userId,
  currentUserProfile,
  socket,
  sending,
  isUserMember,
  onSendMessage,
  onTyping,
  onStopTyping,
}: MessageInputProps) {
  const messageInputRef = useRef<HTMLInputElement>(null);
  const mediaMenuRef = useRef<HTMLDivElement>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    showMentionSuggestions,
    selectedMentionIndex,
    showEveryoneWarning,
    getMentionSuggestions,
    handleMessageInputChange: handleMentionInputChange,
    insertMention,
    confirmEveryoneMention,
    handleKeyDown: handleMentionKeyDown,
    setShowMentionSuggestions,
    setShowEveryoneWarning,
  } = useMentions({
    selectedGroup,
    userId,
    messageInput,
    messageInputRef,
  });

  const {
    uploadingMedia,
    selectedMedia,
    recordingAudio,
    recordingVideo,
    videoPreviewRef,
    fileInputRef,
    videoInputRef,
    handleFileSelect,
    uploadAndSendMedia,
    startAudioRecording,
    stopAudioRecording,
    startVideoRecording,
    stopVideoRecording,
    clearSelectedMedia,
  } = useMediaUpload({
    userId,
    currentUserProfile,
    onMediaUploaded: (message) => {
      // Handle media uploaded - will be handled by parent
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    handleMentionInputChange(e);

    if (socket && selectedGroup && value.trim().length > 0) {
      onTyping(selectedGroup.id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socket && selectedGroup) {
          onStopTyping(selectedGroup.id);
        }
      }, 1000);
    } else if (socket && selectedGroup && value.trim().length === 0) {
      onStopTyping(selectedGroup.id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const result = handleMentionKeyDown(e, () => {
      onSendMessage();
    });

    if (result === true) {
      return;
    }

    if (typeof result === "string") {
      setMessageInput(result);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleInsertMention = (username: string, isEveryone: boolean = false) => {
    const newText = insertMention(username, isEveryone);
    if (newText) {
      setMessageInput(newText);
    }
  };

  const handleSendWithMedia = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedMedia || !socket || !selectedGroup) return;

    try {
      await uploadAndSendMedia(selectedMedia, selectedGroup.id, socket, messageInput.trim());
      setMessageInput("");
    } catch (error) {
      console.error("Error sending media:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mediaMenuRef.current && !mediaMenuRef.current.contains(event.target as Node)) {
        setShowMediaMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedGroup) return null;

  return (
    <>
      {/* Media Preview */}
      {selectedMedia && (
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-4">
            {selectedMedia.type === "image" && selectedMedia.preview && (
              <div className="relative">
                <Image
                  src={selectedMedia.preview}
                  alt="Preview"
                  width={100}
                  height={100}
                  className="rounded-lg object-cover"
                />
                <button
                  onClick={clearSelectedMedia}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:opacity-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {selectedMedia.type === "video" && selectedMedia.preview && (
              <div className="relative">
                <video
                  src={selectedMedia.preview}
                  className="w-32 h-32 rounded-lg object-cover"
                  controls={false}
                />
                <button
                  onClick={clearSelectedMedia}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:opacity-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {selectedMedia.type === "audio" && (
              <div className="flex items-center gap-2 flex-1">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Audio Recording</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedMedia.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={clearSelectedMedia}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-destructive" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Recording Preview */}
      {recordingVideo && (
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="relative">
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              className="w-full max-h-64 rounded-lg bg-black"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-destructive/80 text-white px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording...</span>
              </div>
              <button
                onClick={stopVideoRecording}
                className="p-3 bg-destructive text-destructive-foreground rounded-full hover:opacity-90"
              >
                <Pause className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input Form */}
      <form
        onSubmit={selectedMedia ? handleSendWithMedia : onSendMessage}
        className="p-2 sm:p-4 border-t border-border/50"
      >
        <div className="flex gap-2">
          {/* Media Buttons */}
          <div className="relative" ref={mediaMenuRef}>
            {/* Mobile: Single + button */}
            <button
              type="button"
              onClick={() => setShowMediaMenu(!showMediaMenu)}
              disabled={uploadingMedia || recordingAudio || recordingVideo || !isUserMember}
              className="md:hidden p-3 rounded-lg hover:bg-accent/50 transition-colors disabled:opacity-50"
              title="Media Options"
            >
              <Plus className="h-5 w-5 text-foreground" />
            </button>

            {/* Mobile: Media Menu Dropdown */}
            {showMediaMenu && (
              <div className="md:hidden absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[160px]">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMediaMenu(false);
                  }}
                  disabled={uploadingMedia || recordingAudio || recordingVideo}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left disabled:opacity-50"
                >
                  <ImageIcon className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    videoInputRef.current?.click();
                    setShowMediaMenu(false);
                  }}
                  disabled={uploadingMedia || recordingAudio || recordingVideo}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left disabled:opacity-50"
                >
                  <Video className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (recordingAudio) {
                      stopAudioRecording();
                    } else {
                      startAudioRecording();
                    }
                    setShowMediaMenu(false);
                  }}
                  disabled={uploadingMedia || recordingVideo || !!selectedMedia}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left disabled:opacity-50 ${
                    recordingAudio ? "bg-destructive/10" : ""
                  }`}
                >
                  <Mic className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">
                    {recordingAudio ? "Stop Audio" : "Audio"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (recordingVideo) {
                      stopVideoRecording();
                    } else {
                      startVideoRecording();
                    }
                    setShowMediaMenu(false);
                  }}
                  disabled={uploadingMedia || recordingAudio || !!selectedMedia}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left disabled:opacity-50 ${
                    recordingVideo ? "bg-destructive/10" : ""
                  }`}
                >
                  <VideoIcon className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">
                    {recordingVideo ? "Stop Video" : "Video Record"}
                  </span>
                </button>
              </div>
            )}

            {/* Desktop: Show all buttons */}
            <div className="hidden md:flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia || recordingAudio || recordingVideo || !isUserMember}
                className="p-2 rounded-lg hover:bg-accent/50 transition-colors disabled:opacity-50"
                title="Upload Photo"
              >
                <ImageIcon className="h-5 w-5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingMedia || recordingAudio || recordingVideo || !isUserMember}
                className="p-2 rounded-lg hover:bg-accent/50 transition-colors disabled:opacity-50"
                title="Upload Video"
              >
                <Video className="h-5 w-5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={recordingAudio ? stopAudioRecording : startAudioRecording}
                disabled={uploadingMedia || recordingVideo || !!selectedMedia || !isUserMember}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  recordingAudio
                    ? "bg-destructive text-destructive-foreground"
                    : "hover:bg-accent/50"
                }`}
                title={recordingAudio ? "Stop Recording" : "Record Audio"}
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={recordingVideo ? stopVideoRecording : startVideoRecording}
                disabled={uploadingMedia || recordingAudio || !!selectedMedia || !isUserMember}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  recordingVideo
                    ? "bg-destructive text-destructive-foreground"
                    : "hover:bg-accent/50"
                }`}
                title={recordingVideo ? "Stop Recording" : "Record Video"}
              >
                <VideoIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Hidden file inputs for mobile */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex-1 relative">
            {!isUserMember && (
              <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <p className="text-sm text-muted-foreground px-4 text-center">
                  Bergabung ke grup terlebih dahulu untuk mengirim pesan
                </p>
              </div>
            )}
            <input
              ref={messageInputRef}
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isUserMember
                  ? "Tulis pesan... (ketik @ untuk mention)"
                  : "Bergabung ke grup untuk mengirim pesan"
              }
              className="w-full px-4 py-4 sm:py-3 text-base rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
              disabled={sending || !socket || uploadingMedia || !isUserMember}
            />

            {/* Mention Suggestions */}
            {showMentionSuggestions && getMentionSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {getMentionSuggestions.map((user, index) => {
                  const isEveryone = (user as any).isEveryone || false;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleInsertMention(user.name, isEveryone)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left ${
                        index === selectedMentionIndex ? "bg-accent" : ""
                      } ${isEveryone ? "border-b border-border/50" : ""}`}
                    >
                      {isEveryone ? (
                        <>
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-primary">@everyone</span>
                            <p className="text-xs text-muted-foreground">Tag semua member</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={
                                user.profilePicture || generateAvatarUrl(user.name)
                              }
                              alt={user.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {user.name}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={
              sending ||
              !socket ||
              uploadingMedia ||
              (!messageInput.trim() && !selectedMedia) ||
              recordingAudio ||
              recordingVideo ||
              !isUserMember
            }
            className="px-4 sm:px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
            title={!isUserMember ? "Bergabung ke grup terlebih dahulu" : "Kirim pesan"}
          >
            {sending || uploadingMedia ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      {/* Everyone Warning Modal */}
      <ConfirmModal
        isOpen={showEveryoneWarning}
        onClose={() => setShowEveryoneWarning(false)}
        onConfirm={() => {
          const newText = confirmEveryoneMention();
          if (newText) {
            setMessageInput(newText);
          }
        }}
        title="Tag Semua Member?"
        message="Anda akan mengirim notifikasi ke semua member di grup ini. Lanjutkan?"
        confirmText="Ya, Tag Semua"
        cancelText="Batal"
      />
    </>
  );
}

