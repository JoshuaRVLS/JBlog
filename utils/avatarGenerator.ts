/**
 * Generate avatar URL dari initial username menggunakan ui-avatars.com
 */
export const generateAvatarUrl = (name: string, size: number = 200): string => {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    "6366f1", // indigo
    "8b5cf6", // purple
    "ec4899", // pink
    "f59e0b", // amber
    "10b981", // emerald
    "3b82f6", // blue
    "ef4444", // red
    "14b8a6", // teal
  ];
  
  // Generate color berdasarkan initial (consistent untuk user yang sama)
  const colorIndex = initial.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${backgroundColor}&color=fff&size=${size}&bold=true&font-size=0.5`;
};

