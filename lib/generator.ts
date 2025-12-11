import crypto from "crypto";

export function generateVerificationToken(): string {
  return crypto.randomInt(111111, 999999).toString();
}
