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
      className="fixed z-[200] w-full max-w-xs rounded-lg border-2 border-primary/30 bg-popover p-2 text-xs shadow-2xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: 'hsl(var(--popover))',
      }}
    >
      <div className="mb-1 px-2 py-1 text-[10px] font-medium text-muted-foreground">
        Placeholder tersedia:
      </div>
      {placeholders.map((p) => (
        <button
          key={p.placeholder}
          type="button"
          onClick={() => onSelect(p.placeholder)}
          className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left hover:bg-accent transition-colors"
        >
          <span className="font-medium text-foreground">
            {"{"}
            {p.placeholder}
            {"}"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Field: {p.apiField}
          </span>
        </button>
      ))}
    </div>
  );
}


