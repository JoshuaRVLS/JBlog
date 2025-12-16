"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const response = await AxiosInstance.post("/auth/forgot-password", {
        email,
      });
      toast.success(response.data.msg || "Reset link sent to your email");
      setSent(true);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(
        error.response?.data?.msg || "Failed to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to login</span>
        </Link>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground">
              {sent
                ? "Check your email for reset instructions"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-foreground">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Please check your inbox and click the link to reset your password.
                  The link will expire in 1 hour.
                </p>
              </div>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-sm text-primary hover:underline"
              >
                Resend email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

