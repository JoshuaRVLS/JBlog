import { useState, useMemo } from "react";

export function usePlaceholderAutocomplete(customScript?: string) {
  const [placeholderMenu, setPlaceholderMenu] = useState<{
    blockId: string | null;
    query: string;
    position: { top: number; left: number } | null;
  }>({ blockId: null, query: "", position: null });

  // Parse customScript to extract placeholder names
  const availablePlaceholders = useMemo(() => {
    if (!customScript) return [];

    try {
      const config = JSON.parse(customScript);
      if (config.mappings && Array.isArray(config.mappings)) {
        return config.mappings.map((m: { placeholder: string; apiField: string }) => ({
          placeholder: m.placeholder,
          apiField: m.apiField,
        }));
      }
    } catch {
      // If not JSON, it's old format - ignore
    }

    return [];
  }, [customScript]);

  const filteredPlaceholders = useMemo(() => {
    if (!placeholderMenu.query) return availablePlaceholders;
    const q = placeholderMenu.query.toLowerCase();
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

