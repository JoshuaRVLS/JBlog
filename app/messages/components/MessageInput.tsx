import { Plus, Send, Loader2 } from "lucide-react";

interface MessageInputProps {
  newMessage: string;
  selectedMedia: {
    file: File;
    preview: string;
    type: "image" | "video" | "audio";
  } | null;
  uploading: boolean;
  isRecording: boolean;
  onMessageChange: (message: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
}

export default function MessageInput({
  newMessage,
  selectedMedia,
  uploading,
  isRecording,
  onMessageChange,
  onFileSelect,
  onSend,
}: MessageInputProps) {
  return (
    <div className="p-4 border-t border-border">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="media-upload"
            accept="image/*,video/*"
            onChange={onFileSelect}
            className="hidden"
          />
          <label
            htmlFor="media-upload"
            className="flex-shrink-0 p-2 rounded-lg bg-muted hover:bg-accent transition-colors cursor-pointer"
            title="Tambah media"
          >
            <Plus className="h-5 w-5 text-primary" />
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={selectedMedia ? "Add caption (optional)..." : "Type a message..."}
            className="flex-1 px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <button
            onClick={onSend}
            disabled={(!newMessage.trim() && !selectedMedia) || uploading || isRecording}
            className="flex-shrink-0 px-4 md:px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

