import type { Request, Response } from "express";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { generateVerificationToken } from "../lib/generator";
import crypto from "crypto";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Email harus diisi" });
    }

    let user;
    try {
      user = await db.user.findUnique({
        where: { email },
      });
    } catch (dbError: any) {
      console.error("Error database di forgotPassword:", dbError);
      if (dbError.code === "P2022" || dbError.message?.includes("does not exist")) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Database schema belum di-sync. Jalankan: npx prisma db push && npx prisma generate",
        });
      }
      throw dbError;
    }

    // Jangan reveal apakah user ada atau tidak untuk keamanan
    if (!user) {
      return res.json({
        msg: "Jika email terdaftar, link reset password sudah dikirim.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this user
    try {
      await db.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new reset token
      await db.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt,
        },
      });
    } catch (dbError: any) {
      console.error("Error database membuat reset token:", dbError);
      if (dbError.code === "P2022" || dbError.message?.includes("does not exist")) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Database schema belum di-sync. Jalankan: npx prisma db push && npx prisma generate",
        });
      }
      throw dbError;
    }

    // Send email with reset link
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
          subject: "Reset Password - JBlog",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset Password Kamu</h2>
              <p>Halo ${user.name},</p>
              <p>Kamu minta reset password. Klik link di bawah untuk reset:</p>
              <p>
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                  Reset Password
                </a>
              </p>
              <p>Atau copy paste link ini ke browser:</p>
              <p style="word-break: break-all; color: #666;">
                ${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}
              </p>
              <p>Link ini akan kadaluarsa dalam 1 jam.</p>
              <p>Kalau kamu tidak minta ini, abaikan email ini aja.</p>
              <p>Salam,<br>Tim JBlog</p>
            </div>
          `,
        }),
      });
    } catch (error) {
      console.error("Error kirim email:", error);
      // Jangan gagal request jika email gagal
    }

    console.log(`Link reset password dikirim ke: ${user.email}`);
    res.json({
      msg: "Jika email terdaftar, link reset password sudah dikirim.",
    });
  } catch (error) {
    console.error("Error forgot password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal memproses request" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Token, password, dan konfirmasi password harus diisi" });
    }

    if (password !== confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Password tidak cocok" });
    }

    if (password.length < 6) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Password minimal 6 karakter" });
    }

    // Find reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Token reset tidak valid atau sudah kadaluarsa" });
    }

    if (resetToken.used) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Token reset ini sudah pernah dipakai" });
    }

    if (resetToken.expiresAt < new Date()) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Token reset sudah kadaluarsa" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await db.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Hapus semua refresh tokens untuk keamanan
    await db.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    console.log(`Password berhasil direset - User: ${resetToken.user.email}`);
    res.json({ msg: "Password berhasil direset. Silakan login dengan password baru." });
  } catch (error) {
    console.error("Error reset password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal reset password" });
  }
};

export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Token harus diisi" });
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return res.status(StatusCodes.NOT_FOUND).json({ valid: false });
    }

    if (resetToken.used || resetToken.expiresAt < new Date()) {
      return res.json({ valid: false });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error("Error verifikasi reset token:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal verifikasi token" });
  }
};

