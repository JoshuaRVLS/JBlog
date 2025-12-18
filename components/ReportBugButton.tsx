"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bug, X, Send, Loader2 } from "lucide-react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import { FormInput, FormTextarea, FormSelect } from "@/components/ui/FormInput";

export default function ReportBugButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "bug",
  });
  const pathname = usePathname();

  // On the messages page, hide floating button on mobile to avoid covering chat input
  const isMessagesPage = pathname?.startsWith("/messages");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error("Judul dan deskripsi harus diisi");
      return;
    }

    try {
      setSubmitting(true);
      const pageUrl = typeof window !== "undefined" ? window.location.href : null;

      await AxiosInstance.post("/reports", {
        ...formData,
        pageUrl,
      });

      toast.success("Report berhasil dikirim! Terima kasih atas feedbacknya.");
      setIsOpen(false);
      setFormData({
        title: "",
        description: "",
        type: "bug",
      });
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.msg || "Gagal mengirim report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div 
        className={`fixed bottom-24 right-8 z-50 flex flex-col items-end gap-3 lg:bottom-8 ${
          isMessagesPage ? "hidden md:flex" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tooltip/Label - disable on messages page to avoid overlapping near chat input */}
        {!isMessagesPage && (
          <div 
            className={`hidden md:block transition-all duration-300 pointer-events-none ${
              isHovered 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-2"
            }`}
          >
            <div className="bg-card border border-border/50 rounded-lg px-4 py-2 shadow-xl backdrop-blur-sm">
              <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                Report Bug / Feedback
              </p>
            </div>
          </div>
        )}
        
        {/* Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground rounded-2xl shadow-2xl hover:shadow-primary/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center overflow-hidden"
          aria-label="Report Bug"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-primary/30 rounded-2xl animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl"></div>
          
          {/* Ripple effect on hover */}
          <div className="absolute inset-0 rounded-2xl bg-primary/20 scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Icon */}
          <div className="relative z-10">
            <Bug className="h-7 w-7 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
          </div>
          
          {/* Notification dot */}
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-ping"></div>
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></div>
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-sm">
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
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Type */}
              <FormSelect
                label="Tipe Report"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature Request</option>
                <option value="other">Lainnya</option>
              </FormSelect>

              {/* Title */}
              <FormInput
                label="Judul"
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Tombol tidak berfungsi di halaman dashboard"
              />

              {/* Description */}
              <FormTextarea
                label="Deskripsi"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Jelaskan secara detail tentang bug atau feature yang ingin dilaporkan..."
                rows={6}
              />

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
          </div>
        </div>
      )}
    </>
  );
}

