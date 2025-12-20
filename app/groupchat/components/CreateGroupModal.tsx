"use client";

import { X, Globe, Lock, Loader2, Save } from "lucide-react";

interface CreateGroupModalProps {
  show: boolean;
  creating: boolean;
  formData: {
    name: string;
    description: string;
    isPublic: boolean;
  };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string | boolean) => void;
}

export default function CreateGroupModal({
  show,
  creating,
  formData,
  onClose,
  onSubmit,
  onChange,
}: CreateGroupModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gradient">Buat Group Chat Baru</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Nama Group <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Masukkan nama group"
              className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
              required
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Deskripsi (Opsional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Deskripsi group chat..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all shadow-sm"
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => onChange("isPublic", e.target.checked)}
                className="w-4 h-4 rounded border-2 border-border/50 bg-card checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary cursor-pointer transition-all"
                disabled={creating}
              />
              <span>Group Public (Semua orang bisa join)</span>
            </label>
            <p className="text-xs text-muted-foreground ml-6">
              {formData.isPublic ? (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Group ini dapat ditemukan dan di-join oleh semua user
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Group ini hanya dapat di-join dengan invite
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Buat Group
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-accent"
              disabled={creating}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

