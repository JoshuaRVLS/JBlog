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
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
import "@uiw/react-md-editor/markdown-editor.css";

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
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
          setFilteredTags(data.tags || []);
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
      // Show dropdown if there are filtered results
      if (filtered.length > 0) {
        setShowTagDropdown(true);
      }
    } else {
      setFilteredTags(availableTagsFiltered);
      // Don't automatically close dropdown when input is empty - let onFocus handle it
    }
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

  if (!authenticated) {
    router.push("/login");
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
      toast.error(error.response?.data?.error || "Gagal upload cover image");
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
      
      // Insert di posisi cursor atau di akhir
      // Gunakan MDEditor API jika tersedia, atau langsung insert ke content
      if (editorRef.current && editorRef.current.textarea) {
        // Insert menggunakan MDEditor API
        const textarea = editorRef.current.textarea;
        const start = textarea.selectionStart || content.length;
        const end = textarea.selectionEnd || content.length;
        const newContent = content.slice(0, start) + imageMarkdown + content.slice(end);
        setContent(newContent);
        
        // Set cursor position setelah image markdown
        setTimeout(() => {
          if (textarea) {
            const newPos = start + imageMarkdown.length;
            textarea.setSelectionRange(newPos, newPos);
            textarea.focus();
          }
        }, 0);
      } else {
        // Fallback: insert di akhir
        const cursorPos = content.length;
        const newContent = content.slice(0, cursorPos) + imageMarkdown + content.slice(cursorPos);
        setContent(newContent);
      }
      
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
                      if (availableTagsFiltered.length > 0) {
                        setShowTagDropdown(true);
                      }
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
            </div>

            {/* Content Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-foreground">
                  Konten (Markdown)
                </label>
                <button
                  type="button"
                  onClick={() => inlineImageInputRef.current?.click()}
                  disabled={uploadingInline}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {uploadingInline ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4" />
                      <span>Tambah Gambar</span>
                    </>
                  )}
                </button>
                <input
                  ref={inlineImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInlineImageUpload}
                  className="hidden"
                />
              </div>
              
              <div className="relative border-2 border-border/50 rounded-xl overflow-hidden bg-gradient-to-br from-card via-card to-card/95 shadow-xl backdrop-blur-sm">
                {/* Editor Header with gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
                
                <style jsx global>{`
                  .w-md-editor {
                    background: transparent !important;
                    color: hsl(var(--foreground)) !important;
                    border: none !important;
                  }
                  .w-md-editor-text {
                    background: transparent !important;
                  }
                  .w-md-editor-text-textarea {
                    background: transparent !important;
                    color: hsl(var(--foreground)) !important;
                    min-height: 600px !important;
                    font-size: 16px !important;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                    line-height: 1.8 !important;
                    padding: 32px !important;
                    border: none !important;
                  }
                  .w-md-editor-text-textarea:focus {
                    outline: none !important;
                    box-shadow: none !important;
                  }
                  .w-md-editor-toolbar {
                    background: linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted)/80) 100%) !important;
                    border-bottom: 1px solid hsl(var(--border)/50) !important;
                    padding: 12px 16px !important;
                    backdrop-filter: blur(10px) !important;
                  }
                  .w-md-editor-toolbar button {
                    color: hsl(var(--foreground)) !important;
                    border-radius: 6px !important;
                    transition: all 0.2s ease !important;
                  }
                  .w-md-editor-toolbar button:hover {
                    background-color: hsl(var(--accent)) !important;
                    transform: translateY(-1px) !important;
                  }
                  .w-md-editor-text-pre {
                    background: transparent !important;
                    color: hsl(var(--foreground)) !important;
                  }
                  
                  /* Image Block Styling - untuk preview dan editor */
                  .w-md-editor-preview .image-block,
                  .wmde-markdown .image-block {
                    margin: 2rem 0 !important;
                    padding: 1.5rem !important;
                    background: linear-gradient(135deg, hsl(var(--muted)/30) 0%, hsl(var(--muted)/10) 100%) !important;
                    border: 1px solid hsl(var(--border)/30) !important;
                    border-radius: 1rem !important;
                    text-align: center !important;
                  }
                  .w-md-editor-preview .image-container,
                  .wmde-markdown .image-container {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    margin-bottom: 1rem !important;
                  }
                  .w-md-editor-preview .image-container img,
                  .wmde-markdown .image-container img {
                    max-width: 100% !important;
                    height: auto !important;
                    max-height: 500px !important;
                    border-radius: 0.75rem !important;
                    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3) !important;
                    object-fit: contain !important;
                    background: hsl(var(--muted)/20) !important;
                    padding: 0.5rem !important;
                  }
                  .w-md-editor-preview .image-caption,
                  .wmde-markdown .image-caption {
                    font-style: italic !important;
                    color: hsl(var(--muted-foreground)) !important;
                    font-size: 0.9rem !important;
                    margin-top: 0.75rem !important;
                    text-align: center !important;
                  }
                  
                  /* Ensure images are displayed, not as links */
                  .w-md-editor-preview img:not(.image-container img),
                  .w-md-editor-preview .wmde-markdown img:not(.image-container img) {
                    display: block !important;
                    max-width: 100% !important;
                    height: auto !important;
                    margin: 1.5rem auto !important;
                    border-radius: 0.5rem !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                    object-fit: contain !important;
                  }
                  .w-md-editor-preview a img:not(.image-container img),
                  .w-md-editor-preview .wmde-markdown a img:not(.image-container img) {
                    display: block !important;
                    pointer-events: none !important;
                  }
                `}</style>
                <MDEditor
                  ref={editorRef}
                  value={content}
                  onChange={(val) => setContent(val || "")}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="dark"
                  height={600}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Tip: Gunakan tombol "Tambah Gambar" untuk menambahkan gambar inline dengan caption
              </p>
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
