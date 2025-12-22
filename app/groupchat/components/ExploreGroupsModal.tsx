"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Loader2,
  Search,
  Users,
  Globe,
  Lock,
  Crown,
  MessageCircle,
} from "lucide-react";
import { GroupChat } from "../types";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

interface ExploreGroupsModalProps {
  show: boolean;
  userId: string | null;
  onClose: () => void;
  onSelectGroup: (group: GroupChat) => void;
  onJoinGroup: (groupId: string) => void;
}

export default function ExploreGroupsModal({
  show,
  userId,
  onClose,
  onSelectGroup,
  onJoinGroup,
}: ExploreGroupsModalProps) {
  const [exploreGroups, setExploreGroups] = useState<GroupChat[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (show) {
      fetchExploreGroups();
    }
  }, [show, searchQuery]);

  const fetchExploreGroups = async () => {
    try {
      setLoadingExplore(true);
      const response = await AxiosInstance.get("/groupchat/explore", {
        params: { search: searchQuery || undefined },
      });
      setExploreGroups(response.data.groupChats || []);
    } catch (error: any) {
      console.error("Error fetching explore groups:", error);
      toast.error("Gagal mengambil group chats");
    } finally {
      setLoadingExplore(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col relative">
        <button
          onClick={() => {
            onClose();
            setSearchQuery("");
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gradient">
          Explore Group Chats
        </h2>
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
                            onSelectGroup(group);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors"
                        >
                          Buka
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onJoinGroup(group.id);
                            onClose();
                          }}
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
  );
}

