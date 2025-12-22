"use client";

import { useState } from "react";
import { Code2, Info, ChevronDown, ChevronUp, Copy, Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface CustomScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const SCRIPT_TEMPLATES = [
  {
    name: "API Fetch dengan Placeholder",
    description: "Fetch API dan replace {placeholder} di content",
    code: `// Di content post, gunakan: Harga Bitcoin: {bitcoinPrice}
// Script ini akan replace {bitcoinPrice} dengan data dari API

fetch('https://api.coindesk.com/v1/bpi/currentprice.json')
  .then(res => res.json())
  .then(data => {
    const price = data.bpi.USD.rate;
    // Replace {bitcoinPrice} di seluruh post content
    const postContent = document.querySelector('.prose');
    if (postContent) {
      postContent.innerHTML = postContent.innerHTML.replace(/{bitcoinPrice}/g, price);
    }
  })
  .catch(err => {
    console.error('Error fetching data:', err);
  });`,
  },
  {
    name: "Multiple Placeholders",
    description: "Fetch API dan replace multiple {placeholder}",
    code: `// Di content: Suhu: {temperature}°C, Kondisi: {condition}
fetch('https://api.openweathermap.org/data/2.5/weather?q=Jakarta&appid=YOUR_API_KEY&units=metric')
  .then(res => res.json())
  .then(data => {
    const postContent = document.querySelector('.prose');
    if (postContent) {
      postContent.innerHTML = postContent.innerHTML
        .replace(/{temperature}/g, data.main.temp)
        .replace(/{condition}/g, data.weather[0].description);
    }
  })
  .catch(err => console.error('Error:', err));`,
  },
  {
    name: "Inject ke Element dengan ID",
    description: "Inject data ke elemen dengan custom ID",
    code: `// Di content: <div id="my-api-data">Loading...</div>
fetch('https://api.example.com/data')
  .then(res => res.json())
  .then(data => {
    const element = document.getElementById('my-api-data');
    if (element) {
      element.textContent = JSON.stringify(data, null, 2);
    }
  })
  .catch(err => console.error('Error:', err));`,
  },
  {
    name: "API Data Display",
    description: "Ambil data dari API dan tampilkan di post",
    code: `<div id="api-data-container"></div>
<script>
  fetch('https://api.example.com/data')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('api-data-container');
      container.innerHTML = '<h3>Data dari API:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
    })
    .catch(err => {
      console.error('Error:', err);
    });
</script>`,
  },
  {
    name: "Weather Widget",
    description: "Tampilkan cuaca dari API",
    code: `<div id="weather-widget" style="padding: 1rem; background: #f0f0f0; border-radius: 8px; margin: 1rem 0;">
  <p>Memuat cuaca...</p>
</div>
<script>
  fetch('https://api.openweathermap.org/data/2.5/weather?q=Jakarta&appid=YOUR_API_KEY&units=metric')
    .then(res => res.json())
    .then(data => {
      const widget = document.getElementById('weather-widget');
      widget.innerHTML = \`
        <h3>Cuaca di \${data.name}</h3>
        <p>Suhu: \${data.main.temp}°C</p>
        <p>Kondisi: \${data.weather[0].description}</p>
      \`;
    });
</script>`,
  },
  {
    name: "Counter Button",
    description: "Tombol counter sederhana",
    code: `<div style="text-align: center; margin: 1rem 0;">
  <button id="counter-btn" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
    Klik: <span id="count">0</span>
  </button>
</div>
<script>
  let count = 0;
  const btn = document.getElementById('counter-btn');
  const countSpan = document.getElementById('count');
  
  btn.addEventListener('click', () => {
    count++;
    countSpan.textContent = count;
  });
</script>`,
  },
  {
    name: "Embed YouTube Video",
    description: "Embed video YouTube",
    code: `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;">
  <iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://www.youtube.com/embed/VIDEO_ID" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen>
  </iframe>
</div>
<p style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">
  Ganti VIDEO_ID dengan ID video YouTube Anda
</p>`,
  },
  {
    name: "Real-time Clock",
    description: "Jam real-time yang update setiap detik",
    code: `<div id="clock" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin: 1rem 0;">
  <h3 style="margin: 0;">Waktu Saat Ini</h3>
  <p id="time" style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">--:--:--</p>
  <p id="date" style="margin: 0;">--</p>
</div>
<script>
  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID');
    const date = now.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    document.getElementById('time').textContent = time;
    document.getElementById('date').textContent = date;
  }
  
  updateClock();
  setInterval(updateClock, 1000);
</script>`,
  },
];

export default function CustomScriptEditor({ value, onChange }: CustomScriptEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUseTemplate = (template: typeof SCRIPT_TEMPLATES[0]) => {
    onChange(template.code);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" telah diterapkan!`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Kode telah disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <label className="block text-sm font-semibold text-foreground">
            Custom Script (Opsional)
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
                  Apa itu Custom Script?
                </p>
                <p className="text-muted-foreground">
                  Custom Script memungkinkan Anda fetch data dari API dan menampilkannya di post Anda. 
                  Gunakan format <code className="bg-muted px-1 rounded">{"{customId}"}</code> di content post sebagai placeholder, 
                  lalu script akan menggantinya dengan data dari API.
                </p>
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                  <p className="font-medium mb-1">Cara Menggunakan:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Tulis di content post: <code className="bg-background px-1 rounded">Harga Bitcoin: {"{bitcoinPrice}"}</code></li>
                    <li>Di Custom Script, fetch API dan replace: <code className="bg-background px-1 rounded">.replace(/{'{bitcoinPrice}'}/g, data.price)</code></li>
                    <li>Atau gunakan ID: <code className="bg-background px-1 rounded">{"<div id='my-data'>Loading...</div>"}</code></li>
                  </ol>
                </div>
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
                {SCRIPT_TEMPLATES.map((template, idx) => (
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
                Kode Anda
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
              placeholder="Masukkan JavaScript untuk fetch API...&#10;&#10;Contoh sederhana (Placeholder):&#10;// Di content: Harga: {price}&#10;fetch('https://api.example.com/data')&#10;  .then(res => res.json())&#10;  .then(data => {&#10;    const postContent = document.querySelector('.prose');&#10;    if (postContent) {&#10;      postContent.innerHTML = postContent.innerHTML.replace(/{price}/g, data.price);&#10;    }&#10;  });&#10;&#10;Contoh dengan ID:&#10;// Di content: &lt;div id='my-data'&gt;Loading...&lt;/div&gt;&#10;fetch('https://api.example.com/data')&#10;  .then(res => res.json())&#10;  .then(data => {&#10;    document.getElementById('my-data').textContent = data.value;&#10;  });"
              className="w-full min-h-[300px] px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-y"
              spellCheck={false}
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Gunakan <code className="bg-muted px-1 rounded">{"{customId}"}</code> di content post sebagai placeholder.
              </p>
              <p className="text-xs text-muted-foreground">
                🎯 <strong>Format ID:</strong> Atau gunakan <code className="bg-muted px-1 rounded">{"<div id='my-id'>Loading...</div>"}</code> di content, lalu inject data ke elemen tersebut.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

