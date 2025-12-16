"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { ArrowLeft, Search, Shield, ShieldCheck, Trash2, User as UserIcon, Ban, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import AdminLoading from "@/components/AdminLoading";

export default function UserManagement() {
  const { userId, authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    fetchUsers();
  }, [page, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchQuery) params.append("search", searchQuery);

      const response = await AxiosInstance.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 403) {
        toast.error("Akses ditolak");
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      if (isAdmin) {
        await AxiosInstance.delete(`/admin/admins/${userId}`);
        toast.success("Admin dihapus");
      } else {
        await AxiosInstance.post("/admin/admins", { userId });
        toast.success("Admin dibuat");
      }
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Gagal update status admin");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Yakin mau hapus user ini?")) return;

    try {
      await AxiosInstance.delete(`/admin/users/${userId}`);
      toast.success("User dihapus");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Gagal menghapus user");
    }
  };

  const handleSuspendUser = async (userId: string, isSuspended: boolean) => {
    try {
      if (isSuspended) {
        await AxiosInstance.post(`/admin/users/${userId}/unsuspend`);
        toast.success("User di-unsuspend");
      } else {
        await AxiosInstance.post(`/admin/users/${userId}/suspend`);
        toast.success("User di-suspend");
      }
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Gagal suspend/unsuspend user");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Admin</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Kelola User</h1>
            <p className="text-muted-foreground">Kelola semua user</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari user..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <AdminLoading />
          ) : users.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">Tidak ada user ditemukan</p>
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium">User</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Role</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Post</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.profilePicture ? (
                                <Image
                                  src={user.profilePicture}
                                  alt={user.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{user.name}</div>
                              {user.isVerified && (
                                <span className="text-xs text-green-500">Terverifikasi</span>
                              )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {user.isOwner && (
                                <span className="px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-500 rounded">
                                  Owner
                                </span>
                              )}
                              {user.isAdmin && !user.isOwner && (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 rounded">
                                  Admin
                                </span>
                              )}
                              {!user.isAdmin && !user.isOwner && (
                                <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                                  User
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.isSuspended ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded">
                                Suspended
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">{user._count?.posts || 0}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {!user.isOwner && (
                                <button
                                  onClick={() => handleSuspendUser(user.id, user.isSuspended)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    user.isSuspended
                                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                      : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                  }`}
                                  title={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                                >
                                  {user.isSuspended ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Ban className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              {!user.isOwner && (
                                <button
                                  onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    user.isAdmin
                                      ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                      : "bg-muted text-muted-foreground hover:bg-accent"
                                  }`}
                                  title={user.isAdmin ? "Hapus Admin" : "Jadikan Admin"}
                                >
                                  {user.isAdmin ? (
                                    <ShieldCheck className="h-4 w-4" />
                                  ) : (
                                    <Shield className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              {!user.isOwner && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  title="Hapus User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-border bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-border bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

