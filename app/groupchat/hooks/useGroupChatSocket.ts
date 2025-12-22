import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import AxiosInstance, { getSocketUrl } from "@/utils/api";
import toast from "react-hot-toast";
import { Message, GroupChat, TypingUser } from "../types";

interface UseGroupChatSocketProps {
  selectedGroup: GroupChat | null;
  authenticated: boolean;
  userId: string | null;
  onNewMessage: (message: Message) => void;
  onUserJoined: (data: { userId: string; userName: string }) => void;
  onUserTyping: (data: { userId: string; userName: string }) => void;
  onUserStopTyping: (data: { userId: string }) => void;
  onMessageRead: (data: { messageId: string; userId: string; readAt: string }) => void;
  onTypingUsersChange: (users: Map<string, TypingUser>) => void;
}

export function useGroupChatSocket({
  selectedGroup,
  authenticated,
  userId,
  onNewMessage,
  onUserJoined,
  onUserTyping,
  onUserStopTyping,
  onMessageRead,
  onTypingUsersChange,
}: UseGroupChatSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const router = useRouter();

  const setupSocketHandlers = useCallback((socketInstance: Socket) => {
    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket");
      if (selectedGroup) {
        socketInstance.emit("join-group", selectedGroup.id);
      }
    });

    socketInstance.on("new-message", async (message: Message) => {
      onNewMessage(message);
    });

    socketInstance.on("user-joined", (data: { userId: string; userName: string }) => {
      if (data.userId !== userId) {
        toast.success(`${data.userName} bergabung ke chat`);
      }
      onUserJoined(data);
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
              onTypingUsersChange(updated);
              return updated;
            });
          }, 3000);
          newMap.set(data.userId, { name: data.userName, timeout });
          onTypingUsersChange(newMap);
          return newMap;
        });
        onUserTyping(data);
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
          onTypingUsersChange(newMap);
          return newMap;
        });
        onUserStopTyping(data);
      }
    });

    socketInstance.on("messageRead", (data: { messageId: string; userId: string; readAt: string }) => {
      onMessageRead(data);
    });
  }, [selectedGroup, userId, onNewMessage, onUserJoined, onUserTyping, onUserStopTyping, onMessageRead, onTypingUsersChange, router]);

  const connectSocket = useCallback(async () => {
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

      const socketUrl = getSocketUrl();

      if (socket) {
        socket.disconnect();
        setSocket(null);
      }

      const newSocket = io(socketUrl, {
        auth: { token },
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
  }, [selectedGroup, authenticated, socket, setupSocketHandlers, router]);

  useEffect(() => {
    if (selectedGroup && authenticated) {
      connectSocket();
    }

    return () => {
      if (socket && selectedGroup) {
        socket.emit("leave-group", selectedGroup.id);
        socket.disconnect();
      }
      typingUsers.forEach((user) => {
        clearTimeout(user.timeout);
      });
      setTypingUsers(new Map());
    };
  }, [selectedGroup, authenticated]);

  const emitTyping = useCallback((groupId: string) => {
    if (socket) {
      socket.emit("typing", { groupId });
    }
  }, [socket]);

  const emitStopTyping = useCallback((groupId: string) => {
    if (socket) {
      socket.emit("stop-typing", { groupId });
    }
  }, [socket]);

  const emitSendMessage = useCallback((data: {
    groupId: string;
    content?: string;
    type: string;
    mediaUrl?: string;
    mediaThumbnail?: string;
  }) => {
    if (socket) {
      socket.emit("send-message", data);
    }
  }, [socket]);

  return {
    socket,
    typingUsers,
    emitTyping,
    emitStopTyping,
    emitSendMessage,
  };
}

