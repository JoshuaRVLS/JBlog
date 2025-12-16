import type { Response } from "express";
import multer from "multer";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import { supabase, BUCKETS } from "../lib/supabase";

// Setup multer untuk memory storage (karena kita upload ke Supabase)
const storage = multer.memoryStorage();

// Filter untuk hanya menerima gambar
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = /\.(jpeg|jpg|png|gif|webp)$/i.test(file.originalname);
  const mimetype = file.mimetype.startsWith("image/");

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Hanya file gambar yang diizinkan (jpeg, jpg, png, gif, webp)"));
  }
};

// Filter untuk media (image, video, audio)
const mediaFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");
  const isAudio = file.mimetype.startsWith("audio/");

  if (isImage || isVideo || isAudio) {
    return cb(null, true);
  } else {
    cb(new Error("Hanya file image, video, atau audio yang diizinkan"));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter,
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB untuk video/audio
  fileFilter: mediaFilter,
});

// Upload image handler untuk post images
export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Tidak ada file yang diupload" });
    }

    if (!req.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const file = req.file;
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${req.userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    // Upload ke Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKETS.IMAGES)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("❌ Error upload ke Supabase:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Gagal upload image ke storage",
        details: error.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.IMAGES)
      .getPublicUrl(filePath);

    console.log(`✅ Image berhasil diupload ke Supabase - ${filePath}`);
    res.status(StatusCodes.OK).json({
      msg: "Image berhasil diupload",
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("❌ Error upload image:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal upload image",
      details: error.message,
    });
  }
};

// Upload avatar handler untuk profile pictures
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Tidak ada file yang diupload" });
    }

    if (!req.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const file = req.file;
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${req.userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // Upload ke Supabase Storage (replace existing jika ada)
    const { data, error } = await supabase.storage
      .from(BUCKETS.AVATARS)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // Replace existing file
      });

    if (error) {
      console.error("❌ Error upload avatar ke Supabase:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Gagal upload avatar ke storage",
        details: error.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.AVATARS)
      .getPublicUrl(filePath);

    console.log(`✅ Avatar berhasil diupload ke Supabase - ${filePath}`);
    res.status(StatusCodes.OK).json({
      msg: "Avatar berhasil diupload",
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("❌ Error upload avatar:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal upload avatar",
      details: error.message,
    });
  }
};

// Upload media handler untuk group chat (photo, video, audio)
export const uploadChatMedia = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Tidak ada file yang diupload" });
    }

    if (!req.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const file = req.file;
    const fileExt = file.originalname.split(".").pop();
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const fileName = `${req.userId}/${timestamp}-${random}.${fileExt}`;
    
    // Determine bucket based on file type
    let bucketName = BUCKETS.IMAGES;
    let folderName = "chat";
    
    if (file.mimetype.startsWith("video/")) {
      bucketName = BUCKETS.IMAGES; // Use same bucket, different folder
      folderName = "chat/videos";
    } else if (file.mimetype.startsWith("audio/")) {
      bucketName = BUCKETS.IMAGES;
      folderName = "chat/audio";
    } else if (file.mimetype.startsWith("image/")) {
      bucketName = BUCKETS.IMAGES;
      folderName = "chat/images";
    }

    const filePath = `${folderName}/${fileName}`;

    // Upload ke Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("❌ Error upload media ke Supabase:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Gagal upload media ke storage",
        details: error.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Determine media type
    let mediaType = "image";
    if (file.mimetype.startsWith("video/")) {
      mediaType = "video";
    } else if (file.mimetype.startsWith("audio/")) {
      mediaType = "audio";
    }

    console.log(`✅ Media berhasil diupload ke Supabase - ${filePath} (${mediaType})`);
    res.status(StatusCodes.OK).json({
      msg: "Media berhasil diupload",
      url: urlData.publicUrl,
      path: filePath,
      type: mediaType,
      mimetype: file.mimetype,
    });
  } catch (error: any) {
    console.error("❌ Error upload media:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal upload media",
      details: error.message,
    });
  }
};
