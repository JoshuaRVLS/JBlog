export interface Conversation {
  user: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  content: string;
  encryptedContent?: string | null;
  encryptionKeyId?: string | null;
  senderId: string;
  receiverId: string;
  type: string;
  mediaUrl: string | null;
  encryptedMediaUrl?: string | null;
  read: boolean;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  isDecrypted?: boolean;
  sender: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  receiver: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
}

