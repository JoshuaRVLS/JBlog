"use client";

import { useState } from "react";
import { Palette, Info, ChevronDown, ChevronUp, Copy, Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface CustomCSSEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const CSS_TEMPLATES = [
  {
    name: "Gradient Background",
    description: "Background gradient yang menarik",
    code: `.profile-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  padding: 2rem !important;
  border-radius: 1rem !important;
  color: white !important;
  border: none !important;
}

.profile-name {
  color: white !important;
  font-size: 2rem !important;
  font-weight: bold !important;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2) !important;
}

.profile-bio {
  color: rgba(255, 255, 255, 0.9) !important;
}`,
  },
  {
    name: "Glassmorphism",
    description: "Efek kaca modern",
    code: `.profile-container {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 1rem !important;
  padding: 2rem !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37) !important;
}`,
  },
  {
    name: "Dark Theme",
    description: "Tema gelap dengan aksen warna",
    code: `.profile-container {
  background: #1a1a1a !important;
  color: #ffffff !important;
  padding: 2rem !important;
  border-radius: 1rem !important;
  border: 2px solid #333 !important;
}

.profile-name {
  color: #4ade80 !important;
  font-size: 2rem !important;
  font-weight: bold !important;
}

.profile-bio {
  color: #a1a1aa !important;
}

.profile-description {
  color: #d1d5db !important;
}`,
  },
  {
    name: "Colorful Card",
    description: "Kartu berwarna dengan shadow",
    code: `.profile-container {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4) !important;
  padding: 2rem !important;
  border-radius: 1rem !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
  color: white !important;
  border: none !important;
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.profile-container:hover {
  transform: translateY(-5px) !important;
}

.profile-name {
  color: white !important;
}

.profile-bio {
  color: rgba(255, 255, 255, 0.95) !important;
}`,
  },
  {
    name: "Minimalist",
    description: "Desain minimalis dan bersih",
    code: `.profile-container {
  background: #ffffff !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 0.5rem !important;
  padding: 2rem !important;
}

.profile-name {
  color: #111827 !important;
  font-size: 1.75rem !important;
  font-weight: 600 !important;
  margin-bottom: 0.5rem !important;
}

.profile-bio {
  color: #6b7280 !important;
  line-height: 1.6 !important;
}`,
  },
];

export default function CustomCSSEditor({ value, onChange }: CustomCSSEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUseTemplate = (template: typeof CSS_TEMPLATES[0]) => {
    onChange(template.code);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" telah diterapkan!`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("CSS telah disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <label className="block text-sm font-semibold text-foreground">
            Custom CSS (Opsional)
          </label>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Advanced
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Sembunyikan</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Tampilkan</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Info Card */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">
                  Apa itu Custom CSS?
                </p>
                <p className="text-muted-foreground">
                  Custom CSS memungkinkan Anda mengubah tampilan halaman profile Anda. 
                  Gunakan template di bawah untuk memulai, atau tulis CSS Anda sendiri.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Gunakan selector seperti <code className="bg-muted px-1 rounded">.profile-container</code>, 
                  <code className="bg-muted px-1 rounded">.profile-name</code>, <code className="bg-muted px-1 rounded">.profile-bio</code>, atau <code className="bg-muted px-1 rounded">.profile-description</code>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Gunakan <code className="bg-muted px-1 rounded">!important</code> untuk override Tailwind classes jika perlu
                </p>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Template Siap Pakai
              </label>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs text-primary hover:underline"
              >
                {showTemplates ? "Sembunyikan" : "Lihat Template"}
              </button>
            </div>

            {showTemplates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CSS_TEMPLATES.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    className="text-left p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all group"
                  >
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                      {template.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                CSS Anda
              </label>
              {value && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Masukkan CSS Anda di sini...&#10;&#10;Contoh sederhana:&#10;.profile-container {&#10;  background: #f0f0f0;&#10;  padding: 2rem;&#10;  border-radius: 1rem;&#10;}&#10;&#10;.profile-name {&#10;  color: #333;&#10;  font-size: 2rem;&#10;  font-weight: bold;&#10;}"
              className="w-full min-h-[300px] px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-y"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              💡 Tip: Gunakan template di atas untuk memulai dengan cepat, atau tulis CSS Anda sendiri. 
              CSS akan diterapkan hanya pada halaman profile Anda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


