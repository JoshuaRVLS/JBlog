import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(3, "Nama minimal 3 karakter")
      .max(100, "Nama maksimal 100 karakter")
      .trim()
      .refine((val) => !/<[^>]*>/.test(val), "Nama tidak boleh mengandung HTML"),
    email: z
      .string()
      .email("Format email tidak valid")
      .toLowerCase()
      .trim()
      .max(255, "Email maksimal 255 karakter"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(100, "Password maksimal 100 karakter")
      .regex(
        passwordRegex,
        "Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });
