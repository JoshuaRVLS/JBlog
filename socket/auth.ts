import type { Server } from "socket.io";
import { verify } from "../lib/jwt";
import db from "../lib/db";

export function setupSocketAuth(io: Server): void {
  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const userId = await verify(token);
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, profilePicture: true },
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.userId = user.id;
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });
}

