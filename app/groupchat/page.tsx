"use client";

import { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance, { getSocketUrl } from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { io, Socket } from "socket.io-client";
import { MessageCircle, Plus, Send, Users, ArrowLeft, Loader2, Image as ImageIcon, Video, Mic, VideoIcon, X, Play, Pause, Lock, Globe, Settings, Crown, UserMinus, UserPlus, Search, Compass, Key } from "lucide-react";
import toast from "react-hot-toast";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import ImageViewer from "@/components/ImageViewer";
import ConfirmModal from "@/components/modals/ConfirmModal";

interface GroupChat {
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

interface Message {
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

export default function GroupChatPage() {
  const { authenticated, userId, isSuspended, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name: string; profilePicture: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [showEveryoneWarning, setShowEveryoneWarning] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  const [hoveredMention, setHoveredMention] = useState<{
    username: string;
    userId: string;
    x: number;
    y: number;
  } | null>(null);
  const mentionHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "video" | "audio";
    file: File;
    preview?: string;
  } | null>(null);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(true);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const [showExplore, setShowExplore] = useState(false);
  const [exploreGroups, setExploreGroups] = useState<GroupChat[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const mediaMenuRef = useRef<HTMLDivElement>(null);
  
  const [typingUsers, setTypingUsers] = useState<Map<string, { name: string; timeout: NodeJS.Timeout }>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated && !isSuspended) {
      router.push("/login");
      return;
    }
    if (isSuspended) {
      toast.error("Akun Anda telah di-suspend. Anda tidak dapat mengakses group chat.");
      router.push("/");
      return;
    }
    if (authenticated && !isSuspended) {
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
      fetchGroupChats();
    }
  }, [authenticated, isSuspended, router]);

  const fetchGroupDetails = async (groupId: string) => {
    try {
      const response = await AxiosInstance.get(`/groupchat/${groupId}`);
      const groupData = response.data.groupChat;
      if (groupData) {
        setSelectedGroup((prev) => {
          if (prev?.id === groupId) {
            return { ...prev, members: groupData.members || [] };
          }
          return prev;
        });
      }
    } catch (error: any) {
      console.error("Error fetching group details:", error);
    }
  };


  useEffect(() => {
    if (selectedGroup) {
      fetchMessages();
      
      if (!selectedGroup.members || !Array.isArray(selectedGroup.members)) {
        fetchGroupDetails(selectedGroup.id);
      }
      
      if (authenticated) {
        connectSocket();
        checkAdminStatus();
        fetchMembers();
        return () => {
          if (socket) {
            socket.emit("leave-group", selectedGroup.id);
            socket.disconnect();
          }
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingUsers.forEach((user) => {
            clearTimeout(user.timeout);
          });
          setTypingUsers(new Map());
          if (mentionHoverTimeoutRef.current) {
            clearTimeout(mentionHoverTimeoutRef.current);
          }
          setHoveredMention(null);
        };
      }
    }
  }, [selectedGroup, authenticated]);
  
  const checkAdminStatus = () => {
    if (!selectedGroup || !userId) {
      setIsAdmin(false);
      setIsCreator(false);
      return;
    }
    
    const member = selectedGroup.members?.find((m) => m.userId === userId);
    setIsAdmin(member?.role === "admin" || false);
    setIsCreator(selectedGroup.createdBy === userId);
  };
  
  const fetchMembers = async () => {
    if (!selectedGroup) return;
    
    try {
      setLoadingMembers(true);
      const response = await AxiosInstance.get(`/groupchat/${selectedGroup.id}/members`);
      setMembers(response.data.members || []);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast.error("Gagal mengambil members");
    } finally {
      setLoadingMembers(false);
    }
  };
  
  const fetchExploreGroups = async () => {
    try {
      setLoadingExplore(true);
      const response = await AxiosInstance.get("/groupchat/explore", {
        params: { search: searchQuery || undefined, limit: 50 },
      });
      setExploreGroups(response.data.groupChats || []);
    } catch (error: any) {
      console.error("Error fetching explore groups:", error);
      toast.error("Gagal mengambil group chats");
    } finally {
      setLoadingExplore(false);
    }
  };
  
  useEffect(() => {
    if (showExplore) {
      fetchExploreGroups();
    }
  }, [showExplore, searchQuery]);
  
  const handleJoinGroup = async (groupId: string) => {
    try {
      await AxiosInstance.post(`/groupchat/${groupId}/join`);
      toast.success("Berhasil join group!");
      await fetchGroupChats();
      await fetchExploreGroups();
    } catch (error: any) {
      console.error("Error joining group:", error);
      toast.error(error.response?.data?.msg || "Gagal join group");
    }
  };
  
  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      setSavingSettings(true);
      await AxiosInstance.put(`/groupchat/${selectedGroup.id}`, {
        name: editingName,
        description: editingDescription,
      });
      toast.success("Group berhasil diupdate!");
      await fetchGroupChats();
      const updatedGroup = groupChats.find((g) => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup({ ...updatedGroup, name: editingName, description: editingDescription });
      }
      setShowSettings(false);
    } catch (error: any) {
      console.error("Error updating group:", error);
      toast.error(error.response?.data?.msg || "Gagal update group");
    } finally {
      setSavingSettings(false);
    }
  };
  
  const handleUploadLogo = async (file: File) => {
    if (!selectedGroup) return;
    
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", file);
      
      const response = await AxiosInstance.post(`/upload/group-logo/${selectedGroup.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.success("Logo berhasil diupload!");
      await fetchGroupChats();
      const updatedGroup = groupChats.find((g) => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup({ ...updatedGroup, logo: response.data.logo });
      }
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.response?.data?.msg || "Gagal upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadBanner = async (file: File) => {
    if (!selectedGroup) return;

    try {
      setUploadingBanner(true);
      const formData = new FormData();
      formData.append("banner", file);

      const response = await AxiosInstance.post(
        `/upload/group-banner/${selectedGroup.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      toast.success("Banner berhasil diupload!");
      await fetchGroupChats();
      const updatedGroup = groupChats.find((g) => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup({ ...updatedGroup, banner: response.data.banner });
      }
    } catch (error: any) {
      console.error("Error uploading banner:", error);
      toast.error(error.response?.data?.msg || "Gagal upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };
  
  const handlePromoteMember = async (memberId: string) => {
    if (!selectedGroup) return;
    
    try {
      await AxiosInstance.put(`/groupchat/${selectedGroup.id}/members/${memberId}/promote`);
      toast.success("Member berhasil dipromote!");
      await fetchMembers();
      await fetchGroupChats();
    } catch (error: any) {
      console.error("Error promoting member:", error);
      toast.error(error.response?.data?.msg || "Gagal promote member");
    }
  };
  
  const handleDemoteMember = async (memberId: string) => {
    if (!selectedGroup) return;
    
    try {
      await AxiosInstance.put(`/groupchat/${selectedGroup.id}/members/${memberId}/demote`);
      toast.success("Admin berhasil didemote!");
      await fetchMembers();
      await fetchGroupChats();
    } catch (error: any) {
      console.error("Error demoting member:", error);
      toast.error(error.response?.data?.msg || "Gagal demote member");
    }
  };
  
  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;
    
    try {
      await AxiosInstance.delete(`/groupchat/${selectedGroup.id}/members/${memberId}`);
      toast.success("Member berhasil dihapus!");
      await fetchMembers();
      await fetchGroupChats();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.response?.data?.msg || "Gagal remove member");
    }
  };

  // Mention autocomplete functions
  const getMentionSuggestions = useMemo(() => {
    if (!selectedGroup) return [];
    if (!selectedGroup.members || !Array.isArray(selectedGroup.members)) return [];
    
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
      .slice(0, showEveryone ? 4 : 5); // Reserve 1 slot for everyone if showing
    
    return [...everyoneOption, ...filteredMembers];
  }, [selectedGroup, mentionQuery, userId]);

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    if (socket && selectedGroup && value.trim().length > 0) {
      socket.emit("typing", { groupId: selectedGroup.id });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socket && selectedGroup) {
          socket.emit("stop-typing", { groupId: selectedGroup.id });
        }
      }, 1000);
    } else if (socket && selectedGroup && value.trim().length === 0) {
      socket.emit("stop-typing", { groupId: selectedGroup.id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

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
    setMessageInput(newText);
    setShowMentionSuggestions(false);
    setMentionQuery("");
    setSelectedMentionIndex(0);

    setTimeout(() => {
      if (messageInputRef.current) {
        const newPosition = mentionPosition + username.length + 2; // +2 for @ and space
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const confirmEveryoneMention = () => {
    if (!messageInputRef.current) return;

    const cursorPosition = messageInputRef.current.selectionStart || 0;
    const textBeforeCursor = messageInput.substring(0, mentionPosition);
    const textAfterCursor = messageInput.substring(cursorPosition);
    
    const newText = `${textBeforeCursor}@everyone ${textAfterCursor}`;
    setMessageInput(newText);
    setShowMentionSuggestions(false);
    setShowEveryoneWarning(false);
    setMentionQuery("");
    setSelectedMentionIndex(0);

    setTimeout(() => {
      if (messageInputRef.current) {
        const newPosition = mentionPosition + "everyone".length + 2; // +2 for @ and space
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentionSuggestions || getMentionSuggestions.length === 0) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < getMentionSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (getMentionSuggestions[selectedMentionIndex]) {
          const selected = getMentionSuggestions[selectedMentionIndex];
          insertMention(selected.name, (selected as any).isEveryone || false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowMentionSuggestions(false);
        setMentionQuery("");
        break;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectSocket = async () => {
    if (!selectedGroup || !authenticated) return;

    try {
      let token: string | null = null;
      
      try {
        const tokenResponse = await AxiosInstance.get("/auth/socket-token");
        if (tokenResponse.data.token && tokenResponse.data.authenticated) {
          token = tokenResponse.data.token;
        }
      } catch (error: any) {
        console.error("Error getting socket token:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired, silakan login ulang");
          router.push("/login");
          return;
        }
        try {
          await AxiosInstance.post("/auth/refresh");
          const retryResponse = await AxiosInstance.get("/auth/socket-token");
          if (retryResponse.data.token && retryResponse.data.authenticated) {
            token = retryResponse.data.token;
          }
        } catch (refreshError) {
          toast.error("Session expired, silakan login ulang");
          router.push("/login");
          return;
        }
      }

      if (!token) {
        toast.error("Token tidak ditemukan, silakan login ulang");
        router.push("/login");
        return;
      }

      // Get socket URL (handles production and development)
      const socketUrl = getSocketUrl();

      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }

      const newSocket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      setupSocketHandlers(newSocket);
      setSocket(newSocket);
    } catch (error) {
      console.error("Error connecting socket:", error);
      toast.error("Gagal terhubung ke chat");
    }
  };

  const setupSocketHandlers = (socketInstance: Socket) => {
    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket");
      if (selectedGroup) {
        socketInstance.emit("join-group", selectedGroup.id);
      }
    });

    socketInstance.on("new-message", async (message: Message) => {
      const decryptedMessage = message;

      setMessages((prev) => {
        const filtered = prev.filter((msg) => {
          if (msg.id.startsWith("temp-") && msg.user.id === decryptedMessage.user.id) {
            if (decryptedMessage.type === "text" && msg.type === "text") {
              return msg.content !== decryptedMessage.content;
            }
            if (decryptedMessage.type !== "text" && msg.type !== "text" && decryptedMessage.mediaUrl) {
              return msg.mediaUrl !== decryptedMessage.mediaUrl;
            }
            return true;
          }
          return true;
        });
        const messageExists = filtered.some((msg) => msg.id === decryptedMessage.id);
        if (messageExists) {
          return filtered;
        }
        return [...filtered, decryptedMessage];
      });
    });

    socketInstance.on("user-joined", (data: { userId: string; userName: string }) => {
      if (data.userId !== userId) {
        toast.success(`${data.userName} bergabung ke chat`);
      }
    });

    socketInstance.on("error", (error: { msg: string }) => {
      toast.error(error.msg);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from socket");
    });

    socketInstance.on("connect_error", (error: any) => {
      console.error("Socket connection error:", error);
      if (error.message === "Authentication error") {
        toast.error("Autentikasi gagal, silakan login ulang");
        router.push("/login");
      } else {
        toast.error("Gagal terhubung ke chat");
      }
    });

    socketInstance.on("user-typing", (data: { userId: string; userName: string }) => {
      if (data.userId !== userId) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          if (newMap.has(data.userId)) {
            clearTimeout(newMap.get(data.userId)!.timeout);
          }
          const timeout = setTimeout(() => {
            setTypingUsers((prev) => {
              const updated = new Map(prev);
              updated.delete(data.userId);
              return updated;
            });
          }, 3000);
          newMap.set(data.userId, { name: data.userName, timeout });
          return newMap;
        });
      }
    });

    socketInstance.on("user-stop-typing", (data: { userId: string }) => {
      if (data.userId !== userId) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          if (newMap.has(data.userId)) {
            clearTimeout(newMap.get(data.userId)!.timeout);
            newMap.delete(data.userId);
          }
          return newMap;
        });
      }
    });
  };

  const fetchGroupChats = async () => {
    try {
      setLoadingGroups(true);
      const response = await AxiosInstance.get("/groupchat");
      setGroupChats(response.data.groupChats || []);
    } catch (error: any) {
      console.error("Error fetching group chats:", error);
      toast.error("Gagal mengambil group chats");
    } finally {
      setLoadingGroups(false);
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedGroup) return;

    try {
      setLoadingMessages(true);
      const response = await AxiosInstance.get(`/groupchat/${selectedGroup.id}/messages`, {
        params: { limit: 100 },
      });
      const fetchedMessages = response.data.messages || [];
      setMessages(fetchedMessages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      if (error.response?.status !== 403) {
        toast.error(error.response?.data?.msg || "Gagal mengambil messages");
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const isUserMember = useMemo(() => {
    if (!selectedGroup || !userId) return false;
    if (!selectedGroup.members || !Array.isArray(selectedGroup.members)) return false;
    return selectedGroup.members.some((m) => m.userId === userId);
  }, [selectedGroup, userId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!messageInput.trim() && !selectedMedia) || !socket || !selectedGroup) return;

    if (!isUserMember) {
      toast.error("Anda harus bergabung ke grup terlebih dahulu untuk mengirim pesan");
      return;
    }

      if (socket && selectedGroup) {
      socket.emit("stop-typing", { groupId: selectedGroup.id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    try {
      setSending(true);

      if (selectedMedia) {
        await handleUploadAndSendMedia(selectedMedia);
      } else {
        const messageContent = messageInput.trim();
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
          id: tempId,
          content: messageContent,
          type: "text",
          createdAt: new Date().toISOString(),
          user: {
            id: userId!,
            name: currentUserProfile?.name || "You",
            profilePicture: currentUserProfile?.profilePicture || null,
          },
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setMessageInput("");

        socket.emit("send-message", {
          groupId: selectedGroup.id,
          content: messageContent,
          type: "text",
        });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Gagal mengirim pesan");
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
    } finally {
      setSending(false);
    }
  };

  const handleUploadAndSendMedia = useCallback(async (media: { type: "image" | "video" | "audio"; file: File }) => {
    if (!socket || !selectedGroup) return;

    if (!isUserMember) {
      toast.error("Anda harus bergabung ke grup terlebih dahulu untuk mengirim pesan");
      setSelectedMedia(null);
      return;
    }

    try {
      setUploadingMedia(true);
      const formData = new FormData();
      formData.append("media", media.file);

      const response = await AxiosInstance.post("/upload/chat-media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Optimistic UI update - add message immediately
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        content: messageInput.trim() || "",
        type: media.type,
        mediaUrl: response.data.url,
        mediaThumbnail: response.data.thumbnail || null,
        createdAt: new Date().toISOString(),
        user: {
          id: userId!,
          name: currentUserProfile?.name || "You",
          profilePicture: currentUserProfile?.profilePicture || null,
        },
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setMessageInput("");
      setSelectedMedia(null);

      socket.emit("send-message", {
        groupId: selectedGroup.id,
        content: messageInput.trim() || "",
        type: media.type,
        mediaUrl: response.data.url,
        mediaThumbnail: response.data.thumbnail || null,
      });

      toast.success("Media berhasil dikirim");
    } catch (error: any) {
      console.error("Error uploading media:", error);
      toast.error("Gagal upload media");
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
    } finally {
      setUploadingMedia(false);
    }
  }, [socket, selectedGroup, messageInput, userId, isUserMember]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setSelectedMedia({
        type: "image",
        file,
        preview: URL.createObjectURL(file),
      });
    } else if (file.type.startsWith("video/")) {
      setSelectedMedia({
        type: "video",
        file,
        preview: URL.createObjectURL(file),
      });
    } else {
      toast.error("File tidak didukung. Gunakan image atau video.");
    }
  }, []);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });
        setSelectedMedia({
          type: "audio",
          file: audioFile,
        });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingAudio(true);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      toast.error("Gagal memulai recording audio");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && recordingAudio) {
      mediaRecorderRef.current.stop();
      setRecordingAudio(false);
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoStreamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: "video/webm" });
        const videoFile = new File([videoBlob], "video.webm", { type: "video/webm" });
        setSelectedMedia({
          type: "video",
          file: videoFile,
          preview: URL.createObjectURL(videoBlob),
        });
        stream.getTracks().forEach((track) => track.stop());
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingVideo(true);
    } catch (error) {
      console.error("Error starting video recording:", error);
      toast.error("Gagal memulai recording video");
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && recordingVideo) {
      mediaRecorderRef.current.stop();
      setRecordingVideo(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Nama group harus diisi");
      return;
    }

    try {
      setCreatingGroup(true);
      const response = await AxiosInstance.post("/groupchat", {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        isPublic: newGroupIsPublic,
      });

      const newGroup = response.data.groupChat;
      setGroupChats((prev) => [newGroup, ...prev]);
      setSelectedGroup(newGroup);
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupIsPublic(true);
      toast.success("Group chat berhasil dibuat!");
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast.error(error.response?.data?.msg || "Gagal membuat group chat");
    } finally {
      setCreatingGroup(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Blog</span>
            </Link>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gradient">Group Chat</h1>
                  <p className="text-muted-foreground">Komunitas JBlog dalam satu tempat</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={() => setShowExplore(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent/60 hover:bg-accent text-accent-foreground rounded-lg font-medium transition-colors"
                  title="Explore Groups"
                >
                  <Compass className="h-4 w-4" />
                  <span className="hidden md:inline">Explore</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                  title="Create Group"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">Buat Group</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 h-[calc(100vh-11rem)]">
            {/* Server rail ala Discord (desktop only) */}
            <aside className="hidden lg:flex flex-col items-center gap-3 w-20 py-4 mr-1 rounded-2xl bg-card/90 border border-border/60 shadow-xl">
              {/* JBlog home icon */}
              <Link
                href="/"
                className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:rounded-3xl transition-all"
                title="Kembali ke Home"
              >
                J+
              </Link>
              <div className="w-8 border-t border-border/40 my-2" />
              {/* Group icons */}
              <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-border/60 scrollbar-track-transparent">
                {groupChats.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden transition-all ${
                      selectedGroup?.id === group.id
                        ? "bg-primary/90 shadow-lg shadow-primary/30 scale-105"
                        : "bg-muted/60 hover:bg-accent/60 hover:rounded-3xl"
                    }`}
                    title={group.name}
                  >
                    {group.logo ? (
                      <Image
                        src={group.logo}
                        alt={group.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-primary">
                        {group.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setShowExplore(true)}
                  className="mt-1 flex items-center justify-center w-10 h-10 rounded-2xl border border-dashed border-border/70 text-muted-foreground hover:border-primary/60 hover:text-primary hover:rounded-3xl transition-all"
                  title="Explore Groups"
                >
                  <Compass className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-2xl border border-dashed border-border/70 text-muted-foreground hover:border-primary/60 hover:text-primary hover:rounded-3xl transition-all"
                  title="Buat Group"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </aside>

            {/* Main columns (list + chat) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
              {/* Group List - mobile / small sidebar */}
              {!selectedGroup && (
                <div className="block lg:hidden bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 overflow-y-auto shadow-lg overscroll-contain" data-lenis-prevent="true">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-gradient">Group Chats</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowExplore(true)}
                        className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
                        title="Explore Groups"
                      >
                        <Compass className="h-5 w-5 text-foreground" />
                      </button>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
                        title="Create Group"
                      >
                        <Plus className="h-5 w-5 text-foreground" />
                      </button>
                    </div>
                  </div>

                  {loadingGroups ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : groupChats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Tidak ada group chat
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupChats.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => setSelectedGroup(group)}
                          className="w-full text-left p-3 rounded-lg transition-colors hover:bg-accent/50 text-foreground"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                              {group.logo ? (
                                <Image
                                  src={group.logo}
                                  alt={group.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <MessageCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm mb-1 truncate">{group.name}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{group._count?.members || 0} members</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Chat Area */}
              <div
                className={`${
                  selectedGroup 
                    ? "col-span-1 lg:col-span-4" 
                    : "hidden lg:flex lg:col-span-4"
                } flex flex-col bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-lg h-full min-h-0`}
              >
              {selectedGroup ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border/50">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="lg:hidden mb-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      title="Back to Groups"
                    >
                      <ArrowLeft className="h-5 w-5 text-foreground" />
                    </button>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                          {selectedGroup.logo ? (
                            <Image
                              src={selectedGroup.logo}
                              alt={selectedGroup.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <MessageCircle className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gradient truncate">{selectedGroup.name}</h3>
                          {selectedGroup.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {selectedGroup.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{selectedGroup._count?.members || selectedGroup.members?.length || 0} members</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowMembers(true)}
                          className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
                          title="Members"
                        >
                          <Users className="h-5 w-5 text-foreground" />
                        </button>
                        {(isAdmin || isCreator) && (
                          <button
                            onClick={() => {
                              setEditingName(selectedGroup.name);
                              setEditingDescription(selectedGroup.description || "");
                              setShowSettings(true);
                            }}
                            className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
                            title="Settings"
                          >
                            <Settings className="h-5 w-5 text-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 overscroll-contain"
                    data-lenis-prevent="true"
                    style={{ 
                      WebkitOverflowScrolling: 'touch',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    {loadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground text-sm">Memuat pesan...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-muted-foreground text-lg font-medium mb-2">Belum ada pesan</p>
                        <p className="text-muted-foreground/70 text-sm">Mulai percakapan dengan mengirim pesan pertama!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                      const isOwnMessage = message.user.id === userId;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 items-start ${isOwnMessage ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-10 h-10 flex-shrink-0">
                            <Image
                              src={
                                message.user.profilePicture ||
                                generateAvatarUrl(message.user.name)
                              }
                              alt={message.user.name}
                              width={40}
                              height={40}
                              className="rounded-full w-10 h-10 object-cover"
                            />
                          </div>
                          <div className={`flex-1 ${isOwnMessage ? "flex flex-col items-end max-w-[70%]" : ""}`}>
                            {!isOwnMessage && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{message.user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.createdAt).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                            {isOwnMessage && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.createdAt).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                            <div
                              className={`inline-block px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? "bg-primary/10 border border-primary/20"
                                  : "bg-muted/50 border border-border/50"
                              }`}
                            >
                              {message.type === "image" && message.mediaUrl && (
                                <div className="mb-2 cursor-pointer" onClick={() => setViewingImage(message.mediaUrl!)}>
                                  <Image
                                    src={message.mediaUrl}
                                    alt="Shared image"
                                    width={300}
                                    height={300}
                                    className="rounded-lg max-w-full h-auto hover:opacity-90 transition-opacity"
                                    unoptimized
                                  />
                                </div>
                              )}
                              {message.type === "video" && message.mediaUrl && (
                                <div className="mb-2">
                                  <video
                                    src={message.mediaUrl}
                                    controls
                                    className="rounded-lg max-w-full h-auto max-h-96"
                                  />
                                </div>
                              )}
                              {message.type === "audio" && message.mediaUrl && (
                                <div className="mb-2">
                                  <audio src={message.mediaUrl} controls className="w-full" />
                                </div>
                              )}
                              {message.content && (
                                <p className="text-foreground">
                                  {message.content.split(/(@[^\s@]+|@everyone)/g).map((part, idx) => {
                                    if (part.startsWith("@")) {
                                      const username = part.substring(1);
                                      const isEveryone = username.toLowerCase() === "everyone";
                                      const mentionedUser = isEveryone 
                                        ? null 
                                        : selectedGroup.members?.find(
                                            (m) => m.user?.name?.toLowerCase() === username.toLowerCase()
                                          );
                                      
                                      return (
                                        <span
                                          key={idx}
                                          className="text-primary font-semibold bg-primary/10 px-1 rounded cursor-pointer hover:bg-primary/20 transition-colors relative"
                                          onMouseEnter={(e) => {
                                            if (mentionHoverTimeoutRef.current) {
                                              clearTimeout(mentionHoverTimeoutRef.current);
                                            }
                                            
                                            const target = e.currentTarget;
                                            const rect = target.getBoundingClientRect();
                                            
                                            if (isEveryone) {
                                              setHoveredMention({
                                                username: "everyone",
                                                userId: "everyone",
                                                x: rect.left,
                                                y: rect.top,
                                              });
                                            } else if (mentionedUser?.user) {
                                              mentionHoverTimeoutRef.current = setTimeout(() => {
                                                const freshRect = target.getBoundingClientRect();
                                                setHoveredMention({
                                                  username: mentionedUser.user.name,
                                                  userId: mentionedUser.user.id,
                                                  x: freshRect.left,
                                                  y: freshRect.top - 10,
                                                });
                                              }, 300); // Delay untuk avoid flicker
                                            }
                                          }}
                                          onMouseLeave={() => {
                                            if (mentionHoverTimeoutRef.current) {
                                              clearTimeout(mentionHoverTimeoutRef.current);
                                            }
                                            setTimeout(() => setHoveredMention(null), 200);
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            if (mentionedUser?.user && mentionedUser.user.id !== userId) {
                                              router.push(`/users/${mentionedUser.user.id}`);
                                            }
                                          }}
                                        >
                                          {part}
                                        </span>
                                      );
                                    }
                                    return <span key={idx}>{part}</span>;
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }))}
                    {/* Typing Indicator */}
                    {typingUsers.size > 0 && (
                      <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="inline-block px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground">
                                {Array.from(typingUsers.values())
                                  .map((user) => user.name)
                                  .join(", ")}
                                {typingUsers.size === 1 ? " sedang mengetik" : " sedang mengetik"}
                              </span>
                              <div className="flex gap-1 ml-2">
                                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Media Preview */}
                  {selectedMedia && (
                    <div className="p-4 border-t border-border/50 bg-muted/30">
                      <div className="flex items-center gap-4">
                        {selectedMedia.type === "image" && selectedMedia.preview && (
                          <div className="relative">
                            <Image
                              src={selectedMedia.preview}
                              alt="Preview"
                              width={100}
                              height={100}
                              className="rounded-lg object-cover"
                            />
                            <button
                              onClick={() => {
                                if (selectedMedia.preview) URL.revokeObjectURL(selectedMedia.preview);
                                setSelectedMedia(null);
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:opacity-90"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {selectedMedia.type === "video" && selectedMedia.preview && (
                          <div className="relative">
                            <video
                              src={selectedMedia.preview}
                              className="w-32 h-32 rounded-lg object-cover"
                              controls={false}
                            />
                            <button
                              onClick={() => {
                                if (selectedMedia.preview) URL.revokeObjectURL(selectedMedia.preview);
                                setSelectedMedia(null);
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:opacity-90"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {selectedMedia.type === "audio" && (
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Mic className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Audio Recording</p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedMedia.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedMedia(null)}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <X className="h-5 w-5 text-destructive" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Video Recording Preview */}
                  {recordingVideo && (
                    <div className="p-4 border-t border-border/50 bg-muted/30">
                      <div className="relative">
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          muted
                          className="w-full max-h-64 rounded-lg bg-black"
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-destructive/80 text-white px-4 py-2 rounded-full">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                            <span className="text-sm font-medium">Recording...</span>
                          </div>
                          <button
                            onClick={stopVideoRecording}
                            className="p-3 bg-destructive text-destructive-foreground rounded-full hover:opacity-90"
                          >
                            <Pause className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t border-border/50">
                    <div className="flex gap-2">
                      {/* Media Buttons - Desktop: show all, Mobile: show + button */}
                      <div className="relative" ref={mediaMenuRef}>
                        {/* Mobile: Single + button */}
                        <button
                          type="button"
                          onClick={() => setShowMediaMenu(!showMediaMenu)}
                          disabled={uploadingMedia || recordingAudio || recordingVideo || !isUserMember}
                          className="md:hidden p-3 rounded-lg hover:bg-accent/50 transition-colors disabled:opacity-50"
                          title="Media Options"
                        >
                          <Plus className="h-5 w-5 text-foreground" />
                        </button>
                        
                        {/* Mobile: Media Menu Dropdown */}
                        {showMediaMenu && (
                          <div className="md:hidden absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[160px]">
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click();
                                setShowMediaMenu(false);
                              }}
                              disabled={uploadingMedia || recordingAudio || recordingVideo}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left disabled:opacity-50"
                            >
                              <ImageIcon className="h-5 w-5 text-foreground" />
                              <span className="text-foreground">Photo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                videoInputRef.current?.click();
                                setShowMediaMenu(false);
                              }}
                              disabled={uploadingMedia || recordingAudio || recordingVideo}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left disabled:opacity-50"
                            >
                              <Video className="h-5 w-5 text-foreground" />
                              <span className="text-foreground">Video</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (recordingAudio) {
                                  stopAudioRecording();
                                } else {
                                  startAudioRecording();
                                }
                                setShowMediaMenu(false);
                              }}
                              disabled={uploadingMedia || recordingVideo || !!selectedMedia}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left disabled:opacity-50 ${
                                recordingAudio ? "bg-destructive/10" : ""
                              }`}
                            >
                              <Mic className="h-5 w-5 text-foreground" />
                              <span className="text-foreground">{recordingAudio ? "Stop Audio" : "Audio"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (recordingVideo) {
                                  stopVideoRecording();
                                } else {
                                  startVideoRecording();
                                }
                                setShowMediaMenu(false);
                              }}
                              disabled={uploadingMedia || recordingAudio || !!selectedMedia}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left disabled:opacity-50 ${
                                recordingVideo ? "bg-destructive/10" : ""
                              }`}
                            >
                              <VideoIcon className="h-5 w-5 text-foreground" />
                              <span className="text-foreground">{recordingVideo ? "Stop Video" : "Video Record"}</span>
                            </button>
                          </div>
                        )}
                        
                        {/* Desktop: Show all buttons */}
                        <div className="hidden md:flex items-center gap-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingMedia || recordingAudio || recordingVideo || !isUserMember}
                            className="p-2 rounded-lg hover:bg-accent/50 transition-colors disabled:opacity-50"
                            title="Upload Photo"
                          >
                            <ImageIcon className="h-5 w-5 text-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            disabled={uploadingMedia || recordingAudio || recordingVideo || !isUserMember}
                            className="p-2 rounded-lg hover:bg-accent/50 transition-colors disabled:opacity-50"
                            title="Upload Video"
                          >
                            <Video className="h-5 w-5 text-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={recordingAudio ? stopAudioRecording : startAudioRecording}
                            disabled={uploadingMedia || recordingVideo || !!selectedMedia || !isUserMember}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              recordingAudio
                                ? "bg-destructive text-destructive-foreground"
                                : "hover:bg-accent/50"
                            }`}
                            title={recordingAudio ? "Stop Recording" : "Record Audio"}
                          >
                            <Mic className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={recordingVideo ? stopVideoRecording : startVideoRecording}
                            disabled={uploadingMedia || recordingAudio || !!selectedMedia || !isUserMember}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              recordingVideo
                                ? "bg-destructive text-destructive-foreground"
                                : "hover:bg-accent/50"
                            }`}
                            title={recordingVideo ? "Stop Recording" : "Record Video"}
                          >
                            <VideoIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Hidden file inputs for mobile */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <div className="flex-1 relative">
                        {!isUserMember && (
                          <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                            <p className="text-sm text-muted-foreground px-4 text-center">
                              Bergabung ke grup terlebih dahulu untuk mengirim pesan
                            </p>
                          </div>
                        )}
                        <input
                          ref={messageInputRef}
                          type="text"
                          value={messageInput}
                          onChange={handleMessageInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder={isUserMember ? "Tulis pesan... (ketik @ untuk mention)" : "Bergabung ke grup untuk mengirim pesan"}
                          className="w-full px-4 py-4 sm:py-3 text-base rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                          disabled={sending || !socket || uploadingMedia || !isUserMember}
                        />
                        
                        {/* Mention Suggestions */}
                        {showMentionSuggestions && getMentionSuggestions.length > 0 && (
                          <div className="absolute bottom-full left-0 mb-2 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                            {getMentionSuggestions.map((user, index) => {
                              const isEveryone = (user as any).isEveryone || false;
                              return (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => insertMention(user.name, isEveryone)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left ${
                                    index === selectedMentionIndex ? "bg-accent" : ""
                                  } ${isEveryone ? "border-b border-border/50" : ""}`}
                                >
                                  {isEveryone ? (
                                    <>
                                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-sm font-bold text-primary">
                                          @everyone
                                        </span>
                                        <p className="text-xs text-muted-foreground">
                                          Tag semua member
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                        <Image
                                          src={
                                            user.profilePicture ||
                                            generateAvatarUrl(user.name)
                                          }
                                          alt={user.name}
                                          width={32}
                                          height={32}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <span className="text-sm font-medium text-foreground">
                                        {user.name}
                                      </span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={
                          sending ||
                          !socket ||
                          uploadingMedia ||
                          (!messageInput.trim() && !selectedMedia) ||
                          recordingAudio ||
                          recordingVideo ||
                          !isUserMember
                        }
                        className="px-4 sm:px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
                        title={!isUserMember ? "Bergabung ke grup terlebih dahulu" : "Kirim pesan"}
                      >
                        {sending || uploadingMedia ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-foreground">Pilih Group Chat</h3>
                    <p className="text-muted-foreground mb-6">Pilih group chat untuk mulai chatting atau explore group chat baru</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setShowExplore(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-accent/50 hover:bg-accent text-accent-foreground rounded-lg font-medium transition-colors"
                      >
                        <Compass className="h-5 w-5" />
                        <span>Explore Groups</span>
                      </button>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Buat Group</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-md w-full relative">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setNewGroupName("");
                setNewGroupDescription("");
                setNewGroupIsPublic(true);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gradient">Buat Group Chat Baru</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nama Group <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Masukkan nama group"
                  className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                  required
                  disabled={creatingGroup}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Deskripsi group chat..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all shadow-sm"
                  disabled={creatingGroup}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={newGroupIsPublic}
                    onChange={(e) => setNewGroupIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-border/50 bg-card checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary cursor-pointer transition-all"
                    disabled={creatingGroup}
                  />
                  <span>Group Public (Semua orang bisa join)</span>
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  {newGroupIsPublic ? (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Group ini bisa diakses oleh semua user
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Hanya member yang diundang yang bisa akses
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName("");
                    setNewGroupDescription("");
                    setNewGroupIsPublic(true);
                  }}
                  disabled={creatingGroup}
                  className="flex-1 px-6 py-3 bg-muted/50 text-foreground rounded-lg font-medium hover:bg-accent/50 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !newGroupName.trim()}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {creatingGroup ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Membuat...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Buat Group</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explore Modal */}
      {showExplore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col relative">
            <button
              onClick={() => {
                setShowExplore(false);
                setSearchQuery("");
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gradient">Explore Group Chats</h2>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari group chat..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {loadingExplore ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : exploreGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Tidak ada group chat ditemukan
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {exploreGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-border/60 bg-card/70 hover:bg-accent/40 transition-all shadow-sm hover:shadow-lg overflow-hidden flex flex-col"
                    >
                      {/* Banner */}
                      <div className="relative w-full h-24 bg-gradient-to-r from-primary/20 via-background to-accent/20">
                        {group.banner ? (
                          <Image
                            src={group.banner}
                            alt={group.name}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                        {/* Logo bubble */}
                        <div className="absolute left-4 bottom-[-20px]">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center border border-border/80 shadow-md">
                            {group.logo ? (
                              <Image
                                src={group.logo}
                                alt={group.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <MessageCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pt-6 px-4 pb-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="pr-2">
                            <h3 className="font-semibold text-foreground truncate max-w-[150px]">
                              {group.name}
                            </h3>
                            {group.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {group.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{group._count?.members || 0}</span>
                              </div>
                              {group.isPublic ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <Globe className="h-3 w-3" />
                                  Public
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <Lock className="h-3 w-3" />
                                  Private
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground/80">
                              {group._count?.messages || 0} messages
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20">
                              <Crown className="h-3 w-3 text-primary" />
                              {group.creator?.name || "Creator"}
                            </span>
                          </div>
                          {group.isMember ? (
                            <button
                              onClick={() => {
                                setSelectedGroup(group);
                                setShowExplore(false);
                              }}
                              className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors"
                            >
                              Buka
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoinGroup(group.id)}
                              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                            >
                              Join
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && selectedGroup && (isAdmin || isCreator) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-md w-full relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gradient">Group Settings</h2>
            <div className="space-y-6">
              {/* Banner */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Banner (Explore)
                </label>
                <div className="space-y-3">
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-primary/5 border border-border/60 flex items-center justify-center">
                    {selectedGroup.banner ? (
                      <Image
                        src={selectedGroup.banner}
                        alt={selectedGroup.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Banner belum diatur – akan ditampilkan di kartu Explore
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadBanner(file);
                        }
                      }}
                      className="hidden"
                      id="banner-upload"
                      disabled={uploadingBanner}
                    />
                    <label
                      htmlFor="banner-upload"
                      className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors cursor-pointer inline-block disabled:opacity-50 text-sm"
                    >
                      {uploadingBanner ? "Uploading..." : "Upload Banner"}
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Disarankan rasio 3:1 (misal 1200x400) untuk tampilan terbaik.
                    </p>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Logo Group
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                    {selectedGroup.logo ? (
                      <Image
                        src={selectedGroup.logo}
                        alt={selectedGroup.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MessageCircle className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadLogo(file);
                        }
                      }}
                      className="hidden"
                      id="logo-upload"
                      disabled={uploadingLogo}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors cursor-pointer inline-block disabled:opacity-50 text-sm"
                    >
                      {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nama Group <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Masukkan nama group"
                  className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                  required
                  disabled={savingSettings}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Deskripsi</label>
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  placeholder="Deskripsi group chat..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all shadow-sm"
                  disabled={savingSettings}
                />
              </div>


              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  disabled={savingSettings}
                  className="flex-1 px-6 py-3 bg-muted/50 text-foreground rounded-lg font-medium hover:bg-accent/50 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateGroup}
                  disabled={savingSettings || !editingName.trim()}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && selectedGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-md w-full max-h-[80vh] flex flex-col relative">
            <button
              onClick={() => setShowMembers(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gradient">Members</h2>
            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Tidak ada members
                </div>
              ) : (
                members.map((member: any) => {
                  const isCurrentUser = member.userId === userId;
                  const canManage = (isAdmin || isCreator) && !isCurrentUser && member.userId !== selectedGroup.createdBy;
                  return (
                    <div
                      key={member.id}
                      className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={
                                member.user.profilePicture ||
                                generateAvatarUrl(member.user.name)
                              }
                              alt={member.user.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {member.user.name}
                              </span>
                              {member.userId === selectedGroup.createdBy && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                              {member.role === "admin" && member.userId !== selectedGroup.createdBy && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Joined {new Date(member.joinedAt).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            {member.role === "admin" && isCreator ? (
                              <button
                                onClick={() => handleDemoteMember(member.userId)}
                                className="p-2 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground"
                                title="Demote to Member"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            ) : member.role === "member" ? (
                              <>
                                <button
                                  onClick={() => handlePromoteMember(member.userId)}
                                  className="p-2 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground"
                                  title="Promote to Admin"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Yakin ingin menghapus member ini?")) {
                                      handleRemoveMember(member.userId);
                                    }
                                  }}
                                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                                  title="Remove Member"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* @everyone Warning Modal */}
      {showEveryoneWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-md w-full relative">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-2 text-gradient">Tag Everyone</h2>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Anda akan mengirim notifikasi ke semua member di grup ini
              </p>
            </div>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Peringatan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Fitur @everyone akan mengirim notifikasi ke semua member dalam grup. Gunakan dengan bijak dan hanya untuk informasi penting.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowEveryoneWarning(false);
                  setShowMentionSuggestions(false);
                }}
                className="flex-1 px-6 py-3 bg-muted/50 text-foreground rounded-lg font-medium hover:bg-accent/50 transition-colors shadow-sm hover:shadow-md"
              >
                Batal
              </button>
              <button
                onClick={confirmEveryoneMention}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
              >
                Ya, Tag Everyone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mention Hover Profile */}
      {hoveredMention && hoveredMention.userId !== "everyone" && (
        <div
          className="fixed z-[200] bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-4 min-w-[200px] max-w-[250px] pointer-events-none"
          style={{
            left: `${hoveredMention.x}px`,
            top: `${hoveredMention.y - 120}px`,
            transform: "translateX(-50%)",
          }}
          onMouseEnter={() => {
            if (mentionHoverTimeoutRef.current) {
              clearTimeout(mentionHoverTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            setHoveredMention(null);
          }}
        >
          {(() => {
            const mentionedUser = selectedGroup?.members?.find(
              (m) => m.user?.id === hoveredMention.userId
            )?.user;
            
            if (!mentionedUser) return null;
            
            return (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <Image
                    src={
                      mentionedUser.profilePicture ||
                      generateAvatarUrl(mentionedUser.name)
                    }
                    alt={mentionedUser.name}
                    width={64}
                    height={64}
                    className="rounded-full w-16 h-16 object-cover border-2 border-primary/20"
                  />
                </div>
                <h4 className="font-bold text-lg text-foreground mb-1">
                  {mentionedUser.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  @{mentionedUser.name.toLowerCase().replace(/\s+/g, "")}
                </p>
                <Link
                  href={`/users/${mentionedUser.id}`}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoveredMention(null);
                  }}
                >
                  Lihat Profile
                </Link>
              </div>
            );
          })()}
        </div>
      )}

      {/* @everyone Hover Info */}
      {hoveredMention && hoveredMention.userId === "everyone" && (
        <div
          className="fixed z-[200] bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-4 min-w-[200px] max-w-[250px] pointer-events-none"
          style={{
            left: `${hoveredMention.x}px`,
            top: `${hoveredMention.y - 80}px`,
            transform: "translateX(-50%)",
          }}
          onMouseEnter={() => {
            if (mentionHoverTimeoutRef.current) {
              clearTimeout(mentionHoverTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            setHoveredMention(null);
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-bold text-lg text-foreground mb-1">
              @everyone
            </h4>
            <p className="text-xs text-muted-foreground">
              Tag semua member dalam grup ini (
              {selectedGroup?._count?.members ||
                selectedGroup?.members?.length ||
                0}{" "}
              members)
            </p>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewer
        imageUrl={viewingImage}
        onClose={() => setViewingImage(null)}
        alt="Group chat image"
      />
    </div>
  );
}
