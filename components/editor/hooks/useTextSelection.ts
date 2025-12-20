import { useState } from "react";

export function useTextSelection() {
  const [selection, setSelection] = useState<{
    blockId: string | null;
    start: number;
    end: number;
  }>({ blockId: null, start: 0, end: 0 });

  return {
    selection,
    setSelection,
  };
}

