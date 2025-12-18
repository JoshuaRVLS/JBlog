"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Megaphone, Plus, Edit, Trash2, Save, X, Loader2, Palette, Sparkles, Gift, Heart, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import AdminLoading from "@/components/AdminLoading";

const getThemeConfig = (theme: string) => {
  const themes: Record<string, { backgroundColor: string; textColor: string; borderColor: string; icon: string; particleEffect: string }> = {
    default: {
      backgroundColor: "#3b82f6",
      textColor: "#ffffff",
      borderColor: "#3b82f6",
      icon: "",
      particleEffect: "none",
    },
    newyear: {
      backgroundColor: "#f59e0b",
      textColor: "#ffffff",
      borderColor: "#f59e0b",
      icon: "🎉",
      particleEffect: "confetti",
    },
    christmas: {
      backgroundColor: "#dc2626",
      textColor: "#ffffff",
      borderColor: "#dc2626",
      icon: "🎄",
      particleEffect: "snow",
    },
    valentine: {
      backgroundColor: "#ec4899",
      textColor: "#ffffff",
      borderColor: "#ec4899",
      icon: "💝",
      particleEffect: "hearts",
    },
    independence: {
      backgroundColor: "#dc2626",
      textColor: "#ffffff",
      borderColor: "#fbbf24",
      icon: "🇮🇩",
      particleEffect: "sparkles",
    },
    eid: {
      backgroundColor: "#10b981",
      textColor: "#ffffff",
      borderColor: "#10b981",
      icon: "🌙",
      particleEffect: "stars",
    },
    halloween: {
      backgroundColor: "#7c3aed",
      textColor: "#fbbf24",
      borderColor: "#7c3aed",
      icon: "🎃",
      particleEffect: "fireworks",
    },
    custom: {
      backgroundColor: "",
      textColor: "",
      borderColor: "",
      icon: "",
      particleEffect: "none",
    },
  };
  return themes[theme] || themes.default;
};

