"use client";

import { useState, useContext, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Upload, Loader2, Check, User } from "lucide-react";
import toast from "react-hot-toast";
import { generateAvatarUrl } from "@/utils/avatarGenerator";

export default function ProfileFinalisation() {
  const { userId, authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    fetchUser();
  }, [authenticated]);

  const fetchUser = async () => {
    try {
      const response = await AxiosInstance.get("/profile");
      setUser(response.data);
      setProfilePicture(response.data.profilePicture);
      setPreview(response.data.profilePicture || generateAvatarUrl(response.data.name));
    } catch (error: any) {
      console.error("Error fetching user:", error);
      toast.error("Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setProfilePictureFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await AxiosInstance.post("/upload/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // Allow more time for avatar upload on VPS
        timeout: 120000,
      });

      setProfilePicture(response.data.url);
      toast.success("Foto profil berhasil diupload");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.response?.data?.error || "Gagal upload foto profil");
      setProfilePictureFile(null);
      setPreview(user?.profilePicture || generateAvatarUrl(user?.name || "U"));
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = async () => {
    // Jika user skip, gunakan default avatar yang sudah di-generate
    if (!user) return;

    try {
      setSaving(true);
      const defaultAvatar = generateAvatarUrl(user.name);
      
      await AxiosInstance.put("/profile", {
        profilePicture: defaultAvatar,
      });

      toast.success("Profile finalisasi berhasil");
      // Dispatch event to invalidate navbar cache
      window.dispatchEvent(new Event("profile-updated"));
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Gagal menyimpan profile");
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (!profilePicture) {
      toast.error("Silakan upload foto profil atau klik Skip");
      return;
    }

    try {
      setSaving(true);
      await AxiosInstance.put("/profile", {
        profilePicture: profilePicture,
      });

      toast.success("Profile finalisasi berhasil");
      // Dispatch event to invalidate navbar cache
      window.dispatchEvent(new Event("profile-updated"));
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Gagal menyimpan profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Finalisasi Profile</h1>
              <p className="text-muted-foreground">
                Lengkapi profile kamu dengan foto profil
              </p>
            </div>

            {/* Avatar Upload */}
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
                    <span>Upload Foto Profil</span>
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

            {/* Info */}
            <div className="bg-muted/50 rounded-lg p-4 mb-8">
              <p className="text-sm text-muted-foreground text-center">
                💡 Jika kamu tidak ingin upload foto, kami akan menggunakan avatar default
                yang di-generate dari initial nama kamu ({user.name.charAt(0).toUpperCase()})
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Menyimpan..." : "Skip (Gunakan Default)"}
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={saving || !profilePicture}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Lanjutkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

