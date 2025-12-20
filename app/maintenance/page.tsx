"use client";

import { useEffect, useState } from "react";
import { Wrench, Loader2 } from "lucide-react";
import AxiosInstance from "@/utils/api";

export default function MaintenancePage() {
  const [message, setMessage] = useState("Situs sedang dalam maintenance. Silakan coba lagi nanti.");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch maintenance message
    AxiosInstance.get("/admin/maintenance")
      .then((res) => {
        if (res.data.message) {
          setMessage(res.data.message);
        }
      })
      .catch(() => {
        // Use default message if error
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Wrench className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Maintenance Mode</h1>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>

        <div className="pt-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Kami akan kembali segera...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

