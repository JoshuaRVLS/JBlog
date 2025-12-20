import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface TokenPayload {
  id: string;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for token tracking
}

export interface TokenResult {
  payload: TokenPayload;
  expired: boolean;
}

/**
 * Generate a secure random token ID
 */
export const generateTokenId = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Encrypt (sign) JWT token with additional security features
 */
export const encrypt = async (
  payload: { id: string },
  expiresIn: string | number,
  tokenId?: string
): Promise<string> => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const jti = tokenId || generateTokenId();
  
  const signOptions: jwt.SignOptions = {
    algorithm: "HS256",
    issuer: "jblog",
    audience: "jblog-users",
  };
  
  // Handle expiresIn - can be string or number
  // Handle expiresIn - can be string or number
  if (typeof expiresIn === "number") {
    (signOptions as any).expiresIn = expiresIn;
  } else {
    (signOptions as any).expiresIn = expiresIn;
  }
  
  return jwt.sign(
    { ...payload, jti },
    secret,
    signOptions
  );
};

/**
 * Decrypt (verify) JWT token with proper error handling
 */
export const decrypt = async (token: string): Promise<TokenResult> => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "jblog",
      audience: "jblog-users",
    }) as TokenPayload;

    return {
      payload: decoded,
      expired: false,
    };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      // Decode expired token to get payload (for logging purposes)
      const decoded = jwt.decode(token) as TokenPayload;
      return {
        payload: decoded || { id: "" },
        expired: true,
      };
    }
    
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token format");
    }
    
    if (error.name === "NotBeforeError") {
      throw new Error("Token not yet valid");
    }

    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Verify token and return user ID
 */
export const verify = async (token: string): Promise<string> => {
  const result = await decrypt(token);
  
  if (result.expired) {
    throw new Error("Token has expired");
  }
  
  if (!result.payload.id) {
    throw new Error("Invalid token payload: missing user ID");
  }
  
  return result.payload.id;
};

/**
 * Get token expiration date
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    if (!decoded?.exp) return true;
    
    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate < new Date();
  } catch {
    return true;
  }
};
