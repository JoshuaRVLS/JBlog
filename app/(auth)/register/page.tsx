"use client";

import { AuthContext } from "@/providers/AuthProvider";
import React, { useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import Link from "next/link";
import { Mail, User, Lock, Loader2, ArrowRight, CheckCircle2, Github } from "lucide-react";
import Image from "next/image";
import ParticleBackground from "@/components/ParticleBackground";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import AxiosInstance from "@/utils/api";

export default function RegisterPage() {
  const { register: registerUser, authenticated, loading: authLoading } = useContext(AuthContext);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const password = watch("password");

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

  // Don't render register form if already authenticated (will redirect)
  if (authenticated) {
    return null;
  }

  const onSubmit = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Password dan konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser(data);
      // Registration now redirects to verification
      if (response?.data?.redirectTo) {
        router.push(response.data.redirectTo);
      } else if (response?.data?.user?.id) {
        router.push(`/verify-email/${response.data.user.id}`);
      } else {
        router.push("/login");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.msg || error.response?.data?.error || "Gagal registrasi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 py-12">
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
            <p className="text-muted-foreground">Buat akun baru dan mulai berbagi</p>
          </div>

          {/* Register Card */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Daftar Akun Baru</h2>
              <p className="text-sm text-muted-foreground">
                Lengkapi data berikut untuk membuat akun
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                label="Nama Lengkap"
                type="text"
                placeholder="Nama kamu"
                {...register("name", {
                  required: "Nama wajib diisi",
                  minLength: {
                    value: 2,
                    message: "Nama minimal 2 karakter"
                  }
                })}
                error={errors.name?.message as string}
                className="h-11"
              />

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
                placeholder="Minimal 6 karakter"
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

              <FormInput
                label="Konfirmasi Password"
                type="password"
                placeholder="Ulangi password"
                {...register("confirmPassword", {
                  required: "Konfirmasi password wajib diisi",
                  validate: (value) => 
                    value === password || "Password tidak cocok"
                })}
                error={errors.confirmPassword?.message as string}
                className="h-11"
              />

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground mb-2">Persyaratan Password:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${password && password.length >= 6 ? "text-green-500" : "text-muted-foreground"}`} />
                    <span className={password && password.length >= 6 ? "text-green-500" : "text-muted-foreground"}>
                      Minimal 6 karakter
                    </span>
                  </div>
                </div>
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
                    Daftar
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
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Masuk sekarang
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Dengan mendaftar, kamu menyetujui{" "}
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
