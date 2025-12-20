import Image from "next/image";
import { ArrowLeft, User, Lock, Key } from "lucide-react";
import type { Conversation } from "../types";

interface ChatHeaderProps {
  conversation: Conversation | undefined;
  selectedUserId: string | null;
  enableEncryption: boolean;
  hasEncryptionKeys: boolean;
  onBack: () => void;
  onEnableEncryption: () => void;
  onRegenerateKeys: () => void;
}

export default function ChatHeader({
  conversation,
  selectedUserId,
  enableEncryption,
  hasEncryptionKeys,
  onBack,
  onEnableEncryption,
  onRegenerateKeys,
}: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden p-2 hover:bg-accent rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative w-10 h-10 rounded-full overflow-hidden">
          {conversation?.user.profilePicture ? (
            <Image
              src={conversation.user.profilePicture}
              alt={conversation.user.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold">{conversation?.user.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {enableEncryption && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs">
            <Lock className="h-3.5 w-3.5" />
            <span>E2EE</span>
          </div>
        )}
        {!hasEncryptionKeys && (
          <button
            onClick={onEnableEncryption}
            className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition-colors"
            title="Aktifkan enkripsi end-to-end"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Aktifkan E2EE</span>
          </button>
        )}
        {hasEncryptionKeys && (
          <button
            type="button"
            onClick={onRegenerateKeys}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            title="Generate ulang key E2EE"
          >
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

