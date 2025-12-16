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
  login: (data: FieldValues) => void;
  register: (data: FieldValues) => void;
  verifyEmail: (data: FieldValues) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthData>({
  userId: null,
  authenticated: false,
  loading: true,
  login: (data: FieldValues) => {},
  register: (data: FieldValues) => {},
  verifyEmail: (data: FieldValues) => {},
  logout: () => {},
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string>("");
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.post("/auth/validate");
      if (response.data.authenticated && response.data.userId) {
        setUserId(response.data.userId);
        setAuthenticated(true);
      } else {
        setUserId("");
        setAuthenticated(false);
      }
    } catch (error) {
      // If validate fails, try refresh
      try {
        const refreshResponse = await AxiosInstance.post("/auth/refresh");
        if (refreshResponse.data.userId) {
          setUserId(refreshResponse.data.userId);
          setAuthenticated(true);
        } else {
          setUserId("");
          setAuthenticated(false);
        }
      } catch (refreshError) {
        setUserId("");
        setAuthenticated(false);
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
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.msg);
      }
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
      
      // Update auth state setelah register berhasil (auto login)
      setAuthenticated(true);
      setUserId(response.data.user.id);
      
      // Check auth untuk memastikan state ter-update dengan benar
      await checkAuth();
      
      // Redirect ke finalisation
      if (response.data.redirectTo) {
        router.push(response.data.redirectTo);
      } else {
        router.push("/profile/finalisation");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        toast.error(error.response?.data?.msg || error.response?.data?.error || "Gagal registrasi");
      }
    }
  };

  const logout = async () => {
    try {
      await AxiosInstance.delete("/auth/logout");
      setUserId("");
      setAuthenticated(false);
    } catch (error) {
      console.log(error);
      // Even if logout fails, clear local state
      setUserId("");
      setAuthenticated(false);
    }
  };

  const verifyEmail = async (data: FieldValues) => {
    try {
      const response = await AxiosInstance.get(`/email/verify/${data.code}`);
      toast.success(response.data.msg);
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
