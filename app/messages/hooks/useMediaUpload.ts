import { useState, useRef } from "react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

export function useMediaUpload() {
  const [selectedMedia, setSelectedMedia] = useState<{
    file: File;
    preview: string;
    type: "image" | "video" | "audio";
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setSelectedMedia({
        file,
        preview: URL.createObjectURL(file),
        type: "image",
      });
    } else if (file.type.startsWith("video/")) {
      setSelectedMedia({
        file,
        preview: URL.createObjectURL(file),
        type: "video",
      });
    } else {
      toast.error("Hanya file gambar dan video yang diizinkan");
    }
  };

  const uploadMedia = async (): Promise<string> => {
    if (!selectedMedia) throw new Error("No media selected");

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append(
        selectedMedia.type === "image" ? "image" : "video",
        selectedMedia.file
      );

      const response = await AxiosInstance.post(
        `/upload/${selectedMedia.type}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        }
      );

      return response.data.url;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const clearMedia = () => {
    if (selectedMedia?.preview) {
      URL.revokeObjectURL(selectedMedia.preview);
    }
    setSelectedMedia(null);
  };

  return {
    selectedMedia,
    uploading,
    uploadProgress,
    handleFileSelect,
    uploadMedia,
    clearMedia,
  };
}

