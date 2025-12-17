"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Users, Shield, FileText, Bug } from "lucide-react";
import toast from "react-hot-toast";
import AdminLoading from "@/components/AdminLoading";

export default function AdminDashboard() {
  const { userId, authenticated, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalPosts: 0,
    publishedPosts: 0,
  });

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
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

      // Fetch stats
      try {
        const [usersRes, adminsRes, postsRes] = await Promise.all([
          AxiosInstance.get("/admin/users?limit=1"),
          AxiosInstance.get("/admin/admins"),
          AxiosInstance.get("/admin/posts?limit=100"),
        ]);

        setStats({
          totalUsers: usersRes.data.pagination?.total || 0,
          totalAdmins: adminsRes.data.admins?.length || 0,
          totalPosts: postsRes.data.pagination?.total || 0,
          publishedPosts: postsRes.data.posts?.filter((p: any) => p.published)
            .length || 0,
        });
      } catch (statsError) {
        console.error("Error fetching stats:", statsError);
        // Continue even if stats fail
      }
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

  const menuItems = [
    {
      title: "Kelola User",
      description: "Kelola semua user, role, dan permission",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Kelola Admin",
      description: "Kelola admin dan permission",
      icon: Shield,
      href: "/admin/admins",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Kelola Post",
      description: "Kelola semua post di platform",
      icon: FileText,
      href: "/admin/posts",
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Reports",
      description: "Lihat dan kelola bug reports dari users",
      icon: Bug,
      href: "/admin/reports",
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard Admin</h1>
            <p className="text-muted-foreground">
              Kelola users, admins, dan posts
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total User</span>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Admin</span>
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold">{stats.totalAdmins}</div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Post</span>
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold">{stats.totalPosts}</div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Post Terpublikasi
                </span>
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold">{stats.publishedPosts}</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-xl card-hover group"
                >
                  <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

