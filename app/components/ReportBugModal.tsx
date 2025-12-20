"use client";

import { X, Bug, Send, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface ReportBugModalProps {
  show: boolean;
  submitting: boolean;
  reportData: {
    title: string;
    description: string;
    type: string;
  };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string) => void;
}

export default function ReportBugModal({
  show,
  submitting,
  reportData,
  onClose,
  onSubmit,
  onChange,
}: ReportBugModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Report Bug</h2>
              <p className="text-sm text-muted-foreground">
                Laporkan bug atau berikan feedback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Tipe Report
            </label>
            <select
              value={reportData.type}
              onChange={(e) => onChange("type", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="bug">Bug</option>
              <option value="feature">Feature Request</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Judul <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={reportData.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Contoh: Tombol tidak berfungsi di halaman dashboard"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Deskripsi <span className="text-destructive">*</span>
            </label>
            <textarea
              value={reportData.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Jelaskan secara detail tentang bug atau feature yang ingin dilaporkan..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Kirim Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

