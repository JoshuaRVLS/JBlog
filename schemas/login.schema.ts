import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Format email tidak valid")
    .toLowerCase()
    .trim()
    .max(255, "Email maksimal 255 karakter"),
  password: z.string().min(1, "Password tidak boleh kosong").max(100, "Password maksimal 100 karakter"),
});
