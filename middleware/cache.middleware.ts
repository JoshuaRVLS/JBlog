import type { Request, Response, NextFunction } from "express";

/**
 * Cache middleware untuk GET requests
 * Menambahkan cache headers untuk meningkatkan performance
 */
export const cacheMiddleware = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Don't cache authenticated requests or admin routes
    if (req.path.includes("/admin") || req.path.includes("/auth") || req.userId) {
      return next();
    }

    // Set cache headers
    res.set({
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=60`,
      "Vary": "Accept-Encoding",
    });

    next();
  };
};

/**
 * No-cache middleware untuk dynamic content
 */
export const noCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  next();
};

