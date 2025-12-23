import helmet from "helmet";
import type { Express } from "express";

export const setupSecurityHeaders = (app: Express): void => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://ui-avatars.com",
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "http:",
            "https://*.supabase.co",
            "https://ui-avatars.com",
            "https://media.licdn.com",
            "https://raw.githubusercontent.com",
            "https://img.freepik.com",
            "https://encrypted-tbn0.gstatic.com",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:",
          ],
          connectSrc: [
            "'self'",
            "https://*.supabase.co",
            "ws:",
            "wss:",
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
};

