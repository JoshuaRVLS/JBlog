import { motion, AnimatePresence } from "motion/react";
import { X, Bug, Send, Loader2 } from "lucide-react";
import type { ReportData } from "../types";

interface ReportBugModalProps {
  isOpen: boolean;
  reportData: ReportData;
  submittingReport: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDataChange: (data: ReportData) => void;
}

export default function ReportBugModal({
  isOpen,
  reportData,
  submittingReport,
  onClose,
  onSubmit,
  onDataChange,
}: ReportBugModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                  onChange={(e) =>
                    onDataChange({
                      ...reportData,
                      type: e.target.value as "bug" | "feature" | "other",
                    })
                  }
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
                  onChange={(e) =>
                    onDataChange({ ...reportData, title: e.target.value })
                  }
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
                  onChange={(e) =>
                    onDataChange({ ...reportData, description: e.target.value })
                  }
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
                  disabled={submittingReport}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingReport ? (
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
