import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { Request } from "express";
import db from "../lib/db";
import { encrypt, generateTokenId } from "../lib/jwt";

/**
 * Get client device information for security tracking
 */
const getDeviceInfo = (req: Request): string => {
  const userAgent = req.headers["user-agent"] || "Unknown";
  return userAgent.substring(0, 200);
};

/**
 * Get client IP address
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "Unknown";
};

/**
 * Get cookie options
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  };
};

/**
 * Handle OAuth callback and create/login user
 */
const handleOAuthCallback = async (
  req: Request,
  res: Response,
  provider: "google" | "github",
  profile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }
) => {
  try {
    const { id, email, name, picture } = profile;

    if (!email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Email tidak ditemukan dari provider" });
    }

    // Check if user exists by OAuth ID
    const oauthField = provider === "google" ? "googleId" : "githubId";
    let user = await db.user.findFirst({
      where: {
        [oauthField]: id,
      },
    });

    // If not found by OAuth ID, check by email
    if (!user) {
      user = await db.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link OAuth account to existing user
        await db.user.update({
          where: { id: user.id },
          data: {
            [oauthField]: id,
            oauthProvider: provider,
            // Update profile picture if not set
            ...(picture && !user.profilePicture && { profilePicture: picture }),
          },
        });
      } else {
        // Create new user
        user = await db.user.create({
          data: {
            name,
            email,
            [oauthField]: id,
            oauthProvider: provider,
            password: "", // Empty password for OAuth users
            profilePicture: picture || null,
            isVerified: true, // OAuth emails are pre-verified
          },
        });
      }
    } else {
      // Update user info if changed
      await db.user.update({
        where: { id: user.id },
        data: {
          name,
          ...(picture && { profilePicture: picture }),
        },
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      const now = new Date();
      if (user.suspendedUntil && user.suspendedUntil < now) {
        await db.user.update({
          where: { id: user.id },
          data: { isSuspended: false, suspendedUntil: null },
        });
      } else {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({
            error: "Akun Anda telah di-suspend",
            isSuspended: true,
            suspendedUntil: user.suspendedUntil,
          });
      }
    }

    // Generate tokens
    const refreshTokenId = generateTokenId();
    const accessToken = await encrypt({ id: user.id }, "15m", generateTokenId());
    const refreshToken = await encrypt({ id: user.id }, "7d", refreshTokenId);

    // Store refresh token
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getClientIp(req);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.refreshToken.create({
      data: {
        value: refreshToken,
        userId: user.id,
        expiresAt,
        deviceInfo,
        ipAddress,
        isRevoked: false,
      },
    });

    const cookieOptions = getCookieOptions();

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`${provider} OAuth login berhasil - User: ${user.email}`);
    
    // Redirect to frontend with success
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/dashboard?oauth=success`);
  } catch (error: any) {
    console.error(`Error ${provider} OAuth callback:`, error);
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

/**
 * Google OAuth callback
 */
export const googleCallback = async (req: Request, res: Response) => {
  try {
    // Get token from query or body
    const { code } = req.query;
    
    if (!code) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Authorization code tidak ditemukan" });
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokens = await tokenResponse.json();
    const { access_token } = tokens;

    // Get user info from Google
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const googleUser = await userResponse.json();

    await handleOAuthCallback(req, res, "google", {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });
  } catch (error: any) {
    console.error("Error Google OAuth:", error);
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

/**
 * GitHub OAuth callback
 */
export const githubCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Authorization code tidak ditemukan" });
    }

    // Exchange code for token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID || "",
          client_secret: process.env.GITHUB_CLIENT_SECRET || "",
          code: code as string,
          redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/github/callback`,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokens = await tokenResponse.json();
    const { access_token } = tokens;

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const githubUser = await userResponse.json();

    // Get user email (might need separate API call)
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary) || emails[0];
        email = primaryEmail?.email;
      }
    }

    if (!email) {
      throw new Error("Email tidak ditemukan dari GitHub");
    }

    await handleOAuthCallback(req, res, "github", {
      id: githubUser.id.toString(),
      email,
      name: githubUser.name || githubUser.login,
      picture: githubUser.avatar_url,
    });
  } catch (error: any) {
    console.error("Error GitHub OAuth:", error);
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

/**
 * Get OAuth authorization URL
 */
export const getGoogleAuthUrl = (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables.",
    });
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/google/callback`;
  const scope = "openid email profile";
  const responseType = "code";

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: responseType,
    scope,
    access_type: "offline",
    prompt: "consent",
  })}`;

  res.json({ url: authUrl });
};

export const getGithubAuthUrl = (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID in environment variables.",
    });
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/github/callback`;
  const scope = "user:email";

  const authUrl = `https://github.com/login/oauth/authorize?${new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    scope,
  })}`;

  res.json({ url: authUrl });
};

