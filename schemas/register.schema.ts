import { z } from "zod";

export const RegisterSchema = z.object({
    name: z.string().min(3).max(100),
    email: z.string(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100)
})