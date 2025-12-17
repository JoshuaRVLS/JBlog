"use client";

import { AuthContext } from "@/providers/AuthProvider";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import Link from "next/link";
import { Mail, User, Lock, Loader2, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

export default function RegisterPage() {
  const { register: registerUser } = useContext(AuthContext);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const password = watch("password");

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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg shadow-primary/20">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mb-2">
              JBlog
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
