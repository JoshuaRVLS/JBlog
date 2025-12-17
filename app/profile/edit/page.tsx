"use client";

import { useState, useContext, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { ArrowLeft, Upload, Loader2, Save, User, Mail, FileText, Link as LinkIcon, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { generateAvatarUrl } from "@/utils/avatarGenerator";

export default function ProfileEdit() {
  const { userId, authenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [description, setDescription] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customLinks, setCustomLinks] = useState<Array<{ label: string; url: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUser(response.data);
      setName(response.data.name || "");
      setBio(response.data.bio || "");
      setDescription(response.data.description || "");
      setProfilePicture(response.data.profilePicture);
      setPreview(response.data.profilePicture || generateAvatarUrl(response.data.name));
      setCustomLinks(response.data.customLinks?.map((link: any) => ({ label: link.label, url: link.url })) || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      await AxiosInstance.put("/profile", {
        name,
        bio,
        description,
        profilePicture: profilePicture || generateAvatarUrl(name),
        customLinks: customLinks.filter(link => link.label.trim() && link.url.trim()),
      });

      toast.success("Profile berhasil diupdate");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.error || "Gagal mengupdate profile");
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

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke dashboard</span>
          </Link>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  Bio (Singkat)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tulis bio singkat tentang kamu..."
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                />
                <p className="text-xs text-muted-foreground">{bio.length}/160</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4" />
                  Deskripsi (Panjang)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tulis deskripsi lengkap tentang kamu..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                />
              </div>

              {/* Custom Links */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <LinkIcon className="h-4 w-4" />
                  Custom Links
                </label>
                <div className="space-y-3">
                  {customLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => {
                          const newLinks = [...customLinks];
                          newLinks[index].label = e.target.value;
                          setCustomLinks(newLinks);
                        }}
                        placeholder="Label (e.g., Website)"
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...customLinks];
                          newLinks[index].url = e.target.value;
                          setCustomLinks(newLinks);
                        }}
                        placeholder="https://..."
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCustomLinks(customLinks.filter((_, i) => i !== index));
                        }}
                        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {customLinks.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setCustomLinks([...customLinks, { label: "", url: "" }])}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah Link</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Maksimal 5 links. Format URL harus lengkap (https://...)
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
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
        </div>
      </main>
    </div>
  );
}

