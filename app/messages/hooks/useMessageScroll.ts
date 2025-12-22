import { useRef, useCallback, useEffect } from "react";

interface UseMessageScrollProps {
  messages: any[];
  shouldAutoScroll: boolean;
  onScrollChange?: (isNearBottom: boolean) => void;
}

export function useMessageScroll({
  messages,
  shouldAutoScroll,
  onScrollChange,
}: UseMessageScrollProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(shouldAutoScroll);
  const hasScrolledToBottomRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    shouldAutoScrollRef.current = shouldAutoScroll;
  }, [shouldAutoScroll]);

  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const threshold = 100;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((force = false, retryCount = 0) => {
    if (!force && !isNearBottomRef.current) {
      return;
    }

    if (isUserScrollingRef.current && retryCount < 3) {
      setTimeout(() => {
        scrollToBottom(force, retryCount + 1);
      }, 200);
      return;
    }

    if (isUserScrollingRef.current && retryCount >= 3 && !force) {
      return;
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        setTimeout(() => {
          isNearBottomRef.current = checkIfNearBottom();
          if (onScrollChange) {
            onScrollChange(isNearBottomRef.current);
          }
        }, 50);
      }
    }, 100);
  }, [checkIfNearBottom, onScrollChange]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isUserScrollingRef.current = true;
      isNearBottomRef.current = checkIfNearBottom();
      if (onScrollChange) {
        onScrollChange(isNearBottomRef.current);
      }

      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [checkIfNearBottom, onScrollChange]);

  useEffect(() => {
    if (shouldAutoScrollRef.current && messages.length > 0) {
      scrollToBottom(true);
      shouldAutoScrollRef.current = false;
    }
  }, [messages, scrollToBottom]);

  return {
    messagesContainerRef,
    messagesEndRef,
    loadMoreTriggerRef,
    scrollToBottom,
    isNearBottom: isNearBottomRef.current,
  };
}

