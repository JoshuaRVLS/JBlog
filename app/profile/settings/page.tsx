"use client";

import { useState, useContext, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import {
  ArrowLeft,
  Upload,
  Loader2,
  Save,
  User,
  Mail,
  FileText,
  Lock,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { generateAvatarUrl } from "@/utils/avatarGenerator";

type TabType = "profile" | "security" | "preferences";

export default function ProfileSettings() {
  const { userId, authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [authenticated]);

  const fetchProfile = async () => {
    try {
      const response = await AxiosInstance.get("/profile");
      setUser(response.data);
      setName(response.data.name || "");
      setBio(response.data.bio || "");
      setProfilePicture(response.data.profilePicture);
      setPreview(response.data.profilePicture || generateAvatarUrl(response.data.name));
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal mengambil data profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await AxiosInstance.post("/upload/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setProfilePicture(response.data.url);
      toast.success("Foto profil berhasil diupload");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.response?.data?.error || "Gagal upload foto profil");
      setPreview(user?.profilePicture || generateAvatarUrl(user?.name || "U"));
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      await AxiosInstance.put("/profile", {
        name,
        bio,
        profilePicture: profilePicture || generateAvatarUrl(name),
      });

      toast.success("Profile berhasil diupdate");
      fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.error || "Gagal mengupdate profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi password tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    try {
      setChangingPassword(true);
      await AxiosInstance.put("/profile/password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.msg || "Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile" as TabType, label: "Profile", icon: User },
    { id: "security" as TabType, label: "Keamanan", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke dashboard</span>
          </Link>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-card border border-border/50 rounded-xl p-4 sticky top-24 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Pengaturan</h2>
                </div>
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-lg">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div>
                    <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                          {preview ? (
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                              <Image
                                src={preview}
                                alt="Profile preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
                              <User className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5" />
                              <span>Ubah Foto Profil</span>
                            </>
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG, GIF atau WEBP (max 5MB)
                        </p>
                      </div>

                      {/* Name */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <User className="h-4 w-4" />
                          Nama
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama kamu"
                          className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          required
                        />
                      </div>

                      {/* Email (Read-only) */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Mail className="h-4 w-4" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email tidak bisa diubah
                        </p>
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <FileText className="h-4 w-4" />
                          Bio
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tulis bio singkat tentang kamu..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                        />
                      </div>

                      {/* Submit */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {savingProfile ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-5 w-5" />
                              <span>Simpan Perubahan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div>
                    <h1 className="text-3xl font-bold mb-8">Keamanan</h1>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      {/* Current Password */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Lock className="h-4 w-4" />
                          Password Saat Ini
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Masukkan password saat ini"
                            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Lock className="h-4 w-4" />
                          Password Baru
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Masukkan password baru (min 6 karakter)"
                            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Lock className="h-4 w-4" />
                          Konfirmasi Password Baru
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Konfirmasi password baru"
                            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {changingPassword ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Mengubah password...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-5 w-5" />
                              <span>Ubah Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