export default function AdminBroadcast() {
  const { userId, authenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    theme: "default",
    icon: "",
    backgroundColor: "",
    textColor: "",
    borderColor: "",
    particleEffect: "none",
    particleEffectAfterCountdown: "none",
    hasCountdown: false,
    countdownEndDate: "",
    actionAfterCountdown: "hide",
    messageAfterCountdown: "",
    redirectUrlAfterCountdown: "",
    isActive: false,
  });
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
        toast.error("Akses ditolak");
        router.push("/dashboard");
        return;
      }

      const broadcastsRes = await AxiosInstance.get("/broadcast/");
      setBroadcasts(broadcastsRes.data.broadcasts || []);
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403) {
        toast.error("Akses ditolak");
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await AxiosInstance.put(`/broadcast/${editingId}`, formData);
        toast.success("Broadcast berhasil diupdate");
      } else {
        await AxiosInstance.post("/broadcast/", formData);
        toast.success("Broadcast berhasil dibuat");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: "", message: "", type: "info", theme: "default", icon: "", backgroundColor: "", textColor: "", borderColor: "", particleEffect: "none", particleEffectAfterCountdown: "none", hasCountdown: false, countdownEndDate: "", actionAfterCountdown: "hide", messageAfterCountdown: "", redirectUrlAfterCountdown: "", isActive: false });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menyimpan broadcast");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (broadcast: any) => {
    setEditingId(broadcast.id);
    setFormData({
      title: broadcast.title || "",
      message: broadcast.message || "",
      type: broadcast.type || "info",
      theme: broadcast.theme || "default",
      icon: broadcast.icon || "",
      backgroundColor: broadcast.backgroundColor || "",
      textColor: broadcast.textColor || "",
      borderColor: broadcast.borderColor || "",
      particleEffect: broadcast.particleEffect || "none",
      particleEffectAfterCountdown: broadcast.particleEffectAfterCountdown || "none",
      hasCountdown: Boolean(broadcast.hasCountdown),
      countdownEndDate: broadcast.countdownEndDate ? new Date(broadcast.countdownEndDate).toISOString().slice(0, 16) : "",
      actionAfterCountdown: broadcast.actionAfterCountdown || "hide",
      messageAfterCountdown: broadcast.messageAfterCountdown || "",
      redirectUrlAfterCountdown: broadcast.redirectUrlAfterCountdown || "",
      isActive: Boolean(broadcast.isActive),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus broadcast ini?")) return;

    try {
      await AxiosInstance.delete(`/broadcast/${id}`);
      toast.success("Broadcast berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menghapus broadcast");
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Kelola Broadcast</h1>
              <p className="text-muted-foreground">
                Buat dan kelola broadcast untuk ditampilkan di landing page
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ title: "", message: "", type: "info", theme: "default", icon: "", backgroundColor: "", textColor: "", borderColor: "", particleEffect: "none", particleEffectAfterCountdown: "none", hasCountdown: false, countdownEndDate: "", actionAfterCountdown: "hide", messageAfterCountdown: "", redirectUrlAfterCountdown: "", isActive: false });
              }}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Buat Broadcast
            </button>
          </div>

          {showForm && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit Broadcast" : "Buat Broadcast Baru"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ title: "", message: "", type: "info", theme: "default", icon: "", backgroundColor: "", textColor: "", borderColor: "", particleEffect: "none", particleEffectAfterCountdown: "none", hasCountdown: false, countdownEndDate: "", actionAfterCountdown: "hide", messageAfterCountdown: "", redirectUrlAfterCountdown: "", isActive: false });
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isActive)}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 rounded border-2 border-border"
                      />
                      <span className="text-sm font-semibold">Aktif</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => {
                      const theme = e.target.value;
                      const themeConfig = getThemeConfig(theme);
                      setFormData({
                        ...formData,
                        theme,
                        backgroundColor: themeConfig.backgroundColor,
                        textColor: themeConfig.textColor,
                        borderColor: themeConfig.borderColor,
                        icon: themeConfig.icon,
                        particleEffect: themeConfig.particleEffect,
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="default">Default</option>
                    <option value="newyear">New Year</option>
                    <option value="christmas">Natal / Christmas</option>
                    <option value="valentine">Valentine</option>
                    <option value="independence">Hari Kemerdekaan</option>
                    <option value="eid">Lebaran / Eid</option>
                    <option value="halloween">Halloween</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {formData.theme === "custom" && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <label className="block text-xs font-semibold mb-2">Background Color</label>
                      <input
                        type="color"
                        value={formData.backgroundColor || "#3b82f6"}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        className="w-full h-10 rounded border border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2">Text Color</label>
                      <input
                        type="color"
                        value={formData.textColor || "#ffffff"}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        className="w-full h-10 rounded border border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2">Border Color</label>
                      <input
                        type="color"
                        value={formData.borderColor || "#3b82f6"}
                        onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })}
                        className="w-full h-10 rounded border border-border"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2">Icon (emoji atau nama icon dari lucide-react)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🎉 atau Sparkles"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Particle Effect
                  </label>
                  <select
                    value={formData.particleEffect}
                    onChange={(e) => setFormData({ ...formData, particleEffect: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="none">Tidak Ada</option>
                    <option value="snow">Salju (Snow)</option>
                    <option value="confetti">Konfeti (Confetti)</option>
                    <option value="stars">Bintang (Stars)</option>
                    <option value="hearts">Hati (Hearts)</option>
                    <option value="fireworks">Kembang Api (Fireworks)</option>
                    <option value="sparkles">Kilau (Sparkles)</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.hasCountdown)}
                      onChange={(e) => setFormData({ ...formData, hasCountdown: e.target.checked })}
                      className="w-4 h-4 rounded border-2 border-border"
                    />
                    <span>Aktifkan Countdown</span>
                  </label>
                </div>

                {formData.hasCountdown && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Tanggal & Waktu Berakhir</label>
                      <input
                        type="datetime-local"
                        value={formData.countdownEndDate}
                        onChange={(e) => setFormData({ ...formData, countdownEndDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required={formData.hasCountdown}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Aksi Setelah Countdown Selesai</label>
                      <select
                        value={formData.actionAfterCountdown}
                        onChange={(e) => setFormData({ ...formData, actionAfterCountdown: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="hide">Sembunyikan Broadcast</option>
                        <option value="change_message">Ubah Pesan</option>
                        <option value="redirect">Redirect ke URL</option>
                      </select>
                    </div>

                    {formData.actionAfterCountdown === "change_message" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">Pesan Setelah Countdown</label>
                        <textarea
                          value={formData.messageAfterCountdown}
                          onChange={(e) => setFormData({ ...formData, messageAfterCountdown: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          placeholder="Pesan yang akan ditampilkan setelah countdown selesai"
                        />
                      </div>
                    )}

                    {formData.actionAfterCountdown === "redirect" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">URL Redirect</label>
                        <input
                          type="url"
                          value={formData.redirectUrlAfterCountdown}
                          onChange={(e) => setFormData({ ...formData, redirectUrlAfterCountdown: e.target.value })}
                          placeholder="https://example.com"
                          className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Particle Effect Setelah Countdown
                      </label>
                      <select
                        value={formData.particleEffectAfterCountdown}
                        onChange={(e) => setFormData({ ...formData, particleEffectAfterCountdown: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="none">Tidak Ada</option>
                        <option value="snow">Salju (Snow)</option>
                        <option value="confetti">Konfeti (Confetti)</option>
                        <option value="stars">Bintang (Stars)</option>
                        <option value="hearts">Hati (Hearts)</option>
                        <option value="fireworks">Kembang Api (Fireworks)</option>
                        <option value="sparkles">Kilau (Sparkles)</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Particle effect yang akan ditampilkan setelah countdown selesai
                      </p>
                    </div>
                  </div>
                )}

                {formData.title && formData.message && (
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <label className="block text-sm font-semibold mb-2">Preview</label>
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: formData.backgroundColor ? `${formData.backgroundColor}15` : "rgba(59, 130, 246, 0.1)",
                        borderColor: formData.borderColor ? `${formData.borderColor}30` : "rgba(59, 130, 246, 0.2)",
                        color: formData.textColor || "#3b82f6",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {formData.icon && <span className="text-lg">{formData.icon}</span>}
                        <div className="font-bold text-sm">{formData.title}</div>
                        <div className="text-xs opacity-80">{formData.message}</div>
                      </div>
                      {formData.hasCountdown && formData.countdownEndDate && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <div className="text-xs opacity-70">
                            Countdown: {new Date(formData.countdownEndDate).toLocaleString("id-ID")}
                          </div>
                          {formData.actionAfterCountdown === "change_message" && formData.messageAfterCountdown && (
                            <div className="text-xs opacity-70 mt-1">
                              Setelah countdown: {formData.messageAfterCountdown}
                            </div>
                          )}
                          {formData.actionAfterCountdown === "redirect" && formData.redirectUrlAfterCountdown && (
                            <div className="text-xs opacity-70 mt-1">
                              Redirect ke: {formData.redirectUrlAfterCountdown}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Simpan
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ title: "", message: "", type: "info", theme: "default", icon: "", backgroundColor: "", textColor: "", borderColor: "", particleEffect: "none", particleEffectAfterCountdown: "none", hasCountdown: false, countdownEndDate: "", actionAfterCountdown: "hide", messageAfterCountdown: "", redirectUrlAfterCountdown: "", isActive: false });
                    }}
                    className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-accent"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className={`bg-card border rounded-xl p-6 ${
                  broadcast.isActive ? "border-primary" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{broadcast.title}</h3>
                      {broadcast.isActive && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          Aktif
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        broadcast.type === "info" ? "bg-blue-500/10 text-blue-500" :
                        broadcast.type === "warning" ? "bg-yellow-500/10 text-yellow-500" :
                        broadcast.type === "success" ? "bg-green-500/10 text-green-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {broadcast.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">{broadcast.message}</p>
                    {broadcast.hasCountdown && broadcast.countdownEndDate && (
                      <div className="mb-2 p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs font-semibold mb-1">⏰ Countdown</p>
                        <p className="text-xs text-muted-foreground">
                          Berakhir: {new Date(broadcast.countdownEndDate).toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Aksi: {
                            broadcast.actionAfterCountdown === "hide" ? "Sembunyikan" :
                            broadcast.actionAfterCountdown === "change_message" ? "Ubah Pesan" :
                            broadcast.actionAfterCountdown === "redirect" ? "Redirect" :
                            "Tidak ada"
                          }
                        </p>
                        {broadcast.actionAfterCountdown === "change_message" && broadcast.messageAfterCountdown && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Pesan baru: {broadcast.messageAfterCountdown}
                          </p>
                        )}
                        {broadcast.actionAfterCountdown === "redirect" && broadcast.redirectUrlAfterCountdown && (
                          <p className="text-xs text-muted-foreground mt-1">
                            URL: {broadcast.redirectUrlAfterCountdown}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Dibuat: {new Date(broadcast.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(broadcast)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(broadcast.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {broadcasts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Belum ada broadcast
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

