import type { Response } from "express";
import multer from "multer";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import { supabase, BUCKETS } from "../lib/supabase";
import db from "../lib/db";

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
};

// Setup multer untuk memory storage (karena kita upload ke Supabase)
const storage = multer.memoryStorage();

// Filter untuk hanya menerima gambar
const imageFilter = (req: any, file: MulterFile, cb: (error: Error | null, acceptFile?: boolean) => void) => {
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
const mediaFilter = (req: any, file: MulterFile, cb: (error: Error | null, acceptFile?: boolean) => void) => {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");
  const isAudio = file.mimetype.startsWith("audio/");

  if (isImage || isVideo || isAudio) {
    return cb(null, true);
  } else {
    cb(new Error("Hanya file image, video, atau audio yang diizinkan"));
  }
};

// Dynamic file size limit - will be checked in controller based on J+ status
export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max (will be validated in controller)
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
    const fileBuffer = file.buffer;
    if (!fileBuffer) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "File buffer tidak tersedia" });
    }

    const { data, error } = await supabase.storage
      .from(BUCKETS.IMAGES)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Error upload ke Supabase:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Gagal upload image ke storage",
        details: error.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.IMAGES)
      .getPublicUrl(filePath);

    console.log(`Image berhasil diupload ke Supabase - ${filePath}`);
    res.status(StatusCodes.OK).json({
      msg: "Image berhasil diupload",
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("Error upload image:", error);
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
    const fileExt = file.originalname.split(".").pop()?.toLowerCase();
    const isGif = fileExt === "gif" || file.mimetype === "image/gif";

    // Get user J+ status
    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: {
        isJPlus: true,
        jPlusExpiresAt: true,
        jPlusTier: true,
      },
    });

    const hasActiveJPlus = user?.isJPlus && (
      !user.jPlusExpiresAt || 
      new Date(user.jPlusExpiresAt) > new Date()
    );

    // Check if user has J+ for GIF profile pictures
    if (isGif && !hasActiveJPlus) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "Fitur GIF profile picture hanya tersedia untuk member J+. Upgrade ke J+ untuk menggunakan fitur ini!",
        requiresJPlus: true,
      });
    }

    // Check file size limits - J+ supporters get 50MB
    const maxFileSize = hasActiveJPlus 
      ? 50 * 1024 * 1024 // 50MB for J+ supporters
      : 5 * 1024 * 1024; // 5MB for non-J+ users

    if (file.size > maxFileSize) {
      const maxSizeMB = maxFileSize / (1024 * 1024);
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: `Ukuran file maksimal ${maxSizeMB}MB. ${!hasActiveJPlus ? 'Upgrade ke J+ untuk upload file lebih besar!' : ''}`,
        requiresJPlus: !hasActiveJPlus,
      });
    }

    const fileName = `${req.userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // Upload ke Supabase Storage (replace existing jika ada)
    const fileBuffer = file.buffer;
    if (!fileBuffer) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "File buffer tidak tersedia" });
    }

    const { data, error } = await supabase.storage
      .from(BUCKETS.AVATARS)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: true, // Replace existing file
      });

    if (error) {
      console.error("Error upload avatar ke Supabase:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Gagal upload avatar ke storage",
        details: error.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.AVATARS)
      .getPublicUrl(filePath);

    console.log(`Avatar berhasil diupload ke Supabase - ${filePath}`);
    res.status(StatusCodes.OK).json({
      msg: "Avatar berhasil diupload",
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("Error upload avatar:", error);
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
    const fileBuffer = file.buffer;
    if (!fileBuffer) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "File buffer tidak tersedia" });
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Error upload media ke Supabase:", error);
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

    console.log(`Media berhasil diupload ke Supabase - ${filePath} (${mediaType})`);
    res.status(StatusCodes.OK).json({
      msg: "Media berhasil diupload",
      url: urlData.publicUrl,
      path: filePath,
      type: mediaType,
      mimetype: file.mimetype,
    });
  } catch (error: any) {
    console.error("Error upload media:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal upload media",
      details: error.message,
    });
  }
};
