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
    // Check access Token
    try {
      const response = await AxiosInstance.post("/auth/validate");
      if (response.data.userId) {
        setUserId(response.data.userId);
        setAuthenticated(true);
      } else {
        await logout();
      }
    } catch (error) {
      // Refresh Token
      const response = await AxiosInstance.post("/auth/refresh");
      if (response.data.userId) {
        setUserId(response.data.userId);
        setAuthenticated(true);
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
      router.push(`/verify-email/${response.data.userId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        toast.error(error.response?.data.msg);
      }
    }
  };

  const logout = async () => {
    try {
      const response = await AxiosInstance.delete("/auth/logout");
    } catch (error) {
      console.log(error);
    }
  };

  const verifyEmail = async (data: FieldValues) => {
    try {
      const response = await AxiosInstance.get(`/email/verify/${data.code}`);
      toast(response.data.msg);
      router.push("/login");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.msg);
      }
    }
  };

  useEffect(() => {
    const intervalId = setInterval(checkAuth, 1000);
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
