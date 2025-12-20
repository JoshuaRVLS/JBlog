import Image from "next/image";
import { Search, User } from "lucide-react";
import type { Conversation } from "../types";

interface ConversationListProps {
  conversations: Conversation[];
  selectedUserId: string | null;
  searchQuery: string;
  loading: boolean;
  onSelectConversation: (userId: string) => void;
  onSearchChange: (query: string) => void;
}

export default function ConversationList({
  conversations,
  selectedUserId,
  searchQuery,
  loading,
  onSelectConversation,
  onSearchChange,
}: ConversationListProps) {
  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border flex flex-col ${
        selectedUserId ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-lenis-prevent>
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Start a conversation with someone!</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.user.id}
                onClick={() => onSelectConversation(conversation.user.id)}
                className={`w-full p-3 rounded-lg mb-2 transition-colors ${
                  selectedUserId === conversation.user.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {conversation.user.profilePicture ? (
                      <Image
                        src={conversation.user.profilePicture}
                        alt={conversation.user.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">
                        {conversation.user.name}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm truncate opacity-80">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

