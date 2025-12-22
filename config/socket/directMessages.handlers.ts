import type { Socket, Server } from "socket.io";
import db from "../../lib/db";
import { createNotification } from "../../controllers/notifications.controller";

export function setupDirectMessageHandlers(socket: Socket, io: Server): void {
  // Listen for new direct message events from HTTP handlers
  // This is handled by the directMessages controller, but we can add real-time features here if needed
}

