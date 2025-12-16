"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { ArrowLeft, Bug, Search, Filter, CheckCircle2, Clock, XCircle, Loader2, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import AdminLoading from "@/components/AdminLoading";
import Image from "next/image";
import { generateAvatarUrl } from "@/utils/avatarGenerator";

type ReportStatus = "pending" | "in_progress" | "resolved" | "closed";
type ReportType = "bug" | "feature" | "other";

interface Report {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  pageUrl: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminReports() {
  const { userId, authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (userId) {
      fetchData();
    }
  }, [userId, authenticated, page, statusFilter, typeFilter, search]);

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

      // Fetch reports
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (search) params.append("search", search);

      const reportsRes = await AxiosInstance.get(`/reports?${params.toString()}`);
      setReports(reportsRes.data.reports || []);
      setTotalPages(reportsRes.data.pagination?.totalPages || 1);
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

  const handleStatusUpdate = async (reportId: string, newStatus: ReportStatus) => {
    try {
      setUpdating(reportId);
      await AxiosInstance.put(`/reports/${reportId}/status`, { status: newStatus });
      toast.success("Status report berhasil diupdate");
      fetchData();
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.msg || "Gagal mengupdate status");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Yakin ingin menghapus report ini?")) return;

    try {
      setUpdating(reportId);
      await AxiosInstance.delete(`/reports/${reportId}`);
      toast.success("Report berhasil dihapus");
      fetchData();
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error: any) {
      console.error("Error deleting report:", error);
      toast.error(error.response?.data?.msg || "Gagal menghapus report");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "closed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: ReportType) => {
    switch (type) {
      case "bug":
        return "Bug";
      case "feature":
        return "Feature Request";
      case "other":
        return "Lainnya";
      default:
        return type;
    }
  };

  if (loading) {
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Dashboard Admin</span>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Bug className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Reports</h1>
                <p className="text-muted-foreground">
                  Kelola bug reports dan feedback dari users
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border/50 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari report..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as ReportStatus | "all");
                    setPage(1);
                  }}
                  className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as ReportType | "all");
                    setPage(1);
                  }}
                  className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports List */}
            <div className="lg:col-span-2 space-y-4">
              {reports.length === 0 ? (
                <div className="bg-card border border-border/50 rounded-xl p-12 text-center shadow-sm">
                  <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada report ditemukan</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`bg-card border rounded-xl p-6 cursor-pointer transition-all hover:border-primary/50 card-hover ${
                      selectedReport?.id === report.id
                        ? "border-primary/50 shadow-lg"
                        : "border-border/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{report.title}</h3>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                              report.status
                            )}`}
                          >
                            {getStatusIcon(report.status)}
                            {report.status === "in_progress" ? "In Progress" : report.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getTypeLabel(report.type)}
                        </p>
                        <p className="text-sm text-foreground/80 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        {report.user ? (
                          <>
                            <Image
                              src={
                                report.user.profilePicture ||
                                generateAvatarUrl(report.user.name)
                              }
                              alt={report.user.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                            <span className="text-sm text-muted-foreground">
                              {report.user.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Report Detail Sidebar */}
            <div className="lg:col-span-1">
              {selectedReport ? (
                <div className="bg-card border border-border/50 rounded-xl p-6 sticky top-24 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Detail Report</h2>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
                    >
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                        Judul
                      </label>
                      <p className="text-foreground font-medium">{selectedReport.title}</p>
                    </div>

                    {/* Type & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                          Tipe
                        </label>
                        <span className="text-sm text-foreground">
                          {getTypeLabel(selectedReport.type)}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                          Status
                        </label>
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                            selectedReport.status
                          )}`}
                        >
                          {selectedReport.status === "in_progress"
                            ? "In Progress"
                            : selectedReport.status}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                        Deskripsi
                      </label>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                        {selectedReport.description}
                      </p>
                    </div>

                    {/* Page URL */}
                    {selectedReport.pageUrl && (
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                          URL Halaman
                        </label>
                        <a
                          href={selectedReport.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {selectedReport.pageUrl}
                        </a>
                      </div>
                    )}

                    {/* Reporter */}
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                        Reporter
                      </label>
                      {selectedReport.user ? (
                        <div className="flex items-center gap-2">
                          <Image
                            src={
                              selectedReport.user.profilePicture ||
                              generateAvatarUrl(selectedReport.user.name)
                            }
                            alt={selectedReport.user.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium">{selectedReport.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedReport.user.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Anonymous</span>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-2 pt-4 border-t border-border">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Dibuat:</span>
                        <span>
                          {new Date(selectedReport.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Diupdate:</span>
                        <span>
                          {new Date(selectedReport.updatedAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-4 border-t border-border">
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                        Ubah Status
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          ["pending", "in_progress", "resolved", "closed"] as ReportStatus[]
                        ).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusUpdate(selectedReport.id, status)}
                            disabled={
                              updating === selectedReport.id ||
                              selectedReport.status === status
                            }
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              selectedReport.status === status
                                ? getStatusColor(status)
                                : "border-border hover:border-primary"
                            }`}
                          >
                            {status === "in_progress" ? "In Progress" : status}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleDelete(selectedReport.id)}
                        disabled={updating === selectedReport.id}
                        className="w-full mt-4 px-4 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus Report
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border/50 rounded-xl p-12 text-center shadow-sm">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Pilih report untuk melihat detail</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

