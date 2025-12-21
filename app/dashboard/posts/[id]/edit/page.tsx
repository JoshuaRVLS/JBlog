"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Eye,
  EyeOff,
  User,
  Code2,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { FormTextarea } from "@/components/ui/FormInput";
import DragDropPostEditor from "@/components/editor/DragDropPostEditor";

export default function EditPost() {
  const { userId, authenticated } = useContext(AuthContext);
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
  const [showPreview, setShowPreview] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLDivElement>(null);

  const [versions, setVersions] = useState<
    Array<{
      id: string;
      title: string;
      createdAt: string;
      createdBy: {
        id: string;
        name: string;
        profilePicture: string | null;
      } | null;
    }>
  >([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const hasRetriedUpdateRef = useRef(false);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await AxiosInstance.get("/tags");
        if (response.data) {
          setAvailableTags(response.data.tags || []);
          setFilteredTags(response.data.tags || []);
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

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (params.id) {
      fetchPost();
      fetchVersions();
    }
  }, [params.id, authenticated]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(`/posts/${params.id}`);
      const post = response.data;
      setTitle(post.title);
      setContent(post.content);
      setExcerpt(post.excerpt || "");
      setCoverImage(post.coverImage || null);
      setCoverImagePreview(post.coverImage || null);
      setPublished(post.published);
      setCustomScript(post.customScript || "");
      setTags(post.tags?.map((pt: any) => pt.tag.name) || []);
    } catch (error: any) {
      console.error("Error fetching post:", error);
      toast.error("Gagal memuat post");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    if (!params.id) return;
    try {
      setLoadingVersions(true);
      const response = await AxiosInstance.get(`/posts/${params.id}/versions`);
      const list =
        response.data?.versions?.map((v: any) => ({
          id: v.id,
          title: v.title,
          createdAt: v.createdAt,
          createdBy: v.user
            ? {
                id: v.user.id,
                name: v.user.name,
                profilePicture: v.user.profilePicture || null,
              }
            : null,
        })) || [];
      setVersions(list);
    } catch (error: any) {
      console.error("Error fetching post versions:", error);
      // Jangan spam toast, cukup log saja
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!params.id) return;
    try {
      setRestoringVersionId(versionId);
      const response = await AxiosInstance.post(
        `/posts/${params.id}/versions/${versionId}/restore`
      );
      const post = response.data?.post;
      if (post) {
        setTitle(post.title);
        setContent(post.content);
        setExcerpt(post.excerpt || "");
        setCoverImage(post.coverImage || null);
        setCoverImagePreview(post.coverImage || null);
        toast.success("Post berhasil direstore ke versi terpilih");
        // Refresh daftar versi karena versi baru akan dibuat saat restore
        fetchVersions();
      } else {
        toast.success("Post berhasil direstore");
      }
    } catch (error: any) {
      console.error("Error restoring post version:", error);
      toast.error(error.response?.data?.error || "Gagal merestore versi post");
    } finally {
      setRestoringVersionId(null);
    }
  };

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

      if (status === 401) {
        if (code === "NO_TOKEN") {
          toast.error("Sesi login kamu sudah habis. Silakan login lagi untuk upload cover.");
        } else if (code === "TOKEN_EXPIRED") {
          toast.error("Token sudah kedaluwarsa. Refresh halaman atau login ulang dulu.");
        } else {
          toast.error(backendMsg || "Tidak terautentikasi. Silakan login ulang.");
        }
      } else if (status === 413) {
        toast.error("Cover terlalu besar untuk diproses server. Coba perkecil ukuran gambar.");
      } else if (status === 422) {
        toast.error(backendMsg || "Format cover tidak valid.");
      } else if (error.code === "ECONNABORTED") {
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

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      setUploadingInline(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await AxiosInstance.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = response.data.url;
      
      // Pastikan URL bersih tanpa quote marks atau karakter aneh
      const cleanUrl = imageUrl.trim().replace(/^["']|["']$/g, "");
      
      // Insert image dengan format yang menampilkan gambar di tengah dengan caption
      // Menggunakan HTML untuk kontrol lebih baik
      const imageMarkdown = `\n\n<div class="image-block">
  <div class="image-container">
    <img src="${cleanUrl}" alt="Gambar" />
  </div>
  <p class="image-caption">*Deskripsi gambar*</p>
</div>\n\n`;
      
      // Untuk editor baru, cukup tambahkan HTML block ke akhir konten.
      const cursorPos = content.length;
      const newContent =
        content.slice(0, cursorPos) + imageMarkdown + content.slice(cursorPos);
      setContent(newContent);
      
      toast.success("Gambar berhasil ditambahkan");
    } catch (error: any) {
      console.error("Error uploading inline image:", error);
      toast.error(error.response?.data?.error || "Gagal upload gambar");
    } finally {
      setUploadingInline(false);
      if (inlineImageInputRef.current) {
        inlineImageInputRef.current.value = "";
      }
    }
  };

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

    // Kalau ternyata sudah tidak authenticated (misal tab lama), langsung arahkan ke login
    if (!authenticated) {
      toast.error("Sesi login kamu sudah habis. Silakan login lagi untuk update post.", {
        duration: 5000,
      });
      const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
      const redirectPath = id ? `/dashboard/posts/${id}/edit` : "/dashboard";
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

    const doUpdate = async () => {
      await AxiosInstance.put(`/posts/${id}`, {
        title,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        tags,
        published,
        customScript: customScript.trim() || null,
      });
    };

    try {
      setSaving(true);
      await doUpdate();
      toast.success("Post berhasil diperbarui");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error updating post:", error);

      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const backendMsg = error?.response?.data?.error || error?.response?.data?.msg;

      // Auto-refresh token sekali kalau 401, lalu retry update
      if (status === 401 && !hasRetriedUpdateRef.current) {
        hasRetriedUpdateRef.current = true;
        try {
          await AxiosInstance.post("/auth/refresh");
          await doUpdate();
          toast.success("Post berhasil diperbarui");
          router.push("/dashboard");
          return;
        } catch (refreshError: any) {
          console.error("Error refreshing token atau retry update:", refreshError);
          const refreshStatus = refreshError?.response?.status;
          const refreshCode = refreshError?.response?.data?.code;
          const refreshMsg = refreshError?.response?.data?.error || refreshError?.response?.data?.msg;

          if (refreshStatus === 401) {
            if (refreshCode === "NO_TOKEN") {
              toast.error("Sesi login kamu sudah habis. Silakan login lagi untuk update post.", {
                duration: 5000,
              });
            } else if (refreshCode === "TOKEN_EXPIRED") {
              toast.error("Token sudah kedaluwarsa. Silakan login ulang.", {
                duration: 5000,
              });
            } else {
              toast.error(refreshMsg || "Tidak terautentikasi. Silakan login ulang.", {
                duration: 5000,
              });
            }

            const redirectPath = id ? `/dashboard/posts/${id}/edit` : "/dashboard";
            router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
            return;
          }

          toast.error(refreshMsg || "Gagal memperbarui post setelah refresh sesi.");
          return;
        }
      }

      toast.error(backendMsg || "Gagal memperbarui post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="relative">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <span className="text-lg font-medium text-foreground">Memuat post...</span>
          </div>
        </div>
      </div>
    );
  }

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
            <FormTextarea
              label="Ringkasan"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Tulis ringkasan singkat tentang post ini..."
              rows={3}
            />

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
                          <span className="text-sm text-foreground">{tag.name}</span>
                          {tag._count && (
                            <span className="text-xs text-muted-foreground">
                              {tag._count.posts} posts
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg transition-colors font-medium"
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

            {/* Content Editor with Preview Toggle (Drag & Drop) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <label className="block text-sm font-semibold text-foreground">
                  Konten (Markdown)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg transition-colors text-sm font-medium"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span className="hidden sm:inline">Sembunyikan Preview</span>
                        <span className="sm:hidden">Edit</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Lihat Preview</span>
                        <span className="sm:hidden">Preview</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  ref={inlineImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInlineImageUpload}
                  className="hidden"
                />
              </div>
              
              {showPreview ? (
                <div className="border-2 border-border/50 rounded-xl overflow-hidden bg-card shadow-lg">
                  <div className="p-4 md:p-8 bg-card">
                    <div className="prose prose-invert max-w-none">
                      <MarkdownRenderer content={content || "*Konten masih kosong*"} />
                    </div>
                  </div>
                </div>
              ) : (
                <DragDropPostEditor value={content} onChange={setContent} />
              )}
              
              <p className="text-xs text-muted-foreground">
                💡 Tip: Susun paragraf dan gambar dengan drag & drop untuk membuat layout post yang rapi.
              </p>
            </div>

            {/* Versions History */}
            <div className="border border-border/60 rounded-xl p-4 bg-card/60 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Riwayat Versi
                </h3>
                {loadingVersions && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Memuat...</span>
                  </div>
                )}
              </div>
              {versions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada riwayat versi. Setiap kali kamu mengupdate post, versi lama akan disimpan di sini.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {v.createdBy?.profilePicture ? (
                          <Image
                            src={v.createdBy.profilePicture}
                            alt={v.createdBy.name}
                            width={28}
                            height={28}
                            className="rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {v.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(v.createdAt).toLocaleString("id-ID", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(v.id)}
                        disabled={restoringVersionId === v.id}
                        className="px-3 py-1.5 text-[11px] rounded-lg border border-border bg-background hover:bg-primary/10 hover:border-primary/60 text-foreground font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {restoringVersionId === v.id ? "Merestore..." : "Restore"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Script Section */}
            <div className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <label className="block text-sm font-semibold text-foreground">
                  Custom Script (JavaScript/HTML)
                </label>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Tambahkan JavaScript atau HTML untuk integrasi API, widgets, atau elemen interaktif. 
                    Script akan dieksekusi di akhir post. Gunakan dengan hati-hati dan pastikan kode aman.
                  </span>
                </p>
                <textarea
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  placeholder="Contoh:&#10;&lt;script&gt;&#10;  fetch('https://api.example.com/data')&#10;    .then(res => res.json())&#10;    .then(data => {&#10;      // Display data in your post&#10;    });&#10;&lt;/script&gt;"
                  className="w-full min-h-[200px] px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  spellCheck={false}
                />
              </div>
            </div>

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
                disabled={saving}
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
                    <span>Perbarui Post</span>
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
