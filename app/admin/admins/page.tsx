"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { ArrowLeft, Shield, ShieldCheck, Trash2, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import AdminLoading from "@/components/AdminLoading";

export default function AdminManagement() {
  const { userId, authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get("/admin/admins");
      setAdmins(response.data.admins || []);
    } catch (error: any) {
      console.error("Error fetching admins:", error);
      if (error.response?.status === 403) {
        toast.error("Akses ditolak");
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedUserId) {
      toast.error("Pilih user dulu");
      return;
    }

    try {
      await AxiosInstance.post("/admin/admins", { userId: selectedUserId });
      toast.success("Admin berhasil ditambahkan");
      setShowAddModal(false);
      setSelectedUserId("");
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Gagal menambahkan admin");
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm("Yakin mau hapus akses admin?")) return;

    try {
      await AxiosInstance.delete(`/admin/admins/${adminId}`);
      toast.success("Admin dihapus");
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Gagal menghapus admin");
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
            <span>Back to Admin</span>
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Management</h1>
              <p className="text-muted-foreground">Manage admin users</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Add Admin
            </button>
          </div>

          {/* Add Admin Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4">Tambah Admin</h2>
                <input
                  type="text"
                  placeholder="User ID"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddAdmin}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Tambah
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedUserId("");
                    }}
                    className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-accent transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admins List */}
          {loading ? (
            <AdminLoading />
          ) : admins.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">Tidak ada admin ditemukan</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium">Admin</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Role</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Post</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {admin.profilePicture ? (
                              <Image
                                src={admin.profilePicture}
                                alt={admin.name}
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
                              <div className="font-medium">{admin.name}</div>
                              {admin.isVerified && (
                                <span className="text-xs text-green-500">Terverifikasi</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4">
                          {admin.isOwner ? (
                            <span className="px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-500 rounded">
                              Owner
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 rounded">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">{admin._count?.posts || 0}</td>
                        <td className="px-6 py-4">
                              {!admin.isOwner && (
                                <button
                                  onClick={() => handleRemoveAdmin(admin.id)}
                                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  title="Hapus Admin"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

