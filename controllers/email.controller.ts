import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import db from "../lib/db";
import { generateVerificationToken } from "../lib/generator";

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

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY as string,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "JCorp",
          email: "jravaellnew@gmail.com",
        },
        to: [
          {
            email: user.email,
            name: user.name,
          },
        ],
        subject: "JBlog Kode Verifikasi",
        htmlContent: `Ini kode verifikasi kamu: ${verificationCode} atau melalui link: http://localhost:3000/verify-email?code=${verificationCode}`,
      }),
    });
  } catch (error) {
    console.log(error);
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

    console.log(`✅ Email terverifikasi - User ID: ${storedCode.userId}`);
    res.json({ 
      msg: "Verifikasi akun berhasil!",
      userId: storedCode.userId,
      redirectTo: "/profile/finalisation"
    });
  } catch (error) {
    console.error("❌ Error verifikasi email:", error);
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
