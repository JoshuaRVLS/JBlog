"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
  alt?: string;
}

export default function ImageViewer({ imageUrl, onClose, alt = "Image" }: ImageViewerProps) {
  useEffect(() => {
    if (imageUrl) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [imageUrl]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && imageUrl) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        aria-label="Close image viewer"
      >
        <X className="h-6 w-6" />
      </button>
      
      <div
        className="relative max-w-[95vw] max-h-[95vh] w-auto h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={alt}
          width={1920}
          height={1080}
          className="max-w-full max-h-[95vh] w-auto h-auto object-contain rounded-lg"
          priority
          quality={90}
          sizes="95vw"
        />
      </div>
    </div>
  );
}

