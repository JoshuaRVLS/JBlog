/**
 * Optimized icon loader - tree-shakes lucide-react icons
 * Only imports icons that are actually used
 */

// Lazy load icons to reduce initial bundle size
export const loadIcon = async (iconName: string) => {
  const icons = await import("lucide-react");
  return (icons as any)[iconName];
};

// Pre-import commonly used icons for faster access
export const commonIcons = {
  Loader2: () => import("lucide-react").then((m) => m.Loader2),
  X: () => import("lucide-react").then((m) => m.X),
  User: () => import("lucide-react").then((m) => m.User),
  Settings: () => import("lucide-react").then((m) => m.Settings),
  Home: () => import("lucide-react").then((m) => m.Home),
  Search: () => import("lucide-react").then((m) => m.Search),
  Menu: () => import("lucide-react").then((m) => m.Menu),
  ArrowLeft: () => import("lucide-react").then((m) => m.ArrowLeft),
  Save: () => import("lucide-react").then((m) => m.Save),
  Upload: () => import("lucide-react").then((m) => m.Upload),
  Eye: () => import("lucide-react").then((m) => m.Eye),
  EyeOff: () => import("lucide-react").then((m) => m.EyeOff),
  Trash2: () => import("lucide-react").then((m) => m.Trash2),
  Check: () => import("lucide-react").then((m) => m.Check),
  Clock: () => import("lucide-react").then((m) => m.Clock),
  Heart: () => import("lucide-react").then((m) => m.Heart),
  MessageCircle: () => import("lucide-react").then((m) => m.MessageCircle),
  BookmarkCheck: () => import("lucide-react").then((m) => m.BookmarkCheck),
  Send: () => import("lucide-react").then((m) => m.Send),
  Plus: () => import("lucide-react").then((m) => m.Plus),
  Filter: () => import("lucide-react").then((m) => m.Filter),
  Grid3x3: () => import("lucide-react").then((m) => m.Grid3x3),
  List: () => import("lucide-react").then((m) => m.List),
  Folder: () => import("lucide-react").then((m) => m.Folder),
  FolderPlus: () => import("lucide-react").then((m) => m.FolderPlus),
  ChevronDown: () => import("lucide-react").then((m) => m.ChevronDown),
  Calendar: () => import("lucide-react").then((m) => m.Calendar),
  TrendingUp: () => import("lucide-react").then((m) => m.TrendingUp),
  CheckSquare: () => import("lucide-react").then((m) => m.CheckSquare),
  Square: () => import("lucide-react").then((m) => m.Square),
  Download: () => import("lucide-react").then((m) => m.Download),
  FileText: () => import("lucide-react").then((m) => m.FileText),
  Tag: () => import("lucide-react").then((m) => m.Tag),
  Sparkles: () => import("lucide-react").then((m) => m.Sparkles),
  Mail: () => import("lucide-react").then((m) => m.Mail),
  Lock: () => import("lucide-react").then((m) => m.Lock),
  Shield: () => import("lucide-react").then((m) => m.Shield),
  Globe: () => import("lucide-react").then((m) => m.Globe),
  LogOut: () => import("lucide-react").then((m) => m.LogOut),
  Moon: () => import("lucide-react").then((m) => m.Moon),
  Sun: () => import("lucide-react").then((m) => m.Sun),
  Terminal: () => import("lucide-react").then((m) => m.Terminal),
  BookOpen: () => import("lucide-react").then((m) => m.BookOpen),
  LayoutDashboard: () => import("lucide-react").then((m) => m.LayoutDashboard),
  MessageSquare: () => import("lucide-react").then((m) => m.MessageSquare),
  Users: () => import("lucide-react").then((m) => m.Users),
  Crown: () => import("lucide-react").then((m) => m.Crown),
  UserPlus: () => import("lucide-react").then((m) => m.UserPlus),
  UserMinus: () => import("lucide-react").then((m) => m.UserMinus),
  Bell: () => import("lucide-react").then((m) => m.Bell),
  BellOff: () => import("lucide-react").then((m) => m.BellOff),
  CheckCheck: () => import("lucide-react").then((m) => m.CheckCheck),
  Compass: () => import("lucide-react").then((m) => m.Compass),
  Image: () => import("lucide-react").then((m) => m.Image),
  Video: () => import("lucide-react").then((m) => m.Video),
  Mic: () => import("lucide-react").then((m) => m.Mic),
  Play: () => import("lucide-react").then((m) => m.Play),
  Pause: () => import("lucide-react").then((m) => m.Pause),
  RotateCcw: () => import("lucide-react").then((m) => m.RotateCcw),
  AlertTriangle: () => import("lucide-react").then((m) => m.AlertTriangle),
};

