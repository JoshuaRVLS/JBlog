"use client";

import { useState, useEffect } from "react";
import { Info, ChevronDown, ChevronUp, Plus, X, Link as LinkIcon } from "lucide-react";

interface CustomAPIEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface APIMapping {
  placeholder: string; // e.g., "bitcoinPrice"
  apiField: string; // e.g., "bpi.USD.rate" (dot notation for nested fields)
}

export default function CustomAPIEditor({ value, onChange }: CustomAPIEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [mappings, setMappings] = useState<APIMapping[]>([{ placeholder: "", apiField: "" }]);

  // Parse existing value to populate form
  useEffect(() => {
    if (value) {
      try {
        const config = JSON.parse(value);
        if (config.apiUrl) {
          setApiUrl(config.apiUrl);
        }
        if (config.mappings && config.mappings.length > 0) {
          setMappings(config.mappings);
        }
      } catch {
        // If not JSON, it's old format - ignore
      }
    }
  }, [value]);

  const handleAddMapping = () => {
    setMappings([...mappings, { placeholder: "", apiField: "" }]);
  };

  const handleRemoveMapping = (index: number) => {
    if (mappings.length > 1) {
      setMappings(mappings.filter((_, i) => i !== index));
    }
  };

  const handleMappingChange = (index: number, field: keyof APIMapping, newValue: string) => {
    const newMappings = [...mappings];
    newMappings[index][field] = newValue;
    setMappings(newMappings);
    // Generate script will be called on blur
  };

  const handleApiUrlChange = (url: string) => {
    setApiUrl(url);
    // Generate script will be called on blur
  };

  const generateScript = () => {
    if (!apiUrl.trim()) {
      onChange("");
      return;
    }

    const validMappings = mappings.filter(m => m.placeholder.trim() && m.apiField.trim());
    if (validMappings.length === 0) {
      onChange("");
      return;
    }

    // Generate JavaScript code that will fetch and replace placeholders
    const script = `
fetch('${apiUrl.trim()}')
  .then(res => res.json())
  .then(data => {
    const postContent = document.querySelector('.prose');
    if (!postContent) return;
    
    let content = postContent.innerHTML;
    ${validMappings.map(m => {
      // Support dot notation for nested fields (e.g., "bpi.USD.rate")
      const fieldPath = m.apiField.split('.');
      let fieldAccess = 'data';
      fieldPath.forEach(part => {
        fieldAccess += `['${part}']`;
      });
      
      return `    content = content.replace(/{${m.placeholder}}/g, ${fieldAccess} || '{${m.placeholder}}');`;
    }).join('\n')}
    
    postContent.innerHTML = content;
  })
  .catch(err => {
    console.error('Error fetching API data:', err);
  });
    `.trim();

    // Store as JSON config for easy editing
    const config = {
      apiUrl: apiUrl.trim(),
      mappings: validMappings,
      script: script
    };

    onChange(JSON.stringify(config, null, 2));
  };

  // Auto-generate script when apiUrl or mappings change
  useEffect(() => {
    generateScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, mappings]);

  return (
    <div className="space-y-3 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <label className="block text-sm font-semibold text-foreground">
            Custom API (Opsional)
          </label>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Easy
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
                  Custom API - Tanpa Coding!
                </p>
                <p className="text-muted-foreground">
                  Masukkan URL API dan mapping placeholder. Sistem akan otomatis fetch data dan replace placeholder di content post Anda.
                </p>
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                  <p className="font-medium mb-1">Cara Menggunakan:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Di content post, tulis: <code className="bg-background px-1 rounded">Harga Bitcoin: {"{bitcoinPrice}"}</code></li>
                    <li>Di bawah, masukkan URL API dan mapping: <code className="bg-background px-1 rounded">bitcoinPrice → bpi.USD.rate</code></li>
                    <li>Selesai! Sistem akan otomatis fetch dan replace.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* API URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              URL API
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => handleApiUrlChange(e.target.value)}
              placeholder="https://api.example.com/data"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Masukkan URL API yang mengembalikan data JSON
            </p>
          </div>

          {/* Mappings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Mapping Placeholder ke Field API
              </label>
              <button
                type="button"
                onClick={handleAddMapping}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>Tambah Mapping</span>
              </button>
            </div>

            <div className="space-y-2">
              {mappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={mapping.placeholder}
                      onChange={(e) => handleMappingChange(index, "placeholder", e.target.value)}
                      placeholder="bitcoinPrice"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Placeholder (tanpa {"{"} dan {"}"})
                    </p>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    →
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={mapping.apiField}
                      onChange={(e) => handleMappingChange(index, "apiField", e.target.value)}
                      placeholder="bpi.USD.rate"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Field API (gunakan titik untuk nested, e.g., data.price)
                    </p>
                  </div>
                  {mappings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMapping(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              💡 Contoh: Jika API mengembalikan <code className="bg-muted px-1 rounded">{"{bpi: {USD: {rate: '50000'}}}"}</code>, 
              masukkan <code className="bg-muted px-1 rounded">bpi.USD.rate</code> di field API
            </p>
          </div>

          {/* Preview */}
          {value && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">
                ✅ Konfigurasi tersimpan
              </p>
              <p className="text-xs text-muted-foreground">
                Script akan otomatis di-generate dan dijalankan saat post dibuka.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

