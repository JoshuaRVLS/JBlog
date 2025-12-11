import type { Request, Response } from "express";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { RegisterSchema } from "../schemas/register.schema";
import { sendVerification } from "./email.controller";
import bcrypt from "bcryptjs";
import { generateVerificationToken } from "../lib/generator";

export const createUser = async (req: Request, res: Response) => {
  try {
    const result = await RegisterSchema.safeParseAsync(req.body);
    if (!result.success) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ errors: z.treeifyError(result.error) });
    }
    console.log(result.data);
    const { email, name, password, confirmPassword } = result.data;

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());

    console.log(hashedPassword);

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Send Verification Code

    const verificationCode = generateVerificationToken();

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

    await db.verificationCode.upsert({
      update: {
        value: verificationCode,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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

    res.json({
      msg: "Register behasil dan Verifikasi kode terkirim",
      userId: user.id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Login failed",
    });
  }
};
