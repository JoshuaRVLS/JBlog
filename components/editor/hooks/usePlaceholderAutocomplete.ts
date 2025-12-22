import { useState, useMemo } from "react";

export function usePlaceholderAutocomplete(customScript?: string) {
  const [placeholderMenu, setPlaceholderMenu] = useState<{
    blockId: string | null;
    query: string;
    position: { top: number; left: number } | null;
  }>({ blockId: null, query: "", position: null });

  // Parse customScript to extract placeholder names
  const availablePlaceholders = useMemo(() => {
    if (!customScript || !customScript.trim()) {
      console.log('[PlaceholderAutocomplete] No customScript provided');
      return [];
    }

    try {
      const config = JSON.parse(customScript);
      console.log('[PlaceholderAutocomplete] Parsed config:', config);
      
      if (config.mappings && Array.isArray(config.mappings)) {
        const placeholders = config.mappings
          .filter((m: { placeholder: string; apiField: string }) => m.placeholder && m.apiField)
          .map((m: { placeholder: string; apiField: string }) => ({
            placeholder: m.placeholder.trim(),
            apiField: m.apiField.trim(),
          }));
        console.log('[PlaceholderAutocomplete] Extracted placeholders:', placeholders);
        return placeholders;
      }
    } catch (error) {
      console.error('[PlaceholderAutocomplete] Error parsing customScript:', error);
      // If not JSON, it's old format - ignore
    }

    return [];
  }, [customScript]);

  const filteredPlaceholders = useMemo(() => {
    if (!placeholderMenu.query) return availablePlaceholders;
    const q = placeholderMenu.query.toLowerCase().trim();
    if (!q) return availablePlaceholders;
    return availablePlaceholders.filter((p: { placeholder: string }) =>
      p.placeholder.toLowerCase().includes(q)
    );
  }, [placeholderMenu.query, availablePlaceholders]);

  return {
    placeholderMenu,
    setPlaceholderMenu,
    filteredPlaceholders,
    availablePlaceholders,
  };
}


