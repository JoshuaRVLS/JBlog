"use client";

import { createContext, useEffect, useState } from "react";
import AxiosInstance from "@/utils/api";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { FieldValues } from "react-hook-form";
import { useRouter } from "next/navigation";

type AuthData = {
  userId: string | null;
  authenticated: boolean;
  loading: boolean;
  isSuspended: boolean;
  suspendedUntil: string | null;
  login: (data: FieldValues) => void;
  register: (data: FieldValues) => void;
  verifyEmail: (data: FieldValues) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthData>({
  userId: null,
  authenticated: false,
  loading: true,
  isSuspended: false,
  suspendedUntil: null,
  login: (data: FieldValues) => {},
  register: (data: FieldValues) => {},
  verifyEmail: (data: FieldValues) => {},
  logout: () => {},
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string>("");
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.post("/auth/validate");
      if (response.data.isSuspended) {
        setUserId(response.data.userId || "");
        setAuthenticated(false);
        setIsSuspended(true);
        setSuspendedUntil(response.data.suspendedUntil || null);
        if (response.data.userId) {
          toast.error(
            response.data.suspendedUntil
              ? `Akun Anda di-suspend hingga ${new Date(response.data.suspendedUntil).toLocaleString("id-ID")}`
              : "Akun Anda telah di-suspend. Silakan hubungi admin untuk informasi lebih lanjut.",
            { duration: 5000 }
          );
        }
      } else if (response.data.authenticated && response.data.userId) {
        setUserId(response.data.userId);
        setAuthenticated(true);
        setIsSuspended(false);
        setSuspendedUntil(null);
      } else {
        setUserId("");
        setAuthenticated(false);
        setIsSuspended(false);
        setSuspendedUntil(null);
      }
    } catch (error) {
      // Silently handle network errors during auth check to avoid spam
      if (error instanceof AxiosError && !error.response) {
        // Network error - backend might not be running
        // Don't show error, just set unauthenticated state
        setUserId("");
        setAuthenticated(false);
        setIsSuspended(false);
        setSuspendedUntil(null);
        setLoading(false);
        return;
      }

      try {
        const refreshResponse = await AxiosInstance.post("/auth/refresh");
        if (refreshResponse.data.isSuspended) {
          setUserId(refreshResponse.data.userId || "");
          setAuthenticated(false);
          setIsSuspended(true);
          setSuspendedUntil(refreshResponse.data.suspendedUntil || null);
        } else if (refreshResponse.data.userId) {
          setUserId(refreshResponse.data.userId);
          setAuthenticated(true);
          setIsSuspended(false);
          setSuspendedUntil(null);
        } else {
          setUserId("");
          setAuthenticated(false);
          setIsSuspended(false);
          setSuspendedUntil(null);
        }
      } catch (refreshError) {
        setUserId("");
        setAuthenticated(false);
        setIsSuspended(false);
        setSuspendedUntil(null);
      }
    }
    setLoading(false);
  };

  const login = async (data: FieldValues) => {
    try {
      const { email, password } = data;

      const response = await AxiosInstance.post("/auth/login", {
        email,
        password,
      });
      toast.success("Login Berhasil");
      
      // Update auth state setelah login berhasil
      await checkAuth();
      
      router.push("/");
      return response;
    } catch (error) {
      if (error instanceof AxiosError) {
        const response = error.response?.data;
        
        // Handle unverified user - throw error with response data
        if (response?.requiresVerification) {
          throw error; // Let the page handle the redirect
        }
        
        toast.error(response?.msg || "Login gagal");
      }
      throw error;
    }
  };

  const register = async (data: FieldValues) => {
    try {
      const { email, name, password, confirmPassword } = data;
      const response = await AxiosInstance.post("/users", {
        email,
        name,
        password,
        confirmPassword,
      });
      toast.success(response.data.msg);
      
      // Don't auto-login, user needs to verify email first
      // Return response so page can handle redirect
      return response;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        toast.error(error.response?.data?.msg || error.response?.data?.error || "Gagal registrasi");
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AxiosInstance.delete("/auth/logout");
      setUserId("");
      setAuthenticated(false);
      setIsSuspended(false);
      setSuspendedUntil(null);
    } catch (error) {
      console.log(error);
      setUserId("");
      setAuthenticated(false);
      setIsSuspended(false);
      setSuspendedUntil(null);
    }
  };

  const verifyEmail = async (data: FieldValues) => {
    try {
      const response = await AxiosInstance.get(`/email/verify/${data.code}`);
      toast.success(response.data.msg);
      
      // Update auth state setelah verifikasi berhasil (auto login)
      await checkAuth();
      
      // Redirect ke profile finalisation setelah verifikasi berhasil
      if (response.data.redirectTo) {
        router.push(response.data.redirectTo);
      } else {
        router.push("/profile/finalisation");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.msg);
      }
    }
  };

  useEffect(() => {
    checkAuth();
    // Check auth every 5 minutes
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        userId,
        loading,
        isSuspended,
        suspendedUntil,
        login,
        logout,
        register,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
