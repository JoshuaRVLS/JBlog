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

interface APIConfig {
  apiUrl: string;
  mappings: APIMapping[];
}

export default function CustomAPIEditor({ value, onChange }: CustomAPIEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [apis, setApis] = useState<APIConfig[]>([
    { apiUrl: "", mappings: [{ placeholder: "", apiField: "" }] }
  ]);

  // Parse existing value to populate form
  useEffect(() => {
    if (value) {
      try {
        const config = JSON.parse(value);
        // Support both old format (single API) and new format (multiple APIs)
        if (config.apis && Array.isArray(config.apis)) {
          // New format: multiple APIs
          setApis(config.apis.length > 0 ? config.apis : [{ apiUrl: "", mappings: [{ placeholder: "", apiField: "" }] }]);
        } else if (config.apiUrl) {
          // Old format: single API - convert to new format
          setApis([{
            apiUrl: config.apiUrl,
            mappings: config.mappings || [{ placeholder: "", apiField: "" }]
          }]);
        } else {
          setApis([{ apiUrl: "", mappings: [{ placeholder: "", apiField: "" }] }]);
        }
      } catch {
        // If not JSON, it's old format - ignore
        setApis([{ apiUrl: "", mappings: [{ placeholder: "", apiField: "" }] }]);
      }
    } else {
      setApis([{ apiUrl: "", mappings: [{ placeholder: "", apiField: "" }] }]);
    }
  }, [value]);

  const handleAddAPI = () => {
    setApis([...apis, { apiUrl: "", mappings: [{ placeholder: "", apiField: "" }] }]);
  };

  const handleRemoveAPI = (apiIndex: number) => {
    if (apis.length > 1) {
      setApis(apis.filter((_, i) => i !== apiIndex));
    }
  };

  const handleApiUrlChange = (apiIndex: number, url: string) => {
    const newApis = [...apis];
    newApis[apiIndex].apiUrl = url;
    setApis(newApis);
  };

  const handleAddMapping = (apiIndex: number) => {
    const newApis = [...apis];
    newApis[apiIndex].mappings.push({ placeholder: "", apiField: "" });
    setApis(newApis);
  };

  const handleRemoveMapping = (apiIndex: number, mappingIndex: number) => {
    const newApis = [...apis];
    if (newApis[apiIndex].mappings.length > 1) {
      newApis[apiIndex].mappings = newApis[apiIndex].mappings.filter((_, i) => i !== mappingIndex);
      setApis(newApis);
    }
  };

  const handleMappingChange = (apiIndex: number, mappingIndex: number, field: keyof APIMapping, newValue: string) => {
    const newApis = [...apis];
    newApis[apiIndex].mappings[mappingIndex][field] = newValue;
    setApis(newApis);
  };

  const generateScript = () => {
    // Filter out empty APIs
    const validApis = apis.filter(api => api.apiUrl.trim() && 
      api.mappings.some(m => m.placeholder.trim() && m.apiField.trim())
    );

    if (validApis.length === 0) {
      onChange("");
      return;
    }

    // Generate JavaScript code that will fetch from all APIs and replace placeholders
    // We'll fetch all APIs sequentially to avoid race conditions when replacing content
    const fetchCalls = validApis.map((api, apiIndex) => {
      const validMappings = api.mappings.filter(m => m.placeholder.trim() && m.apiField.trim());
      
      return `
  fetch('${api.apiUrl.trim()}')
    .then(res => res.json())
    .then(data${apiIndex} => {
      const postContent = document.querySelector('.prose');
      if (!postContent) return;
      
      let content = postContent.innerHTML;
      ${validMappings.map(m => {
        // Support dot notation for nested fields (e.g., "bpi.USD.rate")
        const fieldPath = m.apiField.split('.');
        let fieldAccess = `data${apiIndex}`;
        fieldPath.forEach(part => {
          fieldAccess += `?.['${part}']`;
        });
        
        return `      content = content.replace(/{${m.placeholder}}/g, ${fieldAccess} || '{${m.placeholder}}');`;
      }).join('\n')}
      
      postContent.innerHTML = content;
      return data${apiIndex};
    })
    .catch(err => {
      console.error('Error fetching API data from ${api.apiUrl.trim()}:', err);
      return null;
    })`;
    }).join(',\n');

    const script = `
Promise.all([
${fetchCalls}
]).then(() => {
  // All APIs fetched and content replaced
  console.log('All API data loaded');
}).catch(err => {
  console.error('Error loading API data:', err);
});
    `.trim();

    // Store as JSON config for easy editing
    const config = {
      apis: validApis.map(api => ({
        apiUrl: api.apiUrl.trim(),
        mappings: api.mappings.filter(m => m.placeholder.trim() && m.apiField.trim())
      })),
      script: script
    };

    onChange(JSON.stringify(config, null, 2));
  };

  // Auto-generate script when apis change
  useEffect(() => {
    generateScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apis]);

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

          {/* Multiple API Configurations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Konfigurasi API
              </label>
              <button
                type="button"
                onClick={handleAddAPI}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>Tambah API</span>
              </button>
            </div>

            {apis.map((api, apiIndex) => (
              <div key={apiIndex} className="rounded-lg border border-border bg-card/50 p-4 space-y-4">
                {/* API Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    <label className="text-sm font-medium text-foreground">
                      API #{apiIndex + 1}
                    </label>
                  </div>
                  {apis.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAPI(apiIndex)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Hapus API"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* API URL Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    URL API
                  </label>
                  <input
                    type="url"
                    value={api.apiUrl}
                    onChange={(e) => handleApiUrlChange(apiIndex, e.target.value)}
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
                      onClick={() => handleAddMapping(apiIndex)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Tambah Mapping</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {api.mappings.map((mapping, mappingIndex) => (
                      <div key={mappingIndex} className="flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={mapping.placeholder}
                            onChange={(e) => handleMappingChange(apiIndex, mappingIndex, "placeholder", e.target.value)}
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
                            onChange={(e) => handleMappingChange(apiIndex, mappingIndex, "apiField", e.target.value)}
                            placeholder="bpi.USD.rate"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Field API (gunakan titik untuk nested, e.g., data.price)
                          </p>
                        </div>
                        {api.mappings.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMapping(apiIndex, mappingIndex)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Hapus Mapping"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {apiIndex === 0 && (
                    <p className="text-xs text-muted-foreground">
                      💡 Contoh: Jika API mengembalikan <code className="bg-muted px-1 rounded">{"{bpi: {USD: {rate: '50000'}}}"}</code>, 
                      masukkan <code className="bg-muted px-1 rounded">bpi.USD.rate</code> di field API
                    </p>
                  )}
                </div>
              </div>
            ))}
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

