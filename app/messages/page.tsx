"use client";

import { useState, useEffect, useContext, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Send, User, Search, ArrowLeft, MessageSquare, Image as ImageIcon, Video, Mic, X, Loader2, Play, Pause, Lock, Key, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from "@/providers/SocketProvider";
import ImageViewer from "@/components/ImageViewer";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { useEncryption } from "@/hooks/useEncryption";

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
  createdAt: string;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [receiverPublicKey, setReceiverPublicKey] = useState<string | null>(null);
  const [enableEncryption, setEnableEncryption] = useState(false);
  const [showKeyPairModal, setShowKeyPairModal] = useState(false);
  const [generatingKeyPair, setGeneratingKeyPair] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name: string; profilePicture: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastConversationsFetchRef = useRef<number>(0);
  
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
    }
    
    fetchConversations();
  }, [authenticated, searchParams]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      loadReceiverPublicKey(selectedUserId);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get("/direct-messages");
      setConversations(response.data.conversations || []);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error(error.response?.data?.error || "Gagal mengambil percakapan");
    } finally {
      setLoading(false);
    }
  }, []);

  // Throttled refresh for conversations list, so it doesn't refetch too often
  const refreshConversationsThrottled = useCallback(() => {
    const now = Date.now();
    if (now - lastConversationsFetchRef.current < 1000) {
      return;
    }
    lastConversationsFetchRef.current = now;
    fetchConversations();
  }, [fetchConversations]);

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

  const fetchMessages = async (otherUserId: string) => {
    try {
      const response = await AxiosInstance.get(`/direct-messages/${otherUserId}`);
      const fetchedMessages = response.data.messages || [];
      
      if (encryption && encryption.hasKeys) {
        const decryptedMessages = await Promise.all(
          fetchedMessages.map(async (msg: Message) => {
            if (msg.encryptedContent && msg.senderId !== userId) {
              try {
                const senderPublicKey = await encryption.getUserPublicKey(msg.senderId);
                if (senderPublicKey) {
                  const encrypted = JSON.parse(msg.encryptedContent);
                  const decrypted = await encryption.decryptFromUser(
                    encrypted,
                    senderPublicKey
                  );
                  if (decrypted) {
                    return { ...msg, content: decrypted, isDecrypted: true };
                  }
                }
              } catch (error) {
                console.error("Error decrypting message:", error);
              }
            }
            return msg;
          })
        );
        setMessages(decryptedMessages);
      } else {
        setMessages(fetchedMessages);
      }
      
      markAsRead(otherUserId);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error(error.response?.data?.error || "Gagal mengambil pesan");
    }
  };

  const markAsRead = async (otherUserId: string) => {
    try {
      await AxiosInstance.put(`/direct-messages/${otherUserId}/read`);
      refreshConversationsThrottled();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Listen for direct messages via global socket (single connection)
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewDirectMessage = async (message: Message) => {
      // If there's an active conversation, only update when message belongs to it
      if (
        selectedUserId &&
        ( (message.senderId === selectedUserId && message.receiverId === userId) ||
          (message.senderId === userId && message.receiverId === selectedUserId) )
      ) {
        let decryptedMessage = message;
        if (
          encryption &&
          message.encryptedContent &&
          message.senderId !== userId &&
          encryption.hasKeys
        ) {
          try {
            const senderPublicKey = await encryption.getUserPublicKey(
              message.senderId
            );
            if (senderPublicKey) {
              const encrypted = JSON.parse(message.encryptedContent);
              const decrypted = await encryption.decryptFromUser(
                encrypted,
                senderPublicKey
              );
              if (decrypted) {
                decryptedMessage = { ...message, content: decrypted };
              }
            }
          } catch (error) {
            console.error("Error decrypting incoming message:", error);
          }
        }

        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === decryptedMessage.id);
          if (!exists) {
            return [...prev, decryptedMessage];
          }
          return prev;
        });

        if (message.senderId === selectedUserId) {
          markAsRead(selectedUserId);
        }
      }

      // Always refresh conversations in a throttled way for sidebar preview/unread
      refreshConversationsThrottled();
    };

    socket.on("newDirectMessage", handleNewDirectMessage);

    return () => {
      socket.off("newDirectMessage", handleNewDirectMessage);
    };
  }, [socket, userId, selectedUserId, encryption, refreshConversationsThrottled]);

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
    const selectedConv = conversations.find((c) => c.user.id === selectedUserId);
    
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

      // Replace optimistic message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== tempMessageId);
        const exists = filtered.some((msg) => msg.id === response.data.directMessage.id);
        if (!exists) {
          return [...filtered, response.data.directMessage];
        }
        return filtered;
      });
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
    if ((!newMessage.trim() && !selectedMedia) || !selectedUserId || !userId) return;

    // If there's selected media, upload it first
    if (selectedMedia) {
      await uploadAndSendMedia();
      return;
    }

    const messageContent = newMessage.trim();
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    
    // Get selected conversation for receiver data
    const selectedConv = conversations.find((c) => c.user.id === selectedUserId);
    
    // Encrypt message if encryption is enabled
    let encryptedContent: string | null = null;
    let encryptionKeyId: string | null = null;
    
    if (encryption && enableEncryption && receiverPublicKey && encryption.hasKeys) {
      try {
        const encrypted = await encryption.encryptForUser(messageContent, receiverPublicKey);
        if (encrypted) {
          encryptedContent = JSON.stringify(encrypted);
          encryptionKeyId = encryption.keyPair?.keyId || null;
        }
      } catch (error) {
        console.error("Error encrypting message:", error);
        toast.error("Gagal mengenkripsi pesan. Mengirim sebagai plain text.");
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
    setMessages((prev) => [...prev, optimisticMessage]);
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
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== tempMessageId);
        const exists = filtered.some((msg) => msg.id === response.data.directMessage.id);
        if (!exists) {
          return [...filtered, response.data.directMessage];
        }
        return filtered;
      });
      refreshConversationsThrottled();
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
      setNewMessage(messageContent);
      toast.error(error.response?.data?.error || "Gagal mengirim pesan");
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(
    (c) => c.user.id === selectedUserId
  );

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-2 sm:px-4 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] min-h-0 border border-border rounded-xl overflow-hidden bg-card">
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
                        onClick={() => setSelectedUserId(conversation.user.id)}
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

            {/* Messages Area */}
            <div
              className={`flex-1 flex flex-col min-h-0 ${
                !selectedUserId ? "hidden md:flex" : "flex"
              }`}
            >
              {selectedUserId ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUserId(null)}
                        className="md:hidden p-2 hover:bg-accent rounded-lg"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" data-lenis-prevent>
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
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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

