"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bell, Heart, MessageCircle, AtSign, X } from "lucide-react";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { useSocket } from "@/providers/SocketProvider";

interface Notification {
  id: string;
  type: "like" | "comment" | "reply" | "mention" | "direct_message";
  actor: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  actors?: Array<{
    id: string;
    name: string;
    profilePicture: string | null;
  }>;
  count?: number;
  post?: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  comment?: {
    id: string;
    content: string;
  };
  groupChat?: {
    id: string;
    name: string;
  };
  read: boolean;
  createdAt: string;
}

export default function NotificationsDropdown() {
  const { authenticated, userId } = useContext(AuthContext);
  const { socket } = useSocket();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authenticated || !userId) return;

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();
  }, [authenticated, userId]);

  // Socket listeners using global socket (single connection)
  useEffect(() => {
    if (!authenticated || !userId || !socket) return;

    const handleNewNotification = () => {
      fetchNotifications();
      fetchUnreadCount();
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [authenticated, userId, socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get("/notifications?limit=20");
      setNotifications(response.data.notifications || []);
    } catch (error) {
      const anyError = error as any;
      const status = anyError?.response?.status;
      // Kalau token sudah expired / belum valid, jangan spam error, cukup kosongkan data
      if (status === 401) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await AxiosInstance.get("/notifications/unread-count");
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      const anyError = error as any;
      const status = anyError?.response?.status;
      if (status === 401) {
        // Kalau belum login / token invalid, anggap tidak ada unread
        setUnreadCount(0);
        return;
      }
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await AxiosInstance.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await AxiosInstance.put("/notifications/all/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "comment":
      case "reply":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case "direct_message":
        return <MessageCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const { type, actor, actors, count, post, groupChat } = notification;

    if (type === "like" && count && count > 1 && actors) {
      const firstActor = actors[0];
      const othersCount = count - 1;
      return (
        <>
          <strong>{firstActor.name}</strong>
          {othersCount > 0 && ` dan ${othersCount} lainnya`} menyukai{" "}
          {post && <strong>postinganmu</strong>}
        </>
      );
    }

    if (type === "comment" && post) {
      return (
        <>
          <strong>{actor.name}</strong> mengomentari{" "}
          <strong>postinganmu</strong>
        </>
      );
    }

    if (type === "reply" && post) {
      return (
        <>
          <strong>{actor.name}</strong> membalas{" "}
          <strong>komentar</strong> di postinganmu
        </>
      );
    }

    if (type === "mention" && groupChat) {
      return (
        <>
          <strong>{actor.name}</strong> menyebutkan kamu di{" "}
          <strong>{groupChat.name}</strong>
        </>
      );
    }

    if (type === "direct_message") {
      return (
        <>
          <strong>{actor.name}</strong> mengirimkan pesan ke kamu
        </>
      );
    }

    return <strong>{actor.name}</strong>;
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.post) {
      return `/posts/${notification.post.id}`;
    }
    if (notification.groupChat) {
      return `/groupchat?group=${notification.groupChat.id}`;
    }
    if (notification.type === "direct_message") {
      // Buka DM dengan actor (pengirim pesan)
      return `/messages?userId=${notification.actor.id}`;
    }
    return "#";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!authenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground/60" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 px-2 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:z-50 sm:px-0">
          <div className="mx-auto w-full max-w-lg sm:mx-0 sm:w-96 max-h-[70vh] rounded-lg border border-border bg-card shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Notifikasi</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs sm:text-sm text-primary hover:underline"
                  >
                    Tandai semua sudah dibaca
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Memuat...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Tidak ada notifikasi
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const link = getNotificationLink(notification);
                    const isUnread = !notification.read;
                    const mainActor =
                      notification.actors?.[0] || notification.actor;

                    return (
                      <Link
                        key={notification.id}
                        href={link}
                        onClick={() => {
                          if (isUnread) {
                            markAsRead(notification.id);
                          }
                          setIsOpen(false);
                        }}
                        className={`block p-4 hover:bg-accent/50 transition-colors ${
                          isUnread ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Actor Avatar(s) */}
                          <div className="relative flex-shrink-0">
                            {notification.actors &&
                            notification.actors.length > 1 ? (
                              <div className="flex -space-x-2">
                                {notification.actors
                                  .slice(0, 2)
                                  .map((actor, idx) => (
                                    <div
                                      key={actor.id}
                                      className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-background"
                                      style={{ zIndex: 2 - idx }}
                                    >
                                      <Image
                                        src={
                                          actor.profilePicture ||
                                          generateAvatarUrl(actor.name)
                                        }
                                        alt={actor.name}
                                        width={40}
                                        height={40}
                                        sizes="40px"
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="h-10 w-10 overflow-hidden rounded-full">
                                <Image
                                  src={
                                    mainActor.profilePicture ||
                                    generateAvatarUrl(mainActor.name)
                                  }
                                  alt={mainActor.name}
                                  width={40}
                                  height={40}
                                  sizes="40px"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-background bg-card p-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>

                          {/* Notification Content */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground">
                              {getNotificationText(notification)}
                            </p>
                            {notification.post && (
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {notification.post.title}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(
                                notification.createdAt,
                              ).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          {/* Unread Indicator */}
                          {isUnread && (
                            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

