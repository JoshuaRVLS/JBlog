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
  Globe,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import CustomSelect from "@/components/ui/CustomSelect";

type TabType = "profile" | "security" | "account";

export default function ProfileSettings() {
  const { userId, authenticated, loading: authLoading } = useContext(AuthContext);
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

  // Account states
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailChangeStep, setEmailChangeStep] = useState<"request" | "verify">("request");
  const [pendingNewEmail, setPendingNewEmail] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [changingCountry, setChangingCountry] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
    if (!authenticated) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [authenticated, authLoading]);

  const fetchProfile = async () => {
    try {
      const response = await AxiosInstance.get("/profile");
      if (response.data) {
        setUser(response.data);
        setName(response.data.name || "");
        setBio(response.data.bio || "");
        setProfilePicture(response.data.profilePicture);
        setPreview(response.data.profilePicture || generateAvatarUrl(response.data.name));
        setCountry(response.data.country || "");
        setWebsite(response.data.website || "");
        setLocation(response.data.location || "");
        setTwitter(response.data.twitter || "");
        setGithub(response.data.github || "");
        setLinkedin(response.data.linkedin || "");
        setInstagram(response.data.instagram || "");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.msg || "Gagal mengambil data profile";
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        router.push("/login");
      }
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

    // Check file size - will be validated on backend based on J+ status
    // Frontend just shows a warning for very large files
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar (maksimal 100MB)");
      return;
    }

    // Check if file is GIF and user has J+
    const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
    if (isGif) {
      try {
        const jplusResponse = await AxiosInstance.get("/jplus/status");
        const hasJPlus = jplusResponse.data.isJPlus;
        
        if (!hasJPlus) {
          toast.error("Fitur GIF profile picture hanya tersedia untuk member J+. Upgrade ke J+ untuk menggunakan fitur ini!", {
            duration: 5000,
          });
          // Redirect to J+ page
          setTimeout(() => {
            router.push("/jplus");
          }, 2000);
          return;
        }
      } catch (error: any) {
        console.error("Error checking J+ status:", error);
        // If error, still allow upload but backend will reject if no J+
      }
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

      const newProfilePicture = response.data.url;
      setProfilePicture(newProfilePicture);
      
      // Immediately update profile in backend to save the new profile picture
      try {
        await AxiosInstance.put("/profile", {
          profilePicture: newProfilePicture,
        });
        toast.success("Foto profil berhasil diupload dan disimpan");
        // Refresh profile data
        await fetchProfile();
      } catch (updateError: any) {
        console.error("Error updating profile after upload:", updateError);
        // Profile picture URL is already set, so it should work on next save
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      const errorMsg = error.response?.data?.error || "Gagal upload foto profil";
      toast.error(errorMsg);
      
      // If J+ required, redirect to J+ page
      if (error.response?.data?.requiresJPlus) {
        setTimeout(() => {
          router.push("/jplus");
        }, 2000);
      }
      
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
        country,
        website,
        location,
        twitter,
        github,
        linkedin,
        instagram,
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

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailChangeStep === "request") {
      // Step 1: Request email change
      if (!newEmail || !emailPassword) {
        toast.error("Email baru dan password diperlukan");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        toast.error("Format email tidak valid");
        return;
      }

      if (newEmail === user?.email) {
        toast.error("Email baru sama dengan email saat ini");
        return;
      }

      try {
        setChangingEmail(true);
        await AxiosInstance.post("/profile/email/request-change", {
          newEmail,
          password: emailPassword,
        });

        toast.success("Kode verifikasi telah dikirim ke email baru Anda");
        setPendingNewEmail(newEmail);
        setEmailPassword("");
        setEmailChangeStep("verify");
      } catch (error: any) {
        console.error("Error requesting email change:", error);
        toast.error(error.response?.data?.msg || "Gagal mengirim kode verifikasi");
      } finally {
        setChangingEmail(false);
      }
    } else {
      // Step 2: Verify email change
      if (!emailVerificationCode) {
        toast.error("Kode verifikasi diperlukan");
        return;
      }

      try {
        setChangingEmail(true);
        await AxiosInstance.post("/profile/email/verify-change", {
          code: emailVerificationCode,
        });

        toast.success("Email berhasil diubah");
        setNewEmail("");
        setEmailPassword("");
        setEmailVerificationCode("");
        setPendingNewEmail("");
        setEmailChangeStep("request");
        fetchProfile();
      } catch (error: any) {
        console.error("Error verifying email change:", error);
        toast.error(error.response?.data?.msg || "Gagal mengubah email");
      } finally {
        setChangingEmail(false);
      }
    }
  };

  const handleCountryChange = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setChangingCountry(true);
      await AxiosInstance.put("/profile/country", {
        country: country || null,
      });

      toast.success("Negara berhasil diubah");
      fetchProfile();
    } catch (error: any) {
      console.error("Error changing country:", error);
      toast.error(error.response?.data?.error || "Gagal mengubah negara");
    } finally {
      setChangingCountry(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Password diperlukan untuk menghapus akun");
      return;
    }

    try {
      setDeletingAccount(true);
      await AxiosInstance.delete("/profile", {
        data: { password: deletePassword },
      });

      toast.success("Akun berhasil dihapus");
      setTimeout(() => {
        router.push("/");
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.msg || "Gagal menghapus akun");
      setDeletePassword("");
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const countries = [
    "Indonesia",
    "United States",
    "United Kingdom",
    "India",
    "China",
    "Japan",
    "Germany",
    "France",
    "Canada",
    "Australia",
    "Brazil",
    "Russia",
    "South Korea",
    "Mexico",
    "Spain",
    "Italy",
    "Netherlands",
    "Singapore",
    "Malaysia",
    "Thailand",
    "Philippines",
    "Vietnam",
    "Saudi Arabia",
    "United Arab Emirates",
    "Turkey",
    "Egypt",
    "South Africa",
    "Argentina",
    "Chile",
    "Poland",
    "Sweden",
    "Norway",
    "Denmark",
    "Finland",
    "Belgium",
    "Switzerland",
    "Austria",
    "Portugal",
    "Greece",
    "Ireland",
    "New Zealand",
    "Israel",
    "Pakistan",
    "Bangladesh",
    "Nigeria",
    "Kenya",
    "Colombia",
    "Peru",
    "Venezuela",
    "Ukraine",
    "Czechia",
    "Romania",
    "Hungary",
    "Croatia",
    "Bulgaria",
    "Serbia",
    "Sri Lanka",
    "Nepal",
    "Myanmar",
    "Cambodia",
    "Laos",
    "Hong Kong",
    "Taiwan",
  ];

  const tabs = [
    { id: "profile" as TabType, label: "Profile", icon: User },
    { id: "security" as TabType, label: "Keamanan", icon: Lock },
    { id: "account" as TabType, label: "Akun", icon: Shield },
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
                                sizes="128px"
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Globe className="h-4 w-4" />
                            Website
                          </label>
                          <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Globe className="h-4 w-4" />
                            Location
                          </label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Jakarta, Indonesia"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Social Media</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">
                              Twitter / X
                            </label>
                            <input
                              type="text"
                              value={twitter}
                              onChange={(e) => setTwitter(e.target.value)}
                              placeholder="@username"
                              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">
                              GitHub
                            </label>
                            <input
                              type="text"
                              value={github}
                              onChange={(e) => setGithub(e.target.value)}
                              placeholder="username"
                              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">
                              LinkedIn
                            </label>
                            <input
                              type="text"
                              value={linkedin}
                              onChange={(e) => setLinkedin(e.target.value)}
                              placeholder="username"
                              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">
                              Instagram
                            </label>
                            <input
                              type="text"
                              value={instagram}
                              onChange={(e) => setInstagram(e.target.value)}
                              placeholder="username"
                              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      </div>

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

                {/* Account Tab */}
                {activeTab === "account" && (
                  <div className="space-y-8">
                    <h1 className="text-3xl font-bold">Pengaturan Akun</h1>

                    {/* Change Email */}
                    <div className="border-b border-border/50 pb-8">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Ubah Email
                      </h2>
                      {emailChangeStep === "request" ? (
                        <form onSubmit={handleEmailChange} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email Saat Ini</label>
                            <input
                              type="email"
                              value={user?.email || ""}
                              disabled
                              className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email Baru</label>
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="email@example.com"
                              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Konfirmasi Password</label>
                            <div className="relative">
                              <input
                                type={showEmailPassword ? "text" : "password"}
                                value={emailPassword}
                                onChange={(e) => setEmailPassword(e.target.value)}
                                placeholder="Masukkan password untuk konfirmasi"
                                className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowEmailPassword(!showEmailPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showEmailPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={changingEmail}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {changingEmail ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Mengirim kode...</span>
                              </>
                            ) : (
                              <>
                                <Mail className="h-5 w-5" />
                                <span>Kirim Kode Verifikasi</span>
                              </>
                            )}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleEmailChange} className="space-y-4">
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-foreground">
                              <strong>Kode verifikasi telah dikirim ke:</strong> {pendingNewEmail}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Silakan cek email Anda dan masukkan kode verifikasi di bawah ini.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Kode Verifikasi</label>
                            <input
                              type="text"
                              value={emailVerificationCode}
                              onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="000000"
                              maxLength={6}
                              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl font-mono tracking-widest"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Masukkan 6 digit kode verifikasi yang dikirim ke email baru Anda
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEmailChangeStep("request");
                                setEmailVerificationCode("");
                                setPendingNewEmail("");
                              }}
                              className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                            >
                              Kembali
                            </button>
                            <button
                              type="submit"
                              disabled={changingEmail || emailVerificationCode.length !== 6}
                              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {changingEmail ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  <span>Mengubah email...</span>
                                </>
                              ) : (
                                <>
                                  <Mail className="h-5 w-5" />
                                  <span>Verifikasi & Ubah Email</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Change Country */}
                    <div className="border-b border-border/50 pb-8">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Ubah Negara
                      </h2>
                      <form onSubmit={handleCountryChange} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Negara</label>
                          <CustomSelect
                            options={countries.map((c) => ({ value: c, label: c }))}
                            value={country}
                            onChange={(value) => setCountry(value)}
                            placeholder="Pilih Negara"
                            searchable={true}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">
                            Pilih negara untuk ditampilkan di globe visualization
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={changingCountry}
                          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {changingCountry ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-5 w-5" />
                              <span>Simpan Negara</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Delete Account */}
                    <div className="border-b border-border/50 pb-8">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Hapus Akun
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Menghapus akun akan menghapus semua data Anda secara permanen. Tindakan ini tidak dapat
                        dibatalkan.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span>Hapus Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Hapus Akun</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Tindakan ini akan menghapus akun Anda secara permanen. Semua data termasuk posts, comments, dan
                informasi lainnya akan dihapus dan tidak dapat dikembalikan.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Konfirmasi Password</label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Masukkan password untuk konfirmasi"
                      className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showDeletePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                    }}
                    className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount || !deletePassword}
                    className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-5 w-5" />
                        <span>Hapus Akun</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

