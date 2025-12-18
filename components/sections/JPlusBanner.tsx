"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Zap, Crown, Gift, ArrowRight } from "lucide-react";
import { AuthContext } from "@/providers/AuthProvider";
import Link from "next/link";

export default function JPlusBanner() {
  const { authenticated } = useContext(AuthContext);
  const router = useRouter();

  const handleClick = () => {
    if (!authenticated) {
      router.push("/login?redirect=/jplus");
    } else {
      router.push("/jplus");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 py-16 md:py-24">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Premium Membership</span>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Upgrade ke <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">J+</span>
          </h2>

          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Dapatkan akses ke fitur premium eksklusif dan dukung pengembangan JBlog
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">GIF Profile Picture</h3>
              <p className="text-white/80 text-sm">Gunakan GIF animasi sebagai foto profil</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Upload File Besar</h3>
              <p className="text-white/80 text-sm">Upload hingga 20-100MB tergantung tier</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Fitur Premium</h3>
              <p className="text-white/80 text-sm">Akses ke semua fitur premium eksklusif</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleClick}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
          >
            <span>Mulai Sekarang</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-white/70 text-sm mt-4">
            Hanya Rp 30.000/bulan • Batal kapan saja • Dukung JBlog
          </p>
        </div>
      </div>
    </section>
  );
}

