"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Wrench, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import AdminLoading from "@/components/AdminLoading";

export default function MaintenanceModePage() {
  const { userId, authenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (userId) {
      fetchData();
    }
  }, [userId, authenticated, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await AxiosInstance.get(`/users/${userId}`);
      setUser(userRes.data);

      if (!userRes.data.isAdmin && !userRes.data.isOwner) {
        toast.error("Akses ditolak. Perlu akses admin.");
        router.push("/dashboard");
        return;
      }

      // Fetch maintenance mode status
      const maintenanceRes = await AxiosInstance.get("/admin/maintenance");
      setMaintenanceEnabled(maintenanceRes.data.enabled);
      setMaintenanceMessage(maintenanceRes.data.message || "");
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403) {
        toast.error("Akses ditolak. Perlu akses admin.");
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setSaving(true);
      const newStatus = !maintenanceEnabled;
      const response = await AxiosInstance.put("/admin/maintenance", {
        enabled: newStatus,
        message: maintenanceMessage || undefined,
      });

      setMaintenanceEnabled(response.data.enabled);
      toast.success(
        newStatus
          ? "Maintenance mode diaktifkan"
          : "Maintenance mode dinonaktifkan"
      );
    } catch (error: any) {
      console.error("Error toggling maintenance mode:", error);
      toast.error(
        error.response?.data?.error || "Gagal mengupdate maintenance mode"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <AdminLoading />
        </div>
      </div>
    );
  }

  if (!user?.isAdmin && !user?.isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Maintenance Mode</h1>
                <p className="text-muted-foreground">
                  Aktifkan atau nonaktifkan maintenance mode
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          {maintenanceEnabled && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-500 mb-1">
                  Maintenance Mode Aktif
                </p>
                <p className="text-sm text-muted-foreground">
                  Situs saat ini dalam mode maintenance. Semua pengguna (kecuali admin) akan melihat halaman maintenance.
                </p>
              </div>
            </div>
          )}

          {/* Settings Card */}
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
            <div className="space-y-6">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Status Maintenance Mode
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {maintenanceEnabled
                      ? "Maintenance mode sedang aktif"
                      : "Maintenance mode tidak aktif"}
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    maintenanceEnabled ? "bg-primary" : "bg-muted"
                  } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      maintenanceEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pesan Maintenance (Opsional)
                </label>
                <textarea
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Situs sedang dalam maintenance. Silakan coba lagi nanti."
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Pesan ini akan ditampilkan kepada pengguna saat maintenance mode aktif
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  maintenanceEnabled
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </span>
                ) : maintenanceEnabled ? (
                  "Nonaktifkan Maintenance Mode"
                ) : (
                  "Aktifkan Maintenance Mode"
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-muted/50 border border-border/50 rounded-lg">
            <h4 className="font-semibold mb-2">Informasi</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Maintenance mode akan memblokir akses semua pengguna kecuali admin</li>
              <li>Admin tetap bisa mengakses semua fitur termasuk admin panel</li>
              <li>Route /api/admin dan /api/auth/login tetap dapat diakses</li>
              <li>Pengguna akan melihat pesan maintenance saat mencoba mengakses situs</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

