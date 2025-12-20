interface SlashMenuProps {
  commands: Array<{
    type: string;
    label: string;
    description: string;
  }>;
  onSelect: (type: string) => void;
}

export default function SlashMenu({ commands, onSelect }: SlashMenuProps) {
  if (commands.length === 0) {
    return (
      <div className="mt-2 w-full max-w-xs rounded-lg border border-border bg-popover p-2 text-xs shadow-lg">
        <div className="px-2 py-1 text-muted-foreground">Tidak ada hasil</div>
      </div>
    );
  }

  return (
    <div className="mt-2 w-full max-w-xs rounded-lg border border-border bg-popover p-2 text-xs shadow-lg">
      {commands.map((cmd) => (
        <button
          key={cmd.type}
          type="button"
          onClick={() => onSelect(cmd.type)}
          className="flex w-full flex-col items-start rounded-md px-2 py-1 text-left hover:bg-accent"
        >
          <span className="font-medium text-foreground">{cmd.label}</span>
          <span className="text-[10px] text-muted-foreground">
            {cmd.description}
          </span>
        </button>
      ))}
    </div>
  );
}

