"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

interface ActivityData {
  date: string;
  posts: number;
  comments: number;
  claps: number;
}

interface ActivityChartProps {
  userId: string;
  days?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Get original date from payload data
    const data = payload[0]?.payload;
    let formattedDate = label;
    
    // If we have original date in data, use it
    if (data?.originalDate) {
      const date = new Date(data.originalDate);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } else {
      // Try to parse label as date string (YYYY-MM-DD format)
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }

    return (
      <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg backdrop-blur-sm">
        <p className="font-semibold text-foreground mb-2">{formattedDate}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ActivityChart({ userId, days = 30 }: ActivityChartProps) {
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const response = await AxiosInstance.get(`/users/${userId}/activity?days=${days}`);
        console.log("📊 Activity data received:", response.data);
        const activityData = response.data.activity || [];
        console.log("📊 Activity array:", activityData);
        console.log("📊 First item structure:", activityData[0]);
        console.log("📊 Sample values:", {
          posts: activityData[0]?.posts,
          comments: activityData[0]?.comments,
          claps: activityData[0]?.claps,
        });
        setActivity(activityData);
      } catch (error: any) {
        console.error("❌ Error fetching activity:", error);
        console.error("❌ Error response:", error.response?.data);
        toast.error("Gagal mengambil data activity");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchActivity();
    }
  }, [userId, days]);

  if (loading) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formattedData = activity.map((item) => {
    const date = new Date(item.date);
    return {
      ...item,
      originalDate: item.date, // Keep original date for tooltip
      date: !isNaN(date.getTime()) 
        ? date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          })
        : item.date, // Fallback to original if invalid
    };
  });

  // Debug: Log data details
  if (activity.length > 0) {
    console.log("✅ Activity data formatted:", formattedData.length, "days");
    console.log("📊 Sample data:", formattedData.slice(0, 3));
    const sampleItem = formattedData[0];
    console.log("📊 Data structure:", {
      posts: sampleItem?.posts,
      comments: sampleItem?.comments,
      claps: sampleItem?.claps,
    });
  } else if (!loading) {
    console.log("⚠️ No activity data found for user:", userId);
  }

  const totalPosts = activity.reduce((sum, item) => sum + item.posts, 0);
  const totalComments = activity.reduce((sum, item) => sum + item.comments, 0);
  const totalClaps = activity.reduce((sum, item) => sum + item.claps, 0);

  // If no activity data at all, show empty state
  if (activity.length === 0 && !loading) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Activity Chart</h3>
              <p className="text-sm text-muted-foreground">Aktivitas kamu dalam {days} hari terakhir</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground mb-2">Belum ada aktivitas</p>
          <p className="text-sm text-muted-foreground/70">Mulai dengan membuat post, comment, atau like!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Activity Chart</h3>
            <p className="text-sm text-muted-foreground">Aktivitas kamu dalam {days} hari terakhir</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              chartType === "line"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              chartType === "bar"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Posts</p>
          <p className="text-2xl font-bold text-primary">{totalPosts}</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Comments</p>
          <p className="text-2xl font-bold text-blue-500">{totalComments}</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Claps</p>
          <p className="text-2xl font-bold text-red-500">{totalClaps}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="posts"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
                name="Posts"
                connectNulls={false}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="comments"
                stroke="hsl(217.2 91.2% 59.8%)"
                strokeWidth={2}
                dot={{ fill: "hsl(217.2 91.2% 59.8%)", r: 4 }}
                activeDot={{ r: 6 }}
                name="Comments"
                connectNulls={false}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="claps"
                stroke="hsl(0 72.2% 50.6%)"
                strokeWidth={2}
                dot={{ fill: "hsl(0 72.2% 50.6%)", r: 4 }}
                activeDot={{ r: 6 }}
                name="Claps"
                connectNulls={false}
                isAnimationActive={true}
              />
            </LineChart>
          ) : (
            <BarChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                domain={[0, 'auto']}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                )}
              />
              <Bar dataKey="posts" fill="hsl(var(--primary))" name="Posts" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comments" fill="hsl(217.2 91.2% 59.8%)" name="Comments" radius={[4, 4, 0, 0]} />
              <Bar dataKey="claps" fill="hsl(0 72.2% 50.6%)" name="Claps" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

