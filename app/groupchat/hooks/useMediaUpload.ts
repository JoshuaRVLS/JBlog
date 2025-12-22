import { useState, useRef, useCallback } from "react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import { SelectedMedia } from "../types";

interface UseMediaUploadProps {
  userId: string | null;
  currentUserProfile: { name: string; profilePicture: string | null } | null;
  onMediaUploaded: (message: any) => void;
}

export function useMediaUpload({
  userId,
  currentUserProfile,
  onMediaUploaded,
}: UseMediaUploadProps) {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);
      setSelectedMedia({ type: "image", file, preview });
    } else if (file.type.startsWith("video/")) {
      const preview = URL.createObjectURL(file);
      setSelectedMedia({ type: "video", file, preview });
    }
  }, []);

  const uploadAndSendMedia = useCallback(async (media: SelectedMedia, groupId: string, socket: any, messageContent: string = "") => {
    try {
      setUploadingMedia(true);
      const formData = new FormData();
      formData.append("media", media.file);

      const response = await AxiosInstance.post("/upload/chat-media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        content: messageContent || "",
        type: media.type,
        mediaUrl: response.data.url,
        mediaThumbnail: response.data.thumbnail || null,
        createdAt: new Date().toISOString(),
        user: {
          id: userId!,
          name: currentUserProfile?.name || "You",
          profilePicture: currentUserProfile?.profilePicture || null,
        },
      };

      onMediaUploaded(optimisticMessage);

      socket.emit("send-message", {
        groupId,
        content: messageContent,
        type: media.type,
        mediaUrl: response.data.url,
        mediaThumbnail: response.data.thumbnail || null,
      });

      if (media.preview) {
        URL.revokeObjectURL(media.preview);
      }
      setSelectedMedia(null);
    } catch (error: any) {
      console.error("Error uploading media:", error);
      toast.error("Gagal mengupload media");
      throw error;
    } finally {
      setUploadingMedia(false);
    }
  }, [userId, currentUserProfile, onMediaUploaded]);

  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        setSelectedMedia({ type: "audio", file: audioFile });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingAudio(true);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      toast.error("Gagal memulai recording audio");
    }
  }, []);

  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingAudio) {
      mediaRecorderRef.current.stop();
      setRecordingAudio(false);
    }
  }, [recordingAudio]);

  const startVideoRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoStreamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(audioChunksRef.current, { type: "video/webm" });
        const videoFile = new File([videoBlob], "recording.webm", { type: "video/webm" });
        setSelectedMedia({ type: "video", file: videoFile });
        stream.getTracks().forEach((track) => track.stop());
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setRecordingVideo(true);
    } catch (error) {
      console.error("Error starting video recording:", error);
      toast.error("Gagal memulai recording video");
    }
  }, []);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingVideo) {
      mediaRecorderRef.current.stop();
      setRecordingVideo(false);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  }, [recordingVideo]);

  const clearSelectedMedia = useCallback(() => {
    if (selectedMedia?.preview) {
      URL.revokeObjectURL(selectedMedia.preview);
    }
    setSelectedMedia(null);
  }, [selectedMedia]);

  return {
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
    setSelectedMedia,
  };
}

