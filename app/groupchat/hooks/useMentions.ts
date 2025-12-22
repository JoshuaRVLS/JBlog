import { useState, useMemo, useRef } from "react";
import { GroupChat } from "../types";

interface UseMentionsProps {
  selectedGroup: GroupChat | null;
  userId: string | null;
  messageInput: string;
  messageInputRef: React.RefObject<HTMLInputElement | null>;
}

export function useMentions({
  selectedGroup,
  userId,
  messageInput,
  messageInputRef,
}: UseMentionsProps) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [showEveryoneWarning, setShowEveryoneWarning] = useState(false);

  const getMentionSuggestions = useMemo(() => {
    if (!selectedGroup || !selectedGroup.members) return [];

    const showEveryone = !mentionQuery || mentionQuery.toLowerCase().includes("everyone") || mentionQuery.toLowerCase().includes("semua");
    const everyoneOption = showEveryone ? [{ id: "everyone", name: "everyone", profilePicture: null, isEveryone: true }] : [];

    if (!mentionQuery) {
      const topMembers = selectedGroup.members
        .filter((member) => member.userId !== userId)
        .map((member) => member.user)
        .filter((user) => user)
        .slice(0, 4);
      return [...everyoneOption, ...topMembers];
    }

    const query = mentionQuery.toLowerCase();
    const filteredMembers = selectedGroup.members
      .filter((member) => {
        const name = member.user?.name?.toLowerCase() || "";
        return name.includes(query) && member.userId !== userId;
      })
      .map((member) => member.user)
      .filter((user) => user)
      .slice(0, showEveryone ? 4 : 5);

    return [...everyoneOption, ...filteredMembers];
  }, [selectedGroup, mentionQuery, userId]);

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setShowMentionSuggestions(true);
        setMentionPosition(lastAtIndex);
        setSelectedMentionIndex(0);
        return;
      }
    }

    setShowMentionSuggestions(false);
    setMentionQuery("");
  };

  const insertMention = (username: string, isEveryone: boolean = false) => {
    if (isEveryone && username === "everyone") {
      setShowEveryoneWarning(true);
      return;
    }

    if (!messageInputRef.current) return;

    const cursorPosition = messageInputRef.current.selectionStart || 0;
    const textBeforeCursor = messageInput.substring(0, mentionPosition);
    const textAfterCursor = messageInput.substring(cursorPosition);

    const newText = `${textBeforeCursor}@${username} ${textAfterCursor}`;
    setShowMentionSuggestions(false);
    setMentionQuery("");
    setSelectedMentionIndex(0);

    setTimeout(() => {
      if (messageInputRef.current) {
        const newPosition = mentionPosition + username.length + 2;
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);

    return newText;
  };

  const confirmEveryoneMention = () => {
    if (!messageInputRef.current) return "";

    const cursorPosition = messageInputRef.current.selectionStart || 0;
    const textBeforeCursor = messageInput.substring(0, mentionPosition);
    const textAfterCursor = messageInput.substring(cursorPosition);

    const newText = `${textBeforeCursor}@everyone ${textAfterCursor}`;
    setShowMentionSuggestions(false);
    setShowEveryoneWarning(false);
    setMentionQuery("");
    setSelectedMentionIndex(0);

    setTimeout(() => {
      if (messageInputRef.current) {
        const newPosition = mentionPosition + "everyone".length + 2;
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);

    return newText;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, onEnter?: () => void) => {
    if (!showMentionSuggestions || getMentionSuggestions.length === 0) {
      if (e.key === "Enter" && !e.shiftKey && onEnter) {
        e.preventDefault();
        onEnter();
      }
      return false;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < getMentionSuggestions.length - 1 ? prev + 1 : prev
        );
        return true;
      case "ArrowUp":
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return true;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (getMentionSuggestions[selectedMentionIndex]) {
          const selected = getMentionSuggestions[selectedMentionIndex];
          return insertMention(selected.name, (selected as any).isEveryone || false);
        }
        return false;
      case "Escape":
        e.preventDefault();
        setShowMentionSuggestions(false);
        setMentionQuery("");
        return true;
    }
    return false;
  };

  return {
    mentionQuery,
    showMentionSuggestions,
    mentionPosition,
    selectedMentionIndex,
    showEveryoneWarning,
    getMentionSuggestions,
    handleMessageInputChange,
    insertMention,
    confirmEveryoneMention,
    handleKeyDown,
    setShowMentionSuggestions,
    setMentionQuery,
    setSelectedMentionIndex,
    setShowEveryoneWarning,
  };
}

