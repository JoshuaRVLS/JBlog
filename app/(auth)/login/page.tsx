"use client";

import { AuthContext } from "@/providers/AuthProvider";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await login(data);
      // Login successful, redirect handled by AuthProvider
    } catch (error) {
      if (error instanceof AxiosError) {
        const response = error.response?.data;
        
        // Handle unverified user
        if (response?.requiresVerification && response?.userId) {
          toast.error(response.msg, { duration: 5000 });
          router.push(`/verify-email/${response.userId}`);
          return;
        }
        
        // Other errors are already handled by AuthProvider
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <ParticleBackground className="absolute inset-0 z-0" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full mx-auto">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg shadow-primary/20">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mb-2">
              JBlog
            </h1>
            <p className="text-muted-foreground">Selamat datang kembali!</p>
          </div>

          {/* Login Card */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Masuk ke Akun</h2>
              <p className="text-sm text-muted-foreground">
                Login untuk bisa like dan comment di postingan
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                label="Email"
                type="email"
                placeholder="nama@email.com"
                {...register("email", {
                  required: "Email wajib diisi",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Format email tidak valid"
                  }
                })}
                error={errors.email?.message as string}
                className="h-11"
              />

              <FormInput
                label="Password"
                type="password"
                placeholder="Masukkan password"
                {...register("password", {
                  required: "Password wajib diisi",
                  minLength: {
                    value: 6,
                    message: "Password minimal 6 karakter"
                  }
                })}
                error={errors.password?.message as string}
                className="h-11"
              />

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Lupa password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Atau</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Dengan masuk, kamu menyetujui{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Syarat & Ketentuan
            </Link>{" "}
            dan{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Kebijakan Privasi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
