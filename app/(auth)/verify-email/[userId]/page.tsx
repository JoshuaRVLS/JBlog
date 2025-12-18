"use client";

import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import { AuthContext } from "@/providers/AuthProvider";
import AxiosInstance from "@/utils/api";
import { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, Loader2, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import ParticleBackground from "@/components/ParticleBackground";

export default function VerifyEmailPage() {
  const { verifyEmail } = useContext(AuthContext);
  const { userId } = useParams();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await AxiosInstance.post("/email/check-verify", {
          userId,
        });
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.msg || "User tidak ditemukan");
          router.push("/register");
        }
      }
    })();
  }, [userId, router]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await verifyEmail(data);
      // verifyEmail already handles redirect
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.msg || "Kode verifikasi tidak valid");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await AxiosInstance.post("/email/send-verification", {
        userId,
      });
      toast.success("Kode verifikasi baru telah dikirim ke email kamu!");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.msg || "Gagal mengirim kode verifikasi");
      }
    } finally {
      setResending(false);
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
              Verifikasi Email
            </h1>
            <p className="text-muted-foreground">
              Kami telah mengirim kode verifikasi ke email kamu
            </p>
          </div>

          {/* Verification Card */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Masukkan Kode Verifikasi</h2>
              <p className="text-sm text-muted-foreground">
                Cek inbox email kamu dan masukkan kode 6 digit yang telah dikirim
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput
                label="Kode Verifikasi"
                type="text"
                placeholder="000000"
                maxLength={6}
                {...register("code", {
                  required: "Kode verifikasi wajib diisi",
                  minLength: {
                    value: 6,
                    message: "Kode harus 6 digit"
                  },
                  pattern: {
                    value: /^\d+$/,
                    message: "Kode harus berupa angka"
                  }
                })}
                error={errors.code?.message as string}
                className="h-16 text-3xl font-bold text-center tracking-widest"
              />

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Verifikasi Email
                    <CheckCircle2 className="h-5 w-5 ml-2" />
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

            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Kirim Ulang Kode
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Belum menerima email?{" "}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-primary hover:text-primary/80 font-semibold transition-colors disabled:opacity-50"
                  >
                    Kirim ulang
                  </button>
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground text-center">
                💡 Tips: Cek juga folder spam/junk jika email tidak muncul di inbox
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Kembali ke halaman login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
