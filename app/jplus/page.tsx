"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Sparkles, Zap, Crown, Gift, Check, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface JPlusStatus {
  isJPlus: boolean;
  expiresAt: string | null;
  tier: string;
  startedAt: string | null;
  daysRemaining: number | null;
}

export default function JPlusPage() {
  const { authenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [jplusStatus, setJplusStatus] = useState<JPlusStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) {
      router.push("/login?redirect=/jplus");
      return;
    }
    fetchJPlusStatus();
  }, [authenticated, authLoading]);

  const fetchJPlusStatus = async () => {
    try {
      const response = await AxiosInstance.get("/jplus/status");
      setJplusStatus(response.data);
    } catch (error: any) {
      console.error("Error fetching J+ status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!authenticated) {
      router.push("/login?redirect=/jplus");
      return;
    }

    try {
      setUpgrading(true);
      await AxiosInstance.post("/jplus/upgrade", {
        duration: 1, // 1 month
      });
      toast.success("J+ berhasil diaktifkan! Terima kasih sudah mendukung JBlog! 🎉");
      await fetchJPlusStatus();
    } catch (error: any) {
      console.error("Error upgrading to J+:", error);
      toast.error(error.response?.data?.error || "Gagal mengaktifkan J+");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const plan = {
    name: "J+ Supporter",
    tier: "supporter",
    price: 30000,
    duration: 1, // 1 month
    features: [
      "GIF Profile Picture",
      "Upload file hingga 50MB (avatar & post)",
      "Badge J+ di profil",
      "Priority support",
      "Early access fitur baru",
      "Unlimited custom links",
      "Tema eksklusif",
      "Dukung pengembangan JBlog",
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 py-16 md:py-24">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                <span>Premium Membership</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Upgrade ke <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">J+</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Dukung pengembangan JBlog dan dapatkan akses ke semua fitur premium
              </p>

              {jplusStatus?.isJPlus && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 mb-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-300" />
                    <span className="text-white font-bold text-lg">Terima kasih sudah menjadi Supporter J+! 🎉</span>
                  </div>
                  {jplusStatus.daysRemaining !== null && jplusStatus.daysRemaining > 0 && (
                    <p className="text-white/80">
                      J+ aktif hingga {new Date(jplusStatus.expiresAt!).toLocaleDateString("id-ID")} 
                      ({jplusStatus.daysRemaining} hari tersisa)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Plan */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Paket J+ Supporter
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Dukung pengembangan JBlog dan dapatkan akses ke semua fitur premium
            </p>

            <div className="relative bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl font-bold text-primary">
                    Rp {plan.price.toLocaleString("id-ID")}
                  </span>
                  <span className="text-muted-foreground text-xl">
                    /bulan
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Batal kapan saja • Tidak ada komitmen jangka panjang
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={upgrading || jplusStatus?.isJPlus}
                className="w-full py-4 rounded-lg font-bold text-lg bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : jplusStatus?.isJPlus ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span>J+ Aktif</span>
                  </>
                ) : (
                  <>
                    <span>Dukung JBlog Sekarang</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {jplusStatus?.isJPlus && jplusStatus.daysRemaining !== null && jplusStatus.daysRemaining > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  J+ Anda aktif hingga {new Date(jplusStatus.expiresAt!).toLocaleDateString("id-ID")} 
                  ({jplusStatus.daysRemaining} hari tersisa)
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Fitur J+ Eksklusif
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">GIF Profile Picture</h3>
                <p className="text-muted-foreground text-sm">
                  Gunakan GIF animasi sebagai foto profil untuk membuat profil lebih menarik dan unik
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Upload File Besar</h3>
                <p className="text-muted-foreground text-sm">
                  Upload file hingga 50MB untuk avatar dan post images (biasanya hanya 5-10MB)
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Badge Eksklusif</h3>
                <p className="text-muted-foreground text-sm">
                  Tampilkan badge J+ di profil untuk menunjukkan bahwa Anda supporter JBlog
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Early Access</h3>
                <p className="text-muted-foreground text-sm">
                  Dapatkan akses lebih awal ke fitur-fitur baru sebelum dirilis untuk semua user
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Priority Support</h3>
                <p className="text-muted-foreground text-sm">
                  Dapatkan prioritas dalam support dan bantuan teknis dari tim JBlog
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Dukung JBlog</h3>
                <p className="text-muted-foreground text-sm">
                  Dengan menjadi supporter, Anda membantu pengembangan dan maintenance JBlog
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

