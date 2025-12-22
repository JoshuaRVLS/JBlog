"use client";

import { useState, useContext, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import {
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import DragDropPostEditor from "@/components/editor/DragDropPostEditor";
import CustomAPIEditor from "@/components/CustomAPIEditor";

interface InlineImage {
  id: string;
  url: string;
  alt: string;
  caption: string;
}

export default function NewPost() {
  const { userId, authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; slug: string; _count?: { posts: number } }>>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [filteredTags, setFilteredTags] = useState<Array<{ id: string; name: string; slug: string; _count?: { posts: number } }>>([]);
  const [published, setPublished] = useState(false);
  const [customScript, setCustomScript] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLDivElement>(null);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await AxiosInstance.get("/tags");
        console.log("Tags response:", response.data);
        if (response.data) {
          const tagsData = response.data.tags || [];
          setAvailableTags(tagsData);
          setFilteredTags(tagsData);
          console.log("Available tags set:", tagsData.length);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  // Filter tags based on input
  useEffect(() => {
    const availableTagsFiltered = availableTags.filter((tag) => !tags.includes(tag.name));
    
    if (tagInput.trim()) {
      const filtered = availableTagsFiltered.filter(
        (tag) => tag.name.toLowerCase().includes(tagInput.toLowerCase())
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(availableTagsFiltered);
    }
    // Keep dropdown open if it was already open (don't close it when typing)
  }, [tagInput, availableTags, tags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagInputRef.current && !tagInputRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return null;
  }

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload cover image
    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await AxiosInstance.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setCoverImage(response.data.url);
      toast.success("Cover image berhasil diupload");
    } catch (error: any) {
      console.error("Error uploading cover:", error);

      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const backendMsg = error?.response?.data?.error || error?.response?.data?.msg;

      // Kasus autentikasi
      if (status === 401) {
        if (code === "NO_TOKEN") {
          toast.error("Sesi login kamu sudah habis. Silakan login lagi untuk upload cover.");
        } else if (code === "TOKEN_EXPIRED") {
          toast.error("Token sudah kedaluwarsa. Refresh halaman atau login ulang dulu.");
        } else {
          toast.error(backendMsg || "Tidak terautentikasi. Silakan login ulang.");
        }
      }
      // Kasus limit ukuran / validasi file di backend
      else if (status === 413) {
        toast.error("Cover terlalu besar untuk diproses server. Coba perkecil ukuran gambar.");
      } else if (status === 422) {
        toast.error(backendMsg || "Format cover tidak valid.");
      }
      // Network / timeout
      else if (error.code === "ECONNABORTED") {
        toast.error("Upload cover timeout. Cek koneksi lalu coba lagi.");
      } else if (error.message === "Network Error") {
        toast.error("Tidak bisa terhubung ke server. Pastikan backend hidup.");
      } else {
        toast.error(backendMsg || "Gagal upload cover image");
      }

      setCoverImageFile(null);
      setCoverImagePreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  // Inline image upload is now handled inside the custom drag & drop editor

  const handleAddTag = (tagName?: string) => {
    const tagToAdd = tagName || tagInput.trim();
    if (tagToAdd && !tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
      setTagInput("");
      setShowTagDropdown(false);
    }
  };

  const handleSelectTag = (tag: { id: string; name: string; slug: string }) => {
    handleAddTag(tag.name);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Judul dan konten harus diisi");
      return;
    }

    if (!coverImage) {
      toast.error("Cover image harus diupload");
      return;
    }

    try {
      setSaving(true);
      const response = await AxiosInstance.post("/posts", {
        title,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage,
        tags,
        published,
        customScript: customScript.trim() || null,
        authorId: userId,
      });
      toast.success("Post berhasil disimpan");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.response?.data?.error || "Gagal membuat post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke dashboard</span>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div>
              <input
                type="text"
                placeholder="Judul post kamu..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:placeholder:text-muted-foreground/30 transition-colors"
              />
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-foreground">
                Cover Image
              </label>
              
              {coverImagePreview ? (
                <div className="relative group">
                  <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden border-2 border-border bg-muted">
                    <Image
                      src={coverImagePreview}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        className="p-3 bg-destructive/90 text-destructive-foreground rounded-lg hover:bg-destructive transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="relative w-full h-64 md:h-96 rounded-xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 group"
                >
                  {uploadingCover ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Mengupload...</p>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Klik untuk upload cover image
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF atau WEBP (max 10MB)
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Ringkasan
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Tulis ringkasan singkat tentang post ini..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Tag
              </label>
              <div className="flex gap-2 relative" ref={tagInputRef}>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagDropdown(true);
                    }}
                    onFocus={() => {
                      // Show dropdown when focused, showing all available tags that aren't already selected
                      const availableTagsFiltered = availableTags.filter((tag) => !tags.includes(tag.name));
                      setFilteredTags(availableTagsFiltered);
                      setShowTagDropdown(true); // Always show dropdown when focused
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (filteredTags.length > 0) {
                          handleSelectTag(filteredTags[0]);
                        } else {
                          handleAddTag();
                        }
                      }
                    }}
                    placeholder="Tambah tag atau pilih dari daftar..."
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  {/* Tag Dropdown */}
                  {showTagDropdown && filteredTags.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleSelectTag(tag)}
                          className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
                        >
                          <span className="text-foreground">{tag.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {tag._count?.posts || 0} posts
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Tambah
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2 font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Available Tags List - Show when input is focused */}
              {showTagDropdown && availableTags.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Tag yang tersedia:
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-muted/30 rounded-lg border border-border/50">
                    {availableTags
                      .filter((tag) => !tags.includes(tag.name))
                      .map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleSelectTag(tag)}
                          className="px-3 py-1.5 bg-card hover:bg-accent border border-border rounded-full text-sm text-foreground transition-all hover:border-primary/50 hover:text-primary flex items-center gap-2"
                        >
                          <span>{tag.name}</span>
                          {tag._count?.posts && (
                            <span className="text-xs text-muted-foreground">
                              ({tag._count.posts})
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Editor - Drag & Drop */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-foreground">
                Konten
              </label>
              <DragDropPostEditor value={content} onChange={setContent} customScript={customScript} />
            </div>

            {/* Custom API Section */}
            <CustomAPIEditor
              value={customScript}
              onChange={setCustomScript}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-border bg-card checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all"
                  />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Publikasi langsung
                </span>
              </label>
              <button
                type="submit"
                disabled={saving || !coverImage}
                className="flex items-center justify-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 text-sm sm:text-base w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Simpan Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
