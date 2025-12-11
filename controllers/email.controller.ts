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

    res.json({ msg: "Verifikasi akun berhasil!" });
  } catch (error) {
    console.log(error);
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
