import { decrypt, encrypt, verify } from "../lib/jwt";
import { LoginSchema } from "../schemas/login.schema";
import type { Request, Response } from "express";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await LoginSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ errors: z.treeifyError(result.error), msg: "Login Gagal" });
    }

    const { email, password } = result.data;

    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Wrong Email or Password" });
    }

    const accessToken = await encrypt({ id: user.id }, "15m");

    const refreshToken = await encrypt({ id: user.id }, "7d");

    await db.refreshToken.upsert({
      create: {
        value: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      update: {
        value: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      where: {
        userId: user.id,
      },
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(StatusCodes.OK).json({ msg: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Login failed",
    });
  }
};
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await db.refreshToken.deleteMany({
        where: {
          value: refreshToken,
        },
      });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ msg: "Logout berhasil" });
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal Server Error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    const storedRefreshToken = await db.refreshToken.findFirst({
      where: {
        value: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedRefreshToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Refresh Token Expired" });
    }

    if (refreshToken !== storedRefreshToken.value) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Refresh Token Invalid" });
    }

    const newAccessToken = await encrypt(
      { id: storedRefreshToken.userId },
      "15m"
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ userId: storedRefreshToken.userId });
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal Server Error" });
  }
};

export const validate = async (req: Request, res: Response) => {
  console.log(req.cookies);
  const { accessToken, refreshToken } = req.cookies;

  try {
    const token = await db.refreshToken.findFirst({
      where: {
        value: refreshToken,
      },
    });
    if (!token) return res.json({ userId: null });
  } catch (error) {
    console.log(error);
  }

  if (!accessToken) {
    return res.status(401).json({ tokenValid: false });
  }
  const userId = await verify(accessToken);
  return res.json({ userId });
};
