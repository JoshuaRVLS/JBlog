import { useState, useRef } from "react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import type { Block, ImageBlock } from "../types";

export function useImageUpload(
  updateBlock: (id: string, updater: (block: Block) => Block) => void,
  addBlocks: (blocks: Block[]) => void,
  createId: () => string,
) {
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUploadClick = (blockId: string) => {
    setUploadingBlockId(blockId);
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingBlockId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await AxiosInstance.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl: string = response.data.url;
      const cleanUrl = imageUrl.trim().replace(/^["']|["']$/g, "");

      updateBlock(uploadingBlockId, (block) => {
        if (block.type !== "image") return block;
        return {
          ...block,
          imageUrl: cleanUrl,
        };
      });

      toast.success("Gambar berhasil diupload");
    } catch (error: any) {
      console.error("Error uploading image block:", error);
      toast.error(
        error?.response?.data?.error || "Gagal upload gambar untuk block ini",
      );
    } finally {
      setUploadingBlockId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRootDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan untuk drag & drop");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    try {
      const tempId = createId();
      const tempBlock: ImageBlock = {
        id: tempId,
        type: "image",
        imageUrl: null,
        caption: "",
      };
      addBlocks([tempBlock]);

      const formData = new FormData();
      formData.append("image", file);

      const response = await AxiosInstance.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl: string = response.data.url;
      const cleanUrl = imageUrl.trim().replace(/^["']|["']$/g, "");

      updateBlock(tempId, (block) => {
        if (block.type !== "image") return block;
        return {
          ...block,
          imageUrl: cleanUrl,
        };
      });

      toast.success("Gambar berhasil diupload dari drag & drop");
    } catch (error: any) {
      console.error("Error uploading dropped image:", error);
      toast.error(
        error?.response?.data?.error ||
          "Gagal upload gambar dari drag & drop",
      );
    }
  };

  const handleRootDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer?.types?.includes("Files")) {
      e.preventDefault();
    }
  };

  return {
    uploadingBlockId,
    fileInputRef,
    handleImageUploadClick,
    handleImageFileChange,
    handleRootDrop,
    handleRootDragOver,
  };
}

