export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banner?: string | null;
  isPublic: boolean;
  encryptionEnabled?: boolean;
  createdBy: string;
  creator: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string;
      profilePicture: string | null;
    };
  }>;
  _count: {
    members: number;
    messages: number;
  };
  isMember?: boolean; // For explore groups
}

export interface Message {
  id: string;
  content: string;
  encryptedContent?: string | null;
  encryptionKeyId?: string | null;
  type: string;
  mediaUrl?: string | null;
  encryptedMediaUrl?: string | null;
  mediaThumbnail?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
}

export interface SelectedMedia {
  type: "image" | "video" | "audio";
  file: File;
  preview?: string;
}

export interface HoveredMention {
  username: string;
  userId: string;
  x: number;
  y: number;
}

export interface TypingUser {
  name: string;
  timeout: NodeJS.Timeout;
}

