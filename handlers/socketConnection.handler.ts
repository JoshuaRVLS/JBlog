import type { Server, Socket } from "socket.io";
import { setupGroupChatHandlers } from "./groupChat.socket";

export function setupSocketConnection(io: Server, socket: Socket): void {
  console.log(`User connected: ${socket.data.user.name} (${socket.data.userId})`);
  console.log(`Socket ID: ${socket.id}, Joined room: user:${socket.data.userId}`);
  
  // Join room untuk notifikasi user
  socket.join(`user:${socket.data.userId}`);
  console.log(`User ${socket.data.userId} joined room user:${socket.data.userId}`);

  // Setup group chat handlers
  setupGroupChatHandlers(io, socket);

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.user.name}`);
  });
}

