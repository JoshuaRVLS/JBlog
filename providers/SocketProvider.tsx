"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { io, Socket } from "socket.io-client";
import AxiosInstance, { getSocketUrl } from "@/utils/api";
import { AuthContext } from "./AuthProvider";

interface SocketContextValue {
  socket: Socket | null;
}

export const SocketContext = createContext<SocketContextValue>({
  socket: null,
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: PropsWithChildren) {
  const { authenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState<Socket | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    const setupSocket = async () => {
      if (!authenticated || initializingRef.current || socket) {
        if (!authenticated && socket) {
          socket.disconnect();
          setSocket(null);
        }
        return;
      }

      try {
        initializingRef.current = true;

        const response = await AxiosInstance.get("/auth/socket-token");
        const token = response.data.token;
        if (!token) {
          initializingRef.current = false;
          return;
        }

        const socketUrl = getSocketUrl();

        const newSocket = io(socketUrl, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
        });

        newSocket.on("connect", () => {
          console.log("✅ Global Socket connected");
        });

        newSocket.on("disconnect", () => {
          console.log("❌ Global Socket disconnected");
        });

        setSocket(newSocket);
      } catch (error) {
        console.error("❌ Error setting up global socket:", error);
      } finally {
        initializingRef.current = false;
      }
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [authenticated]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}


