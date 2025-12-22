"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, User, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import AxiosInstance from "@/utils/api";

interface Version {
  id: string;
  title: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    profilePicture: string | null;
  } | null;
}

interface PostVersionsSidebarProps {
  postId: string;
  versions: Version[];
  loadingVersions: boolean;
  restoringVersionId: string | null;
  onVersionRestore: (version: Version) => void;
  onVersionsChange: (versions: Version[]) => void;
}

export default function PostVersionsSidebar({
  postId,
  versions,
  loadingVersions,
  restoringVersionId,
  onVersionRestore,
  onVersionsChange,
}: PostVersionsSidebarProps) {
  const [showSidebar, setShowSidebar] = useState(false);

  const handleRestoreVersion = async (versionId: string) => {
    if (!postId) return;
    try {
      const response = await AxiosInstance.post(`/posts/${postId}/versions/${versionId}/restore`);
      const post = response.data?.post;
      if (post) {
        onVersionRestore({
          id: versionId,
          title: post.title,
          createdAt: new Date().toISOString(),
          createdBy: null,
        });
        toast.success("Post berhasil direstore ke versi terpilih");
      } else {
        toast.success("Post berhasil direstore");
      }
    } catch (error: any) {
      console.error("Error restoring post version:", error);
      toast.error(error.response?.data?.error || "Gagal merestore versi post");
    }
  };

  return (
    <>
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed right-4 top-24 z-40 p-3 bg-card border border-border rounded-lg shadow-lg hover:bg-accent transition-colors"
        title="Post Versions"
      >
        <Clock className="h-5 w-5" />
      </button>

      {showSidebar && (
        <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Post Versions</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {loadingVersions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No versions available
              </p>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {version.createdBy?.profilePicture ? (
                        <Image
                          src={version.createdBy.profilePicture}
                          alt={version.createdBy.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{version.title}</p>
                        {version.createdBy && (
                          <p className="text-xs text-muted-foreground">
                            {version.createdBy.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(version.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        disabled={restoringVersionId === version.id}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {restoringVersionId === version.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

