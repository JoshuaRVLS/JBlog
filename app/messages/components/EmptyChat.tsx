import { MessageSquare } from "lucide-react";

export default function EmptyChat() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>Select a conversation to start messaging</p>
      </div>
    </div>
  );
}

