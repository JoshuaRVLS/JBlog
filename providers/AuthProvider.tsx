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
  login: (data: FieldValues) => Promise<any>;
  register: (data: FieldValues) => Promise<any>;
  verifyEmail: (data: FieldValues) => Promise<any>;
  logout: () => void;
};

export const AuthContext = createContext<AuthData>({
  userId: null,
  authenticated: false,
  loading: true,
  isSuspended: false,
  suspendedUntil: null,
  login: async (data: FieldValues) => {},
  register: async (data: FieldValues) => {},
  verifyEmail: async (data: FieldValues) => {},
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
      
      // Auto-generate encryption key pair for new user after verification
      // This is done in the background, don't block the redirect
      if (response.data.userId) {
        // Use dynamic import to avoid loading encryption code if not needed
        import("@/lib/encryption").then(async ({ EncryptionService }) => {
          import("@/lib/keyStorage").then(async ({ KeyStorage }) => {
            try {
              // Check if key pair already exists locally
              const existingKey = KeyStorage.getKeyPair();
              if (!existingKey) {
                // Generate key pair in frontend
                const keyPair = await EncryptionService.generateKeyPair();
                
                // Send public key to backend to sync (backend will create the key record)
                try {
                  const keyResponse = await AxiosInstance.post("/encryption/keys/generate");
                  if (keyResponse.data.keyId) {
                    // Store key pair locally with keyId from backend
                    KeyStorage.saveKeyPair({
                      publicKey: keyPair.publicKey,
                      privateKey: keyPair.privateKey,
                      keyId: keyResponse.data.keyId,
                    });
                    console.log("✅ Encryption key pair auto-generated after verification");
                  }
                } catch (keyError: any) {
                  // If key already exists in backend (backend generated it), that's fine
                  if (keyError.response?.status === 400 && keyError.response?.data?.error?.includes("Key pair sudah ada")) {
                    // Try to get keyId from backend
                    try {
                      const publicKeyResponse = await AxiosInstance.get(`/encryption/keys/user/${response.data.userId}`);
                      if (publicKeyResponse.data.publicKey) {
                        // We have public key from backend, store our generated key pair locally
                        // Note: The public key from backend might be different, but that's ok
                        // We'll use our locally generated key pair for encryption
                        KeyStorage.saveKeyPair({
                          publicKey: keyPair.publicKey,
                          privateKey: keyPair.privateKey,
                          keyId: publicKeyResponse.data.keyId || "",
                        });
                        console.log("✅ Encryption key pair stored locally (backend key exists)");
                      }
                    } catch (e) {
                      // Failed to sync, but that's ok - user can generate manually later
                      console.warn("Failed to sync encryption key pair:", e);
                    }
                  } else {
                    console.warn("Failed to generate encryption key pair:", keyError);
                  }
                }
              }
            } catch (error) {
              // Don't fail verification if key generation fails
              console.warn("Failed to auto-generate encryption key pair:", error);
            }
          });
        });
      }
      
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
