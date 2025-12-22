interface PlaceholderAutocompleteMenuProps {
  placeholders: Array<{
    placeholder: string;
    apiField: string;
  }>;
  onSelect: (placeholder: string) => void;
  position: { top: number; left: number } | null;
}

export default function PlaceholderAutocompleteMenu({
  placeholders,
  onSelect,
  position,
}: PlaceholderAutocompleteMenuProps) {
  console.log('[PlaceholderAutocompleteMenu] Render:', {
    placeholdersCount: placeholders.length,
    position,
    placeholders,
  });
  
  if (!position || placeholders.length === 0) {
    console.log('[PlaceholderAutocompleteMenu] Not rendering:', {
      hasPosition: !!position,
      placeholdersCount: placeholders.length,
    });
    return null;
  }

  return (
    <div
      className="fixed z-[9999] w-64 rounded-lg border-2 border-primary bg-card p-2 text-xs shadow-2xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: 'hsl(var(--card))',
        position: 'fixed',
      }}
    >
      <div className="mb-2 px-2 py-1.5 text-[10px] font-semibold text-primary border-b border-border/50">
        Placeholder tersedia:
      </div>
      {placeholders.map((p) => (
        <button
          key={p.placeholder}
          type="button"
          onClick={() => {
            console.log('[PlaceholderAutocompleteMenu] Selected:', p.placeholder);
            onSelect(p.placeholder);
          }}
          className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all cursor-pointer mb-1"
        >
          <span className="font-semibold text-foreground text-sm">
            {"{"}
            <span className="text-primary">{p.placeholder}</span>
            {"}"}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            Field: <code className="bg-muted px-1 rounded text-[9px]">{p.apiField}</code>
          </span>
        </button>
      ))}
    </div>
  );
}


