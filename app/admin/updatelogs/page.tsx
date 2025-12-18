"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { GitBranch, RefreshCw, Trash2, Loader2, ExternalLink, Calendar, User } from "lucide-react";
import toast from "react-hot-toast";
import AdminLoading from "@/components/AdminLoading";

export default function AdminUpdateLogs() {
  const { userId, authenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (userId) {
      fetchData();
    }
  }, [userId, authenticated, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await AxiosInstance.get(`/users/${userId}`);
      setUser(userRes.data);

      if (!userRes.data.isAdmin && !userRes.data.isOwner) {
        toast.error("Akses ditolak. Perlu akses admin.");
        router.push("/dashboard");
        return;
      }

      await fetchLogs();
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403) {
        toast.error("Akses ditolak. Perlu akses admin.");
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await AxiosInstance.get("/updatelog/?limit=100");
      setLogs(response.data.logs || []);
    } catch (error: any) {
      console.error("Error fetching update logs:", error);
      toast.error("Gagal mengambil update logs");
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await AxiosInstance.post("/updatelog/sync");
      toast.success(response.data.msg || `Berhasil sync ${response.data.synced || 0} update logs`);
      await fetchLogs();
    } catch (error: any) {
      console.error("Error syncing:", error);
      const errorMsg = error.response?.data?.msg || error.response?.data?.error || "Gagal sync dari GitHub";
      const instructions = error.response?.data?.instructions;
      
      if (error.response?.data?.error === "GITHUB_TOKEN_MISSING") {
        toast.error(
          <div>
            <p className="font-semibold">{errorMsg}</p>
            {instructions && <p className="text-xs mt-1">{instructions}</p>}
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(errorMsg, { duration: 5000 });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus update log ini?")) return;

    try {
      await AxiosInstance.delete(`/updatelog/${id}`);
      toast.success("Update log berhasil dihapus");
      await fetchLogs();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Gagal menghapus update log");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <AdminLoading />
        </div>
      </div>
    );
  }

  if (!user?.isAdmin && !user?.isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Update Logs</h1>
              <p className="text-muted-foreground">
                Sync dan kelola update logs dari GitHub commits
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  <span>Sync dari GitHub</span>
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <GitBranch className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Cara Sync dari GitHub</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Sistem akan otomatis fetch commits dari branch <code className="bg-muted px-1 rounded">main</code>, <code className="bg-muted px-1 rounded">backend</code>, dan <code className="bg-muted px-1 rounded">frontend</code>, lalu menggabungkannya. Format commit yang didukung:
                </p>
                <ul className="text-sm text-muted-foreground mb-3 space-y-1 list-disc list-inside">
                  <li>Conventional Commits: <code className="bg-muted px-1 rounded">feat: add new feature</code></li>
                  <li>Version tags: <code className="bg-muted px-1 rounded">v1.0.0</code> atau <code className="bg-muted px-1 rounded">version 1.0.0</code></li>
                  <li>Changes list dengan <code className="bg-muted px-1 rounded">-</code> atau <code className="bg-muted px-1 rounded">*</code></li>
                </ul>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-3">
                  <p className="text-xs font-semibold mb-1 text-amber-600 dark:text-amber-400">⚠️ Setup Required:</p>
                  <p className="text-xs text-muted-foreground mb-1">
                    Tambahkan <code className="bg-background px-1 rounded text-xs">GITHUB_TOKEN</code> di file <code className="bg-background px-1 rounded text-xs">backend/.env</code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dapatkan token dari: GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logs List */}
          {logs.length === 0 ? (
            <div className="text-center py-16">
              <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-xl text-muted-foreground mb-2">Belum ada update logs</p>
              <p className="text-sm text-muted-foreground mb-4">
                Klik tombol "Sync dari GitHub" untuk mengambil commits terbaru
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    <span>Sync dari GitHub</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{log.title}</h3>
                        {log.version && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-sm font-medium">
                            v{log.version}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {log.author && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{log.author}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(log.date || log.createdAt).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        {log.commitHash && (
                          <span className="font-mono text-xs">
                            {log.commitHash.substring(0, 7)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.commitUrl && (
                        <a
                          href={log.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="View on GitHub"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                      {log.description && (
                        <div className="mb-3">
                          <p className="text-muted-foreground leading-relaxed">
                            {log.description.replace(/\[(?:Branch|Branches):[^\]]+\]/g, "").trim()}
                          </p>
                          {/* Extract and display branch info if present */}
                          {log.description.includes("[Branch:") || log.description.includes("[Branches:") ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {log.description.match(/\[(?:Branch|Branches):\s*([^\]]+)\]/)?.[1]?.split(",").map((branch: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium"
                                >
                                  {branch.trim()}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}
                  {log.changes && log.changes.length > 0 && (
                    <ul className="space-y-2 mt-4">
                      {log.changes.map((change: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

