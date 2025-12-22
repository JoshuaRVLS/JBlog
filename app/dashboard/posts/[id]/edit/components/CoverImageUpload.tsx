"use client";

import { useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface CoverImageUploadProps {
  coverImage: string | null;
  coverImagePreview: string | null;
  uploading: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export default function CoverImageUpload({
  coverImage,
  coverImagePreview,
  uploading,
  onImageChange,
  onRemove,
}: CoverImageUploadProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">Cover Image</label>
      <div className="relative">
        {coverImagePreview ? (
          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
            <Image
              src={coverImagePreview}
              alt="Cover preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:opacity-90 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => coverInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload cover image</p>
              </>
            )}
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

