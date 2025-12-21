"use client";

import { AuthContext } from "@/providers/AuthProvider";
import React, { useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight, Github } from "lucide-react";
import Image from "next/image";
import ParticleBackground from "@/components/ParticleBackground";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import AxiosInstance from "@/utils/api";

export default function LoginPage() {
  const { login, authenticated, loading: authLoading } = useContext(AuthContext);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle OAuth errors from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error === "oauth_failed") {
      toast.error("Gagal login dengan OAuth. Silakan coba lagi.");
      // Clean URL
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && authenticated) {
      // Check if there's a return URL or redirect to dashboard
      const returnUrl = new URLSearchParams(window.location.search).get("returnUrl");
      router.push(returnUrl || "/dashboard");
    }
  }, [authenticated, authLoading, router]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (authenticated) {
    return null;
  }

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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border/60 mb-4 shadow-lg shadow-primary/20 overflow-hidden">
              <Image
                src="/jblog-logo.svg"
                alt="jblog.space logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mb-2">
              jblog.space
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

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await AxiosInstance.get("/auth/google/url");
                    window.location.href = response.data.url;
                  } catch (error: any) {
                    console.error("Error getting Google auth URL:", error);
                    toast.error("Gagal mengakses Google login");
                  }
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card border-2 border-border rounded-xl hover:bg-accent/50 hover:border-primary/50 transition-all group"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium">Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await AxiosInstance.get("/auth/github/url");
                    window.location.href = response.data.url;
                  } catch (error: any) {
                    console.error("Error getting GitHub auth URL:", error);
                    toast.error("Gagal mengakses GitHub login");
                  }
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card border-2 border-border rounded-xl hover:bg-accent/50 hover:border-primary/50 transition-all group"
              >
                <Github className="h-5 w-5" />
                <span className="text-sm font-medium">Continue with GitHub</span>
              </button>
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
