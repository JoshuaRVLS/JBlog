"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Loader2, MessageCircle } from "lucide-react";
import { GroupChat } from "../types";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

interface SettingsModalProps {
  show: boolean;
  selectedGroup: GroupChat | null;
  isAdmin: boolean;
  isCreator: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function SettingsModal({
  show,
  selectedGroup,
  isAdmin,
  isCreator,
  onClose,
  onUpdate,
}: SettingsModalProps) {
  const [editingName, setEditingName] = useState(selectedGroup?.name || "");
  const [editingDescription, setEditingDescription] = useState(
    selectedGroup?.description || ""
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (selectedGroup) {
      setEditingName(selectedGroup.name || "");
      setEditingDescription(selectedGroup.description || "");
    }
  }, [selectedGroup]);

  if (!show || !selectedGroup || (!isAdmin && !isCreator)) return null;

  const handleUploadBanner = async (file: File) => {
    if (!selectedGroup) return;

    try {
      setUploadingBanner(true);
      const formData = new FormData();
      formData.append("banner", file);

      await AxiosInstance.post(
        `/upload/group-banner/${selectedGroup.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Banner berhasil diupload");
      onUpdate();
    } catch (error: any) {
      console.error("Error uploading banner:", error);
      toast.error("Gagal upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    if (!selectedGroup) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", file);

      await AxiosInstance.post(
        `/upload/group-logo/${selectedGroup.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Logo berhasil diupload");
      onUpdate();
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Gagal upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !editingName.trim()) return;

    try {
      setSavingSettings(true);
      await AxiosInstance.put(`/groupchat/${selectedGroup.id}`, {
        name: editingName.trim(),
        description: editingDescription.trim() || null,
      });

      toast.success("Group berhasil diupdate");
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error updating group:", error);
      toast.error(error.response?.data?.msg || "Gagal update group");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg max-w-md w-full relative">
        <button
          onClick={onClose}
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
                    Banner belum diatur
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
                  Disarankan rasio 3:1 (misal 1200x400)
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
            <label className="text-sm font-medium text-foreground">
              Deskripsi
            </label>
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
              onClick={onClose}
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
  );
}

