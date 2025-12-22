"use client";

import Image from "next/image";
import { X, Loader2, Crown, UserPlus, UserMinus } from "lucide-react";
import { GroupChat } from "../types";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
}

interface MembersModalProps {
  show: boolean;
  selectedGroup: GroupChat | null;
  members: Member[];
  loadingMembers: boolean;
  userId: string | null;
  isAdmin: boolean;
  isCreator: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MembersModal({
  show,
  selectedGroup,
  members,
  loadingMembers,
  userId,
  isAdmin,
  isCreator,
  onClose,
  onUpdate,
}: MembersModalProps) {
  if (!show || !selectedGroup) return null;

  const handlePromoteMember = async (memberUserId: string) => {
    if (!selectedGroup) return;

    try {
      await AxiosInstance.post(`/groupchat/${selectedGroup.id}/members/${memberUserId}/promote`);
      toast.success("Member berhasil di-promote menjadi admin");
      onUpdate();
    } catch (error: any) {
      console.error("Error promoting member:", error);
      toast.error(error.response?.data?.msg || "Gagal promote member");
    }
  };

  const handleDemoteMember = async (memberUserId: string) => {
    if (!selectedGroup) return;

    try {
      await AxiosInstance.post(`/groupchat/${selectedGroup.id}/members/${memberUserId}/demote`);
      toast.success("Admin berhasil di-demote menjadi member");
      onUpdate();
    } catch (error: any) {
      console.error("Error demoting member:", error);
      toast.error(error.response?.data?.msg || "Gagal demote member");
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!selectedGroup) return;

    try {
      await AxiosInstance.delete(`/groupchat/${selectedGroup.id}/members/${memberUserId}`);
      toast.success("Member berhasil dihapus");
      onUpdate();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.response?.data?.msg || "Gagal hapus member");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-md w-full max-h-[80vh] flex flex-col relative">
        <button
          onClick={onClose}
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
            members.map((member) => {
              const isCurrentUser = member.userId === userId;
              const canManage =
                (isAdmin || isCreator) &&
                !isCurrentUser &&
                member.userId !== selectedGroup.createdBy;
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
                          {member.role === "admin" &&
                            member.userId !== selectedGroup.createdBy && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                Admin
                              </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString("id-ID")}
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
                                if (
                                  confirm("Yakin ingin menghapus member ini?")
                                ) {
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
  );
}

