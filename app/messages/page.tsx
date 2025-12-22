"use client";

import { useState, useEffect, useContext, useRef, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Send, User, Search, ArrowLeft, MessageSquare, Image as ImageIcon, Video, Mic, X, Loader2, Play, Pause, Lock, Key, Plus, Check, CheckCheck } from "lucide-react";
import MessageSkeleton, { ConversationSkeleton, ChatLoadingSpinner } from "@/components/MessageSkeleton";
import toast from "react-hot-toast";
import { useSocket } from "@/providers/SocketProvider";
import ImageViewer from "@/components/ImageViewer";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { useEncryption } from "@/hooks/useEncryption";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

interface Conversation {
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

interface Message {
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
  isDecrypted?: boolean; // Track if message has been decrypted
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

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, userId, loading: authLoading } = useContext(AuthContext);
  const { socket } = useSocket();
  const encryption = useEncryption(userId || undefined);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [receiverPublicKey, setReceiverPublicKey] = useState<string | null>(null);
  const [enableEncryption, setEnableEncryption] = useState(false);
  const [showKeyPairModal, setShowKeyPairModal] = useState(false);
  const [generatingKeyPair, setGeneratingKeyPair] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name: string; profilePicture: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null); // Ref untuk trigger load older messages
  const isUserScrollingRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(false); // Flag untuk force scroll (setelah send message) - default false
  const hasScrolledToBottomRef = useRef(false); // Track apakah sudah scroll ke bottom saat chat dibuka
  const lastConversationsFetchRef = useRef<number>(0);
  const messagesCacheRef = useRef<Map<string, Message[]>>(new Map());
  const queryClient = useQueryClient();
  const prefetchTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const publicKeyCacheRef = useRef<Map<string, string>>(new Map()); // Cache public keys for performance
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMarkAsReadRef = useRef<Map<string, number>>(new Map()); // Track last mark as read time per user
  
  // Media upload states
  const [selectedMedia, setSelectedMedia] = useState<{
    file: File;
    preview: string;
    type: "image" | "video" | "audio";
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio playback states
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  // Image viewer state
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
    if (!authenticated) {
      router.push("/login");
      return;
    }
    
    // Fetch current user profile
    const fetchCurrentUserProfile = async () => {
      try {
        const response = await AxiosInstance.get("/profile");
        if (response.data) {
          setCurrentUserProfile({
            name: response.data.name || "You",
            profilePicture: response.data.profilePicture || null,
          });
        }
      } catch (error) {
        console.error("Error fetching current user profile:", error);
      }
    };
    
    fetchCurrentUserProfile();
    
    // Check for userId query parameter first
    const userIdParam = searchParams.get("userId");
    if (userIdParam) {
      setSelectedUserId(userIdParam);
      // Prefetch messages if userId is in query params
      const cached = messagesCacheRef.current.get(userIdParam);
      if (cached) {
        setMessages(cached);
      }
    }
    
    // Conversations akan di-fetch otomatis oleh React Query
  }, [authenticated, searchParams]);

  useEffect(() => {
    if (selectedUserId) {
      loadReceiverPublicKey(selectedUserId);
      
      // Mark as read setelah conversation dibuka (dengan delay untuk memastikan messages loaded)
      const markReadTimeout = setTimeout(() => {
        markAsRead(selectedUserId);
      }, 1500); // Increase delay untuk avoid blocking
      
      return () => {
        clearTimeout(markReadTimeout);
      };
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (encryption && !encryption.hasKeys && authenticated && !encryption.isLoading) {
      setShowKeyPairModal(true);
    }
  }, [encryption, authenticated]);

  const handleGenerateKeyPair = async () => {
    if (!encryption) return;
    try {
      setGeneratingKeyPair(true);
      await encryption.generateKeyPair();
      setShowKeyPairModal(false);
    } catch (error) {
      console.error("Error generating key pair:", error);
    } finally {
      setGeneratingKeyPair(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        const stream = mediaRecorderRef.current.stream;
        stream?.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl, isRecording]);

  // Throttled refresh for conversations list
  const refreshConversationsThrottled = useCallback(() => {
    const now = Date.now();
    if (now - lastConversationsFetchRef.current < 1000) {
      return;
    }
    lastConversationsFetchRef.current = now;
    queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
  }, [queryClient, userId]);

  const loadReceiverPublicKey = async (userId: string) => {
    if (!encryption || !encryption.hasKeys) {
      setReceiverPublicKey(null);
      setEnableEncryption(false);
      return;
    }

    try {
      const publicKey = await encryption.getUserPublicKey(userId);
      setReceiverPublicKey(publicKey);
      setEnableEncryption(!!publicKey);
    } catch (error) {
      console.error("Error loading receiver public key:", error);
      setReceiverPublicKey(null);
      setEnableEncryption(false);
    }
  };

  // Fetch conversations dengan React Query (cached)
  const { data: conversationsData, isLoading: loadingConversations, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      const response = await AxiosInstance.get("/direct-messages");
      return response.data.conversations || [];
    },
    enabled: !!userId && authenticated && !authLoading,
    staleTime: 30 * 1000, // 30 detik cache
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000, // Auto refetch setiap 1 menit
  });

  // Sort conversations by last message time (newest first - like WhatsApp)
  const conversations = useMemo(() => {
    if (!conversationsData) return [];
    return [...conversationsData].sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1; // No message = bottom
      if (!b.lastMessage) return -1; // No message = bottom
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });
  }, [conversationsData]);

  // Fetch messages dengan infinite query untuk pagination
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingMessagesQuery,
  } = useInfiniteQuery({
    queryKey: ["messages", selectedUserId, userId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await AxiosInstance.get(`/direct-messages/${selectedUserId}`, {
        params: {
          page: pageParam,
          limit: 30, // Reduce initial load
        },
      });
      return {
        messages: response.data.messages || [],
        pagination: response.data.pagination,
      };
    },
    enabled: !!selectedUserId && !!userId && authenticated,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination && lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1 menit cache
    refetchOnWindowFocus: false,
  });

  // Process messages dengan decryption (optimized - batch decrypt untuk avoid freeze)
  // Use useMemo untuk avoid re-creating array setiap render
  // Messages dari API sudah diurutkan dari terbaru ke terlama, kita perlu reverse untuk display
  const processedMessages = useMemo(() => {
    if (!messagesData?.pages) return [];
    // Flatten semua pages dan reverse untuk mendapatkan urutan terlama ke terbaru
    const allMessages = messagesData.pages.flatMap((page) => page.messages);
    // Reverse untuk mendapatkan urutan terlama ke terbaru (untuk display)
    return allMessages.reverse();
  }, [messagesData]);
  
  // Decrypt messages jika perlu
  const [messages, setMessages] = useState<Message[]>([]);
  const [decrypting, setDecrypting] = useState(false);
  const loadingMessages = loadingMessagesQuery;
  const decryptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousProcessedMessagesRef = useRef<Message[]>([]);
  
  useEffect(() => {
    // Clear previous timeout
    if (decryptTimeoutRef.current) {
      clearTimeout(decryptTimeoutRef.current);
    }

    // Check if processedMessages actually changed (by comparing IDs)
    const currentIds = processedMessages.map(m => m.id).join(',');
    const previousIds = previousProcessedMessagesRef.current.map(m => m.id).join(',');
    
    // Skip update jika messages tidak berubah
    if (currentIds === previousIds && processedMessages.length === previousProcessedMessagesRef.current.length) {
      return;
    }
    
    // Update ref
    previousProcessedMessagesRef.current = processedMessages;

    if (!encryption || !encryption.hasKeys || !selectedUserId) {
      // Update messages dan cache hanya jika berbeda
      setMessages((prev) => {
        const prevIds = prev.map(m => m.id).join(',');
        if (prevIds === currentIds && prev.length === processedMessages.length) {
          return prev; // No change, return previous
        }
        return processedMessages;
      });
      if (selectedUserId) {
        messagesCacheRef.current.set(selectedUserId, processedMessages);
      }
      return;
    }

    // Debounce decryption untuk avoid freeze
    decryptTimeoutRef.current = setTimeout(async () => {
      setDecrypting(true);
      
      // Batch decrypt (max 10 messages at a time untuk avoid blocking)
      const BATCH_SIZE = 10;
      const decrypted: Message[] = [];
      
      for (let i = 0; i < processedMessages.length; i += BATCH_SIZE) {
        const batch = processedMessages.slice(i, i + BATCH_SIZE);
        const batchDecrypted = await Promise.all(
          batch.map(async (msg: Message) => {
            // Skip jika sudah di-decrypt sebelumnya atau tidak ada encryptedContent
            if (msg.isDecrypted || !msg.encryptedContent) {
              return msg;
            }
            
            // Hanya decrypt jika message dari user lain (bukan dari kita sendiri)
            if (msg.senderId !== userId) {
              try {
                const senderPublicKey = await encryption.getUserPublicKey(msg.senderId);
                if (senderPublicKey) {
                  // Validate encryptedContent format
                  let encrypted;
                  try {
                    encrypted = typeof msg.encryptedContent === 'string' 
                      ? JSON.parse(msg.encryptedContent) 
                      : msg.encryptedContent;
                  } catch (parseError) {
                    // Invalid JSON, skip decryption
                    return msg;
                  }
                  
                  const decryptedContent = await encryption.decryptFromUser(
                    encrypted,
                    senderPublicKey
                  );
                  if (decryptedContent) {
                    return { ...msg, content: decryptedContent, isDecrypted: true };
                  }
                }
              } catch (error) {
                // Silent fail - mungkin message tidak encrypted atau key tidak valid
                // Return original message tanpa decrypt (tidak log error berulang)
                return msg;
              }
            }
            return msg;
          })
        );
        decrypted.push(...batchDecrypted);
        
        // Yield to browser untuk avoid blocking
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Final update dengan semua decrypted messages
      // GUARANTEE: Semua messages tetap ada, hanya content yang di-update
      setMessages((currentMessages) => {
        // Merge decrypted messages dengan current messages
        // Pastikan tidak ada message yang hilang
        const messageMap = new Map<string, Message>();
        
        // Add all current messages first (untuk memastikan optimistic messages tidak hilang)
        currentMessages.forEach((msg) => {
          messageMap.set(msg.id, msg);
        });
        
        // Update dengan decrypted messages
        decrypted.forEach((decryptedMsg) => {
          messageMap.set(decryptedMsg.id, decryptedMsg);
        });
        
        // Convert back to array dan sort
        const finalMessages = Array.from(messageMap.values()).sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      
        // Check if finalMessages actually changed (by comparing IDs and content)
        const finalIds = finalMessages.map(m => m.id).join(',');
        const currentIds = currentMessages.map(m => m.id).join(',');
        const finalContents = finalMessages.map(m => `${m.id}:${m.content}`).join('|');
        const currentContents = currentMessages.map(m => `${m.id}:${m.content}`).join('|');
        
        // Skip update jika tidak ada perubahan
        if (finalIds === currentIds && 
            finalMessages.length === currentMessages.length &&
            finalContents === currentContents) {
          return currentMessages; // No change, return previous
        }
        
        // Update cache
        if (selectedUserId) {
          messagesCacheRef.current.set(selectedUserId, finalMessages);
        }
        
        return finalMessages;
      });
      
      setDecrypting(false);
    }, 100); // Debounce 100ms

    return () => {
      if (decryptTimeoutRef.current) {
        clearTimeout(decryptTimeoutRef.current);
      }
    };
  }, [processedMessages, encryption, selectedUserId, userId]);

  // Scroll to bottom when messages change (hanya jika user di bottom atau force scroll)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if user is near bottom of scroll container
  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;
    
    const threshold = 100; // 100px dari bottom
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);
  
  const scrollToBottom = useCallback((force = false, retryCount = 0) => {
    // Jika force = true (setelah send message), SELALU scroll
    // Jika force = false (pesan masuk), scroll hanya jika user sudah di bottom
    if (!force && !isNearBottomRef.current) {
      return; // User sedang scroll ke atas, jangan scroll untuk pesan masuk
    }
    
    // Jika user sedang scroll, tunggu sampai selesai (max 3 retry untuk avoid infinite loop)
    if (isUserScrollingRef.current && retryCount < 3) {
      // Delay sedikit untuk tunggu user selesai scroll
      setTimeout(() => {
        scrollToBottom(force, retryCount + 1);
      }, 200);
      return;
    }
    
    // Jika sudah retry 3x dan masih user scrolling, skip scroll (kecuali force)
    if (isUserScrollingRef.current && retryCount >= 3 && !force) {
      return;
      }
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        // Scroll container ke bottom, bukan scrollIntoView yang bisa scroll whole page
        container.scrollTop = container.scrollHeight;
        // Update ref setelah scroll
        setTimeout(() => {
          isNearBottomRef.current = checkIfNearBottom();
        }, 50);
      }
    }, 100);
  }, [checkIfNearBottom]);
  
  // Handle scroll event untuk detect user scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      isUserScrollingRef.current = true;
      isNearBottomRef.current = checkIfNearBottom();
      
      // Reset flag setelah user selesai scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };
    
    container.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [checkIfNearBottom]);
  
  // Auto scroll ke bottom saat chat pertama kali dibuka
  useEffect(() => {
    if (selectedUserId && messages.length > 0 && !decrypting && !hasScrolledToBottomRef.current) {
      // Scroll ke bottom saat chat pertama kali dibuka
      setTimeout(() => {
        scrollToBottom(true);
        hasScrolledToBottomRef.current = true;
        isNearBottomRef.current = true;
      }, 300); // Delay sedikit untuk memastikan messages sudah rendered
    }
    
    // Reset flag saat selectedUserId berubah
    if (selectedUserId) {
      hasScrolledToBottomRef.current = false;
    }
  }, [selectedUserId, messages.length, decrypting, scrollToBottom]);

  // Auto scroll saat:
  // 1. Force scroll flag aktif (setelah send message) - SELALU scroll
  // 2. Pesan baru masuk DAN user sudah di bottom - scroll jika di bottom
  useEffect(() => {
    if (messages.length > 0 && !decrypting && hasScrolledToBottomRef.current) {
      // Update isNearBottomRef sebelum check
      isNearBottomRef.current = checkIfNearBottom();
      
      // Case 1: Force scroll (setelah send message) - SELALU scroll
      if (shouldAutoScrollRef.current && !isUserScrollingRef.current) {
        scrollToBottom(true);
        shouldAutoScrollRef.current = false;
      }
      // Case 2: Pesan baru masuk - scroll hanya jika user sudah di bottom
      else if (!shouldAutoScrollRef.current && isNearBottomRef.current && !isUserScrollingRef.current) {
        // Scroll untuk pesan baru yang masuk (hanya jika user di bottom)
        scrollToBottom(false); // Tidak force, tapi scroll jika di bottom
      }
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length, decrypting, scrollToBottom, checkIfNearBottom]);
  
  // Infinite scroll - load older messages saat scroll ke atas
  useEffect(() => {
    const container = messagesContainerRef.current;
    const loadMoreTrigger = loadMoreTriggerRef.current;
    
    if (!container || !loadMoreTrigger || !hasNextPage || isFetchingNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          // User scroll ke atas, load older messages
          const previousScrollHeight = container.scrollHeight;
          fetchNextPage().then(() => {
            // Maintain scroll position setelah load older messages
            setTimeout(() => {
              const newScrollHeight = container.scrollHeight;
              const scrollDiff = newScrollHeight - previousScrollHeight;
              container.scrollTop += scrollDiff;
            }, 50);
          });
        }
      },
      {
        root: container,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );
    
    observer.observe(loadMoreTrigger);
    
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Prefetch messages on hover (using React Query)
  const handleConversationHover = (userId: string) => {
    // Clear existing timeout for this user
    const existingTimeout = prefetchTimeoutRef.current.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Prefetch after 300ms hover
    const timeout = setTimeout(() => {
      // Prefetch dengan React Query
      if (selectedUserId !== userId) {
        queryClient.prefetchQuery({
          queryKey: ["messages", userId, userId],
          queryFn: async () => {
            const response = await AxiosInstance.get(`/direct-messages/${userId}`, {
              params: { page: 1, limit: 30 },
            });
            return {
              messages: response.data.messages || [],
              pagination: response.data.pagination,
            };
          },
        });
      }
      prefetchTimeoutRef.current.delete(userId);
    }, 300);
    
    prefetchTimeoutRef.current.set(userId, timeout);
  };
  
  const handleConversationLeave = (userId: string) => {
    const timeout = prefetchTimeoutRef.current.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      prefetchTimeoutRef.current.delete(userId);
    }
  };

  const markAsRead = async (otherUserId: string) => {
    if (!otherUserId || !userId) return;
    
    // Debounce: jangan mark as read terlalu sering (min 1 detik)
    const now = Date.now();
    const lastMark = lastMarkAsReadRef.current.get(otherUserId) || 0;
    if (now - lastMark < 1000) {
      return;
    }
    lastMarkAsReadRef.current.set(otherUserId, now);
    
    // Clear existing timeout
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
    }
    
    // Debounce dengan timeout 500ms untuk batch multiple calls
    markAsReadTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await AxiosInstance.put(`/direct-messages/${otherUserId}/read`);
        console.log(`[Read Receipt] Marked messages as read from ${otherUserId}`);
      refreshConversationsThrottled();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
    }, 500);
  };

  // Listen for direct messages via global socket (single connection)
  useEffect(() => {
    // Wait for socket and userId to be ready
    if (!socket || !userId || !authenticated) {
      return;
    }
    
    // Wait for socket to be connected
    if (socket.disconnected) {
      // Socket will connect automatically, just wait
      return;
    }

    const handleNewDirectMessage = async (message: Message) => {
      console.log("📨 Received newDirectMessage event", message);
      
      // IMMEDIATELY update conversation list (WhatsApp-like behavior)
      // Move conversation to top and update lastMessage
      queryClient.setQueryData<Conversation[]>(["conversations", userId], (old = []) => {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        const existingIndex = old.findIndex((conv) => conv.user.id === otherUserId);
        
        // Create or update conversation
        const updatedConversation: Conversation = existingIndex >= 0
          ? {
              ...old[existingIndex],
              lastMessage: {
                id: message.id,
                content: message.content || (message.encryptedContent ? "[Encrypted]" : ""),
                senderId: message.senderId,
                receiverId: message.receiverId,
                createdAt: message.createdAt,
              },
              unreadCount: message.senderId !== userId && message.senderId !== selectedUserId
                ? (old[existingIndex].unreadCount || 0) + 1
                : old[existingIndex].unreadCount,
            }
          : {
              user: message.senderId === userId ? message.receiver : message.sender,
              lastMessage: {
                id: message.id,
                content: message.content || (message.encryptedContent ? "[Encrypted]" : ""),
                senderId: message.senderId,
                receiverId: message.receiverId,
                createdAt: message.createdAt,
              },
              unreadCount: message.senderId !== userId ? 1 : 0,
            };
        
        // Remove existing conversation if it exists
        const filtered = existingIndex >= 0 
          ? old.filter((_, idx) => idx !== existingIndex)
          : old;
        
        // Add updated conversation to top (like WhatsApp)
        return [updatedConversation, ...filtered];
      });
      
      // If there's an active conversation, only update when message belongs to it
      if (
        selectedUserId &&
        ( (message.senderId === selectedUserId && message.receiverId === userId) ||
          (message.senderId === userId && message.receiverId === selectedUserId) )
      ) {
        // Untuk pesan yang kita kirim sendiri:
        // - Jika masih ada temp message, replace dengan real message dari socket
        // - Jika sudah ada real message, ignore (duplicate)
        if (message.senderId === userId) {
          setMessages((prev) => {
            // Check if real message already exists
            const realMessageExists = prev.some((msg) => msg.id === message.id);
            if (realMessageExists) {
              return prev; // Already have real message, ignore
            }
            
            // Replace temp message with real message from socket
            const hasTempMessage = prev.some((msg) => 
              msg.id.startsWith("temp-") && 
              msg.senderId === userId && 
              msg.receiverId === selectedUserId
            );
            
            if (hasTempMessage) {
              const updated = prev.map((msg) => {
                // Replace first temp message with real message
                if (msg.id.startsWith("temp-") && msg.senderId === userId && msg.receiverId === selectedUserId) {
                  return message; // Replace temp with real
                }
                return msg;
              });
              // Update cache
              if (selectedUserId) {
                messagesCacheRef.current.set(selectedUserId, updated);
              }
              return updated;
            }
            
            // No temp message, just add real message (fallback)
            const updated = [...prev, message];
            // Update cache
            if (selectedUserId) {
              messagesCacheRef.current.set(selectedUserId, updated);
            }
            return updated;
          });
          
          // Scroll to bottom setelah message dari socket (own message)
          shouldAutoScrollRef.current = true; // Force scroll untuk own message
          // useEffect akan handle scroll otomatis
          
          return;
        }
        
        // OPTIMIZATION: Show message immediately (non-blocking), decrypt in background
        setMessages((prev) => {
          // Check jika message sudah ada (by ID atau by content + timestamp untuk deduplication)
          const exists = prev.some((msg) => 
            msg.id === message.id || 
            (msg.id.startsWith("temp-") && 
             msg.senderId === message.senderId && 
             msg.receiverId === message.receiverId &&
             msg.content === message.content &&
             Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000)
          );
          if (!exists) {
            const updated = [...prev, message];
            // Update cache
            if (selectedUserId) {
              messagesCacheRef.current.set(selectedUserId, updated);
            }
            return updated;
          }
          return prev;
        });
        
        // Auto-scroll untuk message dari user lain jika user sudah di bottom
        // Tidak perlu set shouldAutoScrollRef karena useEffect akan handle berdasarkan isNearBottomRef
        // useEffect akan otomatis scroll jika isNearBottomRef.current === true

        // Decrypt in background (non-blocking UI) - this prevents delay in showing messages
        if (
          encryption &&
          message.encryptedContent &&
          message.senderId !== userId &&
          encryption.hasKeys
        ) {
          // Use cached public key if available (avoids repeated API calls)
          let senderPublicKey: string | undefined = publicKeyCacheRef.current.get(message.senderId);
          
          if (!senderPublicKey && encryption.getUserPublicKey) {
            try {
              const fetchedKey = await encryption.getUserPublicKey(message.senderId);
              if (fetchedKey) {
                senderPublicKey = fetchedKey;
                publicKeyCacheRef.current.set(message.senderId, fetchedKey);
              }
            } catch (error) {
              console.error("Error fetching public key:", error);
            }
          }

          if (senderPublicKey) {
            try {
              const encrypted = JSON.parse(message.encryptedContent);
              const decrypted = await encryption.decryptFromUser(
                encrypted,
                senderPublicKey
              );
              if (decrypted) {
                // Update message with decrypted content (non-blocking)
                setMessages((prev) => {
                  const updated = prev.map((msg) =>
                    msg.id === message.id
                      ? { ...msg, content: decrypted }
                      : msg
                  );
                  // Update cache
                  if (selectedUserId) {
                    messagesCacheRef.current.set(selectedUserId, updated);
                  }
                  return updated;
                });
              }
            } catch (error) {
              console.error("Error decrypting incoming message:", error);
            }
          }
        }

        // Mark as read jika pesan baru dari user yang sedang kita chat
        if (message.senderId === selectedUserId && message.receiverId === userId) {
          // Delay sedikit untuk memastikan message sudah di-render
          setTimeout(() => {
          markAsRead(selectedUserId);
          }, 500);
        }
      }

      // Always refresh conversations in a throttled way for sidebar preview/unread
      refreshConversationsThrottled();
    };

    const handleMessageDelivered = (data: { messageId: string }) => {
      setMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.id === data.messageId && msg.senderId === userId) {
            return { ...msg, deliveredAt: new Date().toISOString() };
          }
          return msg;
        });
        // Update cache
        if (selectedUserId) {
          messagesCacheRef.current.set(selectedUserId, updated);
        }
        return updated;
      });
    };

    const handleMessagesRead = (data: { receiverId: string; readAt: string; messageIds?: string[] }) => {
      // Update messages jika receiver adalah user yang sedang kita chat
      if (data.receiverId === selectedUserId && userId) {
        setMessages((prev) => {
          const updated = prev.map((msg) => {
            // Jika ada messageIds, update hanya pesan yang ada di list
            if (data.messageIds && data.messageIds.length > 0) {
              if (data.messageIds.includes(msg.id)) {
                return { ...msg, read: true, readAt: data.readAt };
              }
              return msg;
            }
            
            // Fallback: update semua pesan yang kita kirim ke receiver ini yang belum read
            if (
              msg.senderId === userId && 
              msg.receiverId === data.receiverId && 
              (!msg.readAt || new Date(msg.readAt) < new Date(data.readAt))
            ) {
              return { ...msg, read: true, readAt: data.readAt };
            }
            return msg;
          });
          // Update cache
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        });
      }
      
      // Juga update conversations untuk unread count
      refreshConversationsThrottled();
    };

    // Handle conversation update (real-time list update - like WhatsApp)
    const handleConversationUpdated = (data: {
      userId: string;
      user?: {
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
      };
      unreadCount: number;
    }) => {
      if (!userId) return;

      // Update conversations list immediately (optimistic update)
      queryClient.setQueryData<Conversation[]>(["conversations", userId], (old = []) => {
        // Find if conversation already exists
        const existingIndex = old.findIndex((conv) => conv.user.id === data.userId);
        
        let updated: Conversation[];
        
        if (existingIndex >= 0) {
          // Update existing conversation and move to top (like WhatsApp)
          updated = [...old];
          const [conversation] = updated.splice(existingIndex, 1);
          updated.unshift({
            ...conversation,
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCount,
          });
        } else {
          // New conversation - fetch user info and add to top
          // We'll fetch user info async, but add placeholder immediately
          AxiosInstance.get(`/users/${data.userId}`)
            .then((response) => {
              const user = response.data.user;
              queryClient.setQueryData<Conversation[]>(["conversations", userId], (old = []) => {
                // Check if already added (avoid duplicates)
                if (old.some((conv) => conv.user.id === data.userId)) {
                  // Re-sort to ensure new message is at top
                  return old.sort((a, b) => {
                    if (!a.lastMessage || !b.lastMessage) return 0;
                    return (
                      new Date(b.lastMessage.createdAt).getTime() -
                      new Date(a.lastMessage.createdAt).getTime()
                    );
                  });
                }
                const newConv: Conversation = {
                  user: {
                    id: user.id,
                    name: user.name,
                    profilePicture: user.profilePicture,
                  },
                  lastMessage: data.lastMessage,
                  unreadCount: data.unreadCount,
                };
                // Add to top and sort by last message time (newest first - like WhatsApp)
                const sorted = [newConv, ...old].sort((a, b) => {
                  if (!a.lastMessage && !b.lastMessage) return 0;
                  if (!a.lastMessage) return 1;
                  if (!b.lastMessage) return -1;
                  return (
                    new Date(b.lastMessage.createdAt).getTime() -
                    new Date(a.lastMessage.createdAt).getTime()
                  );
                });
                return sorted;
              });
            })
            .catch((err) => {
              console.error("Error fetching user info for new conversation:", err);
            });
          
          // If user info is provided in data, use it immediately (from socket)
          if (data.user) {
            const newConv: Conversation = {
              user: {
                id: data.user.id,
                name: data.user.name,
                profilePicture: data.user.profilePicture,
              },
              lastMessage: data.lastMessage,
              unreadCount: data.unreadCount,
            };
            // Add to top and sort by last message time (newest first - like WhatsApp)
            const sorted = [newConv, ...old].sort((a, b) => {
              if (!a.lastMessage && !b.lastMessage) return 0;
              if (!a.lastMessage) return 1;
              if (!b.lastMessage) return -1;
              return (
                new Date(b.lastMessage.createdAt).getTime() -
                new Date(a.lastMessage.createdAt).getTime()
              );
            });
            return sorted;
          }
          
          // Return old data for now (will be updated when user info is fetched)
          return old;
        }
        
        // Ensure conversations are sorted by last message time (like WhatsApp)
        return updated.sort((a, b) => {
          if (!a.lastMessage || !b.lastMessage) return 0;
          return (
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime()
          );
        });
      });
    };

    // Handle message updated (replace temp message with real one)
    const handleMessageUpdated = (data: {
      tempId: string;
      realId: string;
      message: Message;
    }) => {
      if (data.message.receiverId === userId || data.message.senderId === userId) {
        setMessages((prev) => {
          const updated = prev.map((msg) => {
            if (msg.id === data.tempId) {
              return { ...data.message, isDecrypted: msg.isDecrypted };
            }
            return msg;
          });
          // Update cache
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        });
      }
    };

    // Log when socket connects/disconnects
    const handleConnect = () => {
      console.log("✅ Socket connected in messages page", socket.id);
    };
    const handleDisconnect = () => {
      console.log("❌ Socket disconnected in messages page");
    };

    socket.on("newDirectMessage", handleNewDirectMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("conversation-updated", handleConversationUpdated);
    socket.on("message-updated", handleMessageUpdated);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("newDirectMessage", handleNewDirectMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("conversation-updated", handleConversationUpdated);
      socket.off("message-updated", handleMessageUpdated);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, userId, selectedUserId, encryption, refreshConversationsThrottled, queryClient]);

  // Handle file selection (image/video)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia({
          file,
          preview: reader.result as string,
          type: "image",
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia({
          file,
          preview: reader.result as string,
          type: "video",
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Hanya file gambar atau video yang diizinkan");
    }
  };

  // Handle audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Convert blob to File for upload
        const audioFile = new File([blob], "recording.webm", { type: "audio/webm" });
        setSelectedMedia({
          file: audioFile,
          preview: url,
          type: "audio",
        });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Tidak dapat mengakses microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream?.getTracks();
      tracks?.forEach(track => track.stop());
    }
    stopRecording();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setSelectedMedia(null);
    setRecordingTime(0);
  };

  // Upload and send media message
  const uploadAndSendMedia = async () => {
    if (!selectedMedia || !selectedUserId || sending || !userId) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("media", selectedMedia.file);

      const uploadResponse = await AxiosInstance.post("/upload/chat-media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      const mediaUrl = uploadResponse.data.url;
      // Always provide content - use caption if available, otherwise default based on media type
      const messageContent = newMessage.trim() || 
        (selectedMedia.type === "audio" ? "Voice message" : 
         selectedMedia.type === "image" ? "Image" : "Video");
      
      // Send message with media
      await sendMessageWithMedia(mediaUrl, selectedMedia.type, messageContent);
      
      // Clear media
      setSelectedMedia(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error: any) {
      console.error("Error uploading media:", error);
      toast.error(error.response?.data?.error || "Gagal upload media");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Send message with media
  const sendMessageWithMedia = async (mediaUrl: string, mediaType: "image" | "video" | "audio", content: string) => {
    if (!selectedUserId || sending || !userId) return;

    // Ensure content is never empty - backend requires it
    const messageContent = content && content.trim() 
      ? content.trim()
      : (mediaType === "audio" ? "Voice message" : mediaType === "image" ? "Image" : "Video");

    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    const selectedConv = conversations.find((c: Conversation) => c.user.id === selectedUserId);
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempMessageId,
      content: messageContent,
      senderId: userId,
      receiverId: selectedUserId,
      type: mediaType,
      mediaUrl: mediaUrl,
      read: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        name: "You",
        profilePicture: null,
      },
      receiver: {
        id: selectedUserId,
        name: selectedConv?.user.name || "",
        profilePicture: selectedConv?.user.profilePicture || null,
      },
    };

    // Optimistic update
    shouldAutoScrollRef.current = true; // Force scroll setelah send media message
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setSending(true);

    try {
      const response = await AxiosInstance.post("/direct-messages", {
        receiverId: selectedUserId,
        content: messageContent,
        type: mediaType,
        mediaUrl: mediaUrl,
      });

      // Replace optimistic message with real message from server
      const realMessage = response.data.directMessage;
      
      setMessages((prev) => {
        // Check if real message already exists (from socket or previous update)
        const realMessageExists = prev.some((msg) => msg.id === realMessage.id);
        
        if (realMessageExists) {
          // Real message sudah ada, hanya remove temp message
        const filtered = prev.filter((msg) => msg.id !== tempMessageId);
          // Update cache
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, filtered);
        }
        return filtered;
        }
        
        // Real message belum ada, replace temp dengan real message
        // Pastikan temp message ada sebelum replace
        const tempMessageExists = prev.some((msg) => msg.id === tempMessageId);
        
        if (tempMessageExists) {
          // Replace temp dengan real
          const updated = prev.map((msg) => {
            if (msg.id === tempMessageId) {
              return realMessage;
            }
            return msg;
          });
          
          // Sort by createdAt to maintain order
          updated.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          // Update cache
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        } else {
          // Temp message tidak ada, tambahkan real message
          const updated = [...prev, realMessage].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          // Update cache
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        }
      });
      
      // Scroll to bottom setelah message tersimpan di database
      shouldAutoScrollRef.current = true; // Force scroll setelah send message
      // useEffect akan handle scroll otomatis
      
      refreshConversationsThrottled();
      toast.success("Media berhasil dikirim");
    } catch (error: any) {
      console.error("Error sending media message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
      toast.error(error.response?.data?.error || "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  // Original sendMessage for text only
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedMedia) || !selectedUserId || !userId || sending) return;

    // If there's selected media, upload it first
    if (selectedMedia) {
      await uploadAndSendMedia();
      return;
    }

    const messageContent = newMessage.trim();
    if (!messageContent) return; // Double check
    
    setSending(true);
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    
    // Get selected conversation for receiver data
    const selectedConv = conversations.find((c: Conversation) => c.user.id === selectedUserId);
    
    // Encrypt message if encryption is enabled (cache public key for performance)
    let encryptedContent: string | null = null;
    let encryptionKeyId: string | null = null;
    
    if (encryption && enableEncryption && receiverPublicKey && encryption.hasKeys) {
      try {
        // Cache the public key if not already cached
        if (!publicKeyCacheRef.current.has(selectedUserId)) {
          publicKeyCacheRef.current.set(selectedUserId, receiverPublicKey);
        }
        
        const encrypted = await encryption.encryptForUser(messageContent, receiverPublicKey);
        if (encrypted) {
          encryptedContent = JSON.stringify(encrypted);
          encryptionKeyId = encryption.keyPair?.keyId || null;
        }
      } catch (error) {
        console.error("Error encrypting message:", error);
        toast.error("Gagal mengenkripsi pesan. Mengirim sebagai plain text.");
        // Continue without encryption
      }
    }
    
    // Create optimistic message - message appears immediately without waiting for server
    const optimisticMessage: Message = {
      id: tempMessageId,
      content: messageContent,
      encryptedContent: encryptedContent,
      encryptionKeyId: encryptionKeyId,
      senderId: userId,
      receiverId: selectedUserId,
      type: "text",
      mediaUrl: null,
      read: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        name: currentUserProfile?.name || "You",
        profilePicture: currentUserProfile?.profilePicture || null,
      },
      receiver: {
        id: selectedUserId,
        name: selectedConv?.user.name || "",
        profilePicture: selectedConv?.user.profilePicture || null,
      },
    };

    // Optimistic update - add message immediately
    shouldAutoScrollRef.current = true; // Force scroll setelah send message
    setMessages((prev) => {
      const updated = [...prev, optimisticMessage];
      console.log(`[SendMessage] Added optimistic message, total: ${updated.length}`);
      // Update cache immediately
      if (selectedUserId) {
        messagesCacheRef.current.set(selectedUserId, updated);
      }
      return updated;
    });
    setNewMessage("");

    try {
      const response = await AxiosInstance.post("/direct-messages", {
        receiverId: selectedUserId,
        // Selalu kirim plain content ke backend agar tidak tersimpan sebagai pesan kosong
        // encryptedContent tetap dikirim untuk E2EE antara klien
        content: messageContent,
        encryptedContent: encryptedContent,
        encryptionKeyId: encryptionKeyId,
        type: "text",
      });

      // Replace optimistic message with real message from server
      // GUARANTEE: Message tidak akan hilang - selalu replace atau add
      const realMessage = response.data.directMessage;
      
      if (!realMessage || !realMessage.id) {
        console.error("[SendMessage] Invalid real message from server:", realMessage);
        // Don't remove temp message if real message is invalid
        return;
      }
      
      setMessages((prev) => {
        console.log(`[SendMessage] Replacing temp message, prev count: ${prev.length}, tempId: ${tempMessageId}, realId: ${realMessage.id}`);
        
        // Check if real message already exists (from socket or previous update)
        const realMessageExists = prev.some((msg) => msg.id === realMessage.id);
        
        if (realMessageExists) {
          console.log(`[SendMessage] Real message already exists, removing temp only`);
          // Real message sudah ada, hanya remove temp message
        const filtered = prev.filter((msg) => msg.id !== tempMessageId);
          // Update cache
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, filtered);
        }
        return filtered;
        }
        
        // Real message belum ada - PASTIKAN ditambahkan
        // Cari temp message dan replace, atau tambahkan jika tidak ada
        const tempIndex = prev.findIndex((msg) => msg.id === tempMessageId);
        
        if (tempIndex !== -1) {
          console.log(`[SendMessage] Replacing temp at index ${tempIndex}`);
          // Replace temp dengan real message (GUARANTEED - tidak akan hilang)
          const updated = [...prev];
          updated[tempIndex] = realMessage;
          
          // Sort by createdAt to maintain order
          updated.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          console.log(`[SendMessage] After replace, count: ${updated.length}`);
          // Update cache
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        } else {
          console.log(`[SendMessage] Temp message not found, adding real message`);
          // Temp message tidak ada (mungkin sudah di-replace oleh socket), tambahkan real message
          // GUARANTEED - message tidak akan hilang
          const updated = [...prev, realMessage].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          console.log(`[SendMessage] After add, count: ${updated.length}`);
          // Update cache
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        }
      });
      
      // Scroll to bottom setelah message tersimpan di database
      shouldAutoScrollRef.current = true; // Force scroll setelah send message
      // useEffect akan handle scroll otomatis
      
      refreshConversationsThrottled();
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
      setNewMessage(messageContent);
      toast.error(error.response?.data?.error || "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((conv: Conversation) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(
    (c: Conversation) => c.user.id === selectedUserId
  );

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16" style={{ pointerEvents: 'auto' }}>
        <div className="container mx-auto px-2 sm:px-4 lg:px-8 max-w-7xl" style={{ pointerEvents: 'auto' }}>
          <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] min-h-0 border border-border rounded-xl overflow-hidden bg-card" style={{ pointerEvents: 'auto' }}>
            {/* Conversations List */}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto" data-lenis-prevent>
                {loadingConversations ? (
                  <ConversationSkeleton count={5} />
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
                        onClick={() => setSelectedUserId(conversation.user.id)}
                        onMouseEnter={() => handleConversationHover(conversation.user.id)}
                        onMouseLeave={() => handleConversationLeave(conversation.user.id)}
                        className={`w-full p-3 rounded-lg mb-2 transition-colors ${
                          selectedUserId === conversation.user.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${
                            selectedUserId === conversation.user.id
                              ? "ring-2 ring-primary-foreground/30"
                              : "ring-2 ring-border"
                          }`}>
                            {conversation.user.profilePicture ? (
                              <Image
                                src={conversation.user.profilePicture}
                                alt={conversation.user.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                selectedUserId === conversation.user.id
                                  ? "bg-primary-foreground/30 text-primary-foreground"
                                  : "bg-primary/20 text-primary"
                              }`}>
                                <User className="h-6 w-6" />
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

            {/* Messages Area */}
            <div
              className={`flex-1 flex flex-col min-h-0 ${
                !selectedUserId ? "hidden md:flex" : "flex"
              }`}
            >
              {selectedUserId ? (
                <>
                  {/* Header - Sticky */}
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUserId(null)}
                        className="md:hidden p-2 hover:bg-accent rounded-lg"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border">
                        {selectedConversation?.user.profilePicture ? (
                          <Image
                            src={selectedConversation.user.profilePicture}
                            alt={selectedConversation.user.name}
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
                        <p className="font-semibold">
                          {selectedConversation?.user.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {enableEncryption && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs">
                          <Lock className="h-3.5 w-3.5" />
                          <span>E2EE</span>
                        </div>
                      )}
                      {encryption && !encryption.hasKeys && (
                        <button
                          onClick={() => setShowKeyPairModal(true)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition-colors"
                          title="Aktifkan enkripsi end-to-end"
                        >
                          <Key className="h-3.5 w-3.5" />
                          <span>Aktifkan E2EE</span>
                        </button>
                      )}
                      {encryption && encryption.hasKeys && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await encryption.generateKeyPair();
                              toast.success("Key E2EE berhasil digenerate ulang");
                            } catch (err) {
                              console.error("Gagal regenerate key pair:", err);
                              toast.error("Gagal generate ulang key. Coba lagi.");
                            }
                          }}
                          className="p-1 rounded-full hover:bg-accent transition-colors"
                          title="Generate ulang key E2EE"
                        >
                          <Key className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto" 
                    data-lenis-prevent
                  >
                    {loadingMessages && messages.length === 0 ? (
                      <MessageSkeleton count={6} />
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground/70 mt-2">Start a conversation!</p>
                            </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {/* Load more trigger - untuk infinite scroll */}
                        {hasNextPage && (
                          <div ref={loadMoreTriggerRef} className="flex justify-center py-2">
                            {isFetchingNextPage ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading older messages...</span>
                      </div>
                    ) : (
                              <div className="h-1 w-full" /> // Invisible trigger
                            )}
                          </div>
                        )}
                        
                        {messages.map((message) => {
                      const isOwn = message.senderId === userId;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {/* Render media based on type */}
                            {message.type === "image" && message.mediaUrl && (
                              <div 
                                className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-lg overflow-hidden mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setViewingImage(message.mediaUrl!)}
                              >
                                <Image 
                                  src={message.mediaUrl} 
                                  alt="Image" 
                                  fill 
                                  className="object-cover" 
                                  sizes="(max-width: 640px) 192px, 256px"
                                  unoptimized
                                />
                              </div>
                            )}
                            {message.type === "video" && message.mediaUrl && (
                              <video 
                                src={message.mediaUrl} 
                                controls 
                                className="max-w-full max-h-96 rounded-lg mb-2"
                              />
                            )}
                            {message.type === "audio" && message.mediaUrl && (
                              <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg mb-2">
                                <button
                                  onClick={() => {
                                    const audioElement = audioRefs.current.get(message.id);
                                    if (!audioElement) {
                                      const audio = new Audio(message.mediaUrl!);
                                      audioRefs.current.set(message.id, audio);
                                      audio.play();
                                      audio.onended = () => {
                                        setPlayingAudioId(null);
                                      };
                                      setPlayingAudioId(message.id);
                                    } else {
                                      if (audioElement.paused) {
                                        audioElement.play();
                                        setPlayingAudioId(message.id);
                                      } else {
                                        audioElement.pause();
                                        setPlayingAudioId(null);
                                      }
                                    }
                                  }}
                                  className="p-1 rounded-full bg-background text-foreground hover:opacity-80 transition-opacity"
                                >
                                  {playingAudioId === message.id && !audioRefs.current.get(message.id)?.paused ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </button>
                                <audio
                                  ref={(el) => {
                                    if (el) audioRefs.current.set(message.id, el);
                                    else audioRefs.current.delete(message.id);
                                  }}
                                  src={message.mediaUrl}
                                  onEnded={() => setPlayingAudioId(null)}
                                />
                                <span className="text-sm">Voice message</span>
                              </div>
                            )}
                            
                            {/* Render content (caption) if it exists and is not just default text */}
                            {message.content && 
                             message.content !== "Image" && 
                             message.content !== "Video" && 
                             message.content !== "Voice message" && (
                              <p className="text-sm">{message.content}</p>
                            )}
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <p className="text-xs opacity-70">
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {/* Read receipts - only show for own messages */}
                              {isOwn && (
                                <div className="flex items-center">
                                  {message.readAt ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                                  ) : message.deliveredAt ? (
                                    <CheckCheck className="h-3.5 w-3.5 opacity-70" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 opacity-50" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                        })}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Media Preview */}
                  {selectedMedia && (
                    <div className="p-4 border-t border-border bg-muted/30">
                      <div className="relative">
                        {selectedMedia.type === "image" && (
                          <div className="relative rounded-lg overflow-hidden max-w-xs">
                            <Image
                              src={selectedMedia.preview}
                              alt="Preview"
                              width={300}
                              height={300}
                              className="w-full h-auto rounded-lg"
                              unoptimized
                            />
                            <button
                              onClick={() => {
                                setSelectedMedia(null);
                                if (audioUrl) {
                                  URL.revokeObjectURL(audioUrl);
                                  setAudioUrl(null);
                                }
                                setAudioBlob(null);
                                setRecordingTime(0);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {selectedMedia.type === "video" && (
                          <div className="relative rounded-lg overflow-hidden max-w-xs">
                            <video
                              src={selectedMedia.preview}
                              controls
                              className="w-full h-auto rounded-lg max-h-48"
                            />
                            <button
                              onClick={() => {
                                setSelectedMedia(null);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {selectedMedia.type === "audio" && (
                          <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                            <button
                              onClick={() => {
                                const audio = new Audio(selectedMedia.preview);
                                audio.play();
                              }}
                              className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                            >
                              <Play className="h-5 w-5 ml-0.5" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {recordingTime > 0
                                  ? `${Math.floor(recordingTime / 60)}:${String(recordingTime % 60).padStart(2, "0")}`
                                  : "Voice recording"}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                cancelRecording();
                              }}
                              className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-full transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {uploading && (
                          <div className="mt-2">
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-2 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Uploading... {uploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex flex-col gap-2">
                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* File input (hidden) */}
                        <input
                          type="file"
                          id="media-upload"
                          accept="image/*,video/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        
                        {/* Single "+" button for media (image/video) */}
                        <label
                          htmlFor="media-upload"
                          className="flex-shrink-0 p-2 rounded-lg bg-muted hover:bg-accent transition-colors cursor-pointer"
                          title="Tambah media"
                        >
                          <Plus className="h-5 w-5 text-primary" />
                        </label>
                        
                        {/* Text input */}
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder={selectedMedia ? "Add caption (optional)..." : "Type a message..."}
                          className="flex-1 px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        
                        {/* Send button */}
                        <button
                          onClick={sendMessage}
                          disabled={(!newMessage.trim() && !selectedMedia) || uploading || isRecording}
                          className="flex-shrink-0 px-4 md:px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Image Viewer Modal */}
      <ImageViewer
        imageUrl={viewingImage}
        onClose={() => setViewingImage(null)}
        alt="Direct message image"
      />

      {/* Key Pair Modal */}
      <ConfirmModal
        isOpen={showKeyPairModal}
        onClose={() => setShowKeyPairModal(false)}
        onConfirm={handleGenerateKeyPair}
        title="Aktifkan Enkripsi End-to-End"
        message="Enkripsi end-to-end belum diaktifkan. Aktifkan sekarang untuk keamanan pesan? (Anda bisa skip jika tidak ingin menggunakan enkripsi)"
        confirmText="Aktifkan"
        cancelText="Skip"
        isLoading={generatingKeyPair}
      />
    </div>
  );
}

function MessagesLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoadingFallback />}>
      <MessagesPageContent />
    </Suspense>
  );
}

