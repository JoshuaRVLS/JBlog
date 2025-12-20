import Image from "next/image";
import { X, Play } from "lucide-react";

interface MediaPreviewProps {
  selectedMedia: {
    file: File;
    preview: string;
    type: "image" | "video" | "audio";
  };
  recordingTime: number;
  uploading: boolean;
  uploadProgress: number;
  onCancel: () => void;
  onPlayAudio: (preview: string) => void;
}

export default function MediaPreview({
  selectedMedia,
  recordingTime,
  uploading,
  uploadProgress,
  onCancel,
  onPlayAudio,
}: MediaPreviewProps) {
  return (
    <div className="p-4 border-t border-border bg-muted/30">
      <div className="relative">
        {selectedMedia.type === "image" && (
          <div className="relative rounded-lg overflow-hidden max-w-xs">
            <Image
              src={selectedMedia.preview}
              alt="Preview"
              width={300}
              height={300}
              className="w-full h-auto rounded-lg"
              unoptimized
            />
            <button
              onClick={onCancel}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {selectedMedia.type === "video" && (
          <div className="relative rounded-lg overflow-hidden max-w-xs">
            <video
              src={selectedMedia.preview}
              controls
              className="w-full h-auto rounded-lg max-h-48"
            />
            <button
              onClick={onCancel}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {selectedMedia.type === "audio" && (
          <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
            <button
              onClick={() => onPlayAudio(selectedMedia.preview)}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Play className="h-5 w-5 ml-0.5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {recordingTime > 0
                  ? `${Math.floor(recordingTime / 60)}:${String(recordingTime % 60).padStart(2, "0")}`
                  : "Voice recording"}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {uploading && (
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

