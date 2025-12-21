import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import db from "../lib/db";
import { generateVerificationToken } from "../lib/generator";
import { encrypt, generateTokenId } from "../lib/jwt";
import { getVerificationEmailTemplate } from "../lib/emailTemplate";
import { EncryptionService } from "../lib/encryption";
import { getEmailSender } from "../lib/emailSender";

export const sendVerification = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId)
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Empty userId" });

  const user = await db.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "User no longer exists" });

  const verificationCode = generateVerificationToken();

  // Update or create verification code in database
  await db.verificationCode.upsert({
    update: {
      value: verificationCode,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    create: {
      value: verificationCode,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userId: user.id,
    },
    where: {
      userId: user.id,
    },
  });

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY as string,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: getEmailSender(),
        to: [
          {
            email: user.email,
            name: user.name,
          },
        ],
        subject: "JBlog - Kode Verifikasi Email Anda",
        htmlContent: getVerificationEmailTemplate(
          user.name,
          verificationCode,
          `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email/${user.id}?code=${verificationCode}`
        ),
      }),
    });
    
    res.json({ msg: "Kode verifikasi telah dikirim ke email kamu" });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: "Gagal mengirim email, tetapi kode telah dibuat. Silakan coba lagi nanti." 
    });
  }
};

export const verifyVerification = async (req: Request, res: Response) => {
  const { code } = req.params;
  console.log(req.params);
  try {
    const storedCode = await db.verificationCode.findUnique({
      where: {
        value: code,
        expiredAt: { gt: new Date() },
      },
    });

    if (!storedCode)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Kode tidak ada atau sudah expired" });

    await db.user.update({
      data: {
        isVerified: true,
      },
      where: {
        id: storedCode.userId,
      },
    });

    await db.verificationCode.delete({
      where: {
        id: storedCode.id,
      },
    });

    // Generate default avatar untuk user yang baru verifikasi
    const user = await db.user.findUnique({
      where: { id: storedCode.userId },
      select: { name: true, profilePicture: true },
    });

    // Jika belum punya profile picture, generate default avatar
    if (!user?.profilePicture && user?.name) {
      const initial = user.name.charAt(0).toUpperCase();
      const colors = [
        "6366f1", // indigo
        "8b5cf6", // purple
        "ec4899", // pink
        "f59e0b", // amber
        "10b981", // emerald
        "3b82f6", // blue
        "ef4444", // red
        "14b8a6", // teal
      ];
      const colorIndex = initial.charCodeAt(0) % colors.length;
      const backgroundColor = colors[colorIndex];
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${backgroundColor}&color=fff&size=200&bold=true&font-size=0.5`;
      
      await db.user.update({
        where: { id: storedCode.userId },
        data: { profilePicture: avatarUrl },
      });
    }

    // Auto login setelah verifikasi berhasil
    const accessToken = await encrypt({ id: storedCode.userId }, "15m", generateTokenId());
    const refreshTokenId = generateTokenId();
    const refreshToken = await encrypt({ id: storedCode.userId }, "7d", refreshTokenId);

    // Simpan refresh token baru (multi-device support, tidak lagi one-to-one)
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.refreshToken.create({
      data: {
        value: refreshToken,
        userId: storedCode.userId,
        expiresAt: refreshTokenExpiresAt,
        isRevoked: false,
      },
    });

    // Set cookies untuk auto login - samakan dengan pola di auth.controller
    const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Auto-generate encryption key pair for new user after verification
    try {
      const existingKey = await db.encryptionKey.findFirst({
        where: {
          userId: storedCode.userId,
          keyType: "ecdh",
          isActive: true,
        },
      });

      if (!existingKey) {
        const keyPair = EncryptionService.generateKeyPair();
        await db.encryptionKey.create({
          data: {
            userId: storedCode.userId,
            publicKey: keyPair.publicKey,
            keyType: "ecdh",
            isActive: true,
          },
        });
        console.log(`Encryption key pair auto-generated for user ${storedCode.userId}`);
      }
    } catch (keyError: any) {
      // Don't fail verification if key generation fails
      console.error(`Failed to auto-generate encryption key pair:`, keyError);
    }

    console.log(`Email terverifikasi dan user auto login - User ID: ${storedCode.userId}`);
    res.json({ 
      msg: "Verifikasi akun berhasil!",
      userId: storedCode.userId,
      redirectTo: "/profile/finalisation"
    });
  } catch (error) {
    console.error("Error verifikasi email:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal verifikasi email" });
  }
};

export const checkVerify = async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        verificationCode: {
          expiredAt: {
            gt: new Date(),
          },
        },
      },
      include: {
        verificationCode: true,
      },
    });

    if (!user)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "User tidak ada atau kode sudah expired" });

    return res.json({
      verified: true,
    });
  } catch (error) {
    console.log(error);
  }
};
