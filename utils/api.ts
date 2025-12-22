import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  timeout: 30000,
});

/**
 * Get the Socket.IO server URL
 * Priority:
 * 1. NEXT_PUBLIC_SOCKET_URL (if explicitly set)
 * 2. NEXT_PUBLIC_API_URL (extract base URL by removing /api)
 * 3. window.location.origin (in browser, for same-domain deployments)
 * 4. localhost:8000 (development fallback)
 */
export function getSocketUrl(): string {
  // Check for explicit socket URL first
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL.trim();
    // Remove ws:// or wss:// prefix if present, convert to http/https
    if (socketUrl.startsWith("wss://")) {
      return socketUrl.replace(/^wss:\/\//, "https://");
    }
    if (socketUrl.startsWith("ws://")) {
      return socketUrl.replace(/^ws:\/\//, "http://");
    }
    // If already http/https, use as is
    if (socketUrl.startsWith("http://") || socketUrl.startsWith("https://")) {
      return socketUrl;
    }
    // If no protocol, assume https in production, http in development
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "https://" : "http://";
    return `${protocol}${socketUrl}`;
  }

  // If NEXT_PUBLIC_API_URL is set, extract base URL from it
  if (process.env.NEXT_PUBLIC_API_URL) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL.trim();
    // Remove /api suffix if present
    let baseUrl = apiUrl.replace(/\/api\/?$/, "");
    // Ensure it has protocol
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      // Determine protocol based on current page or default to https
      const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "https://" : "http://";
      baseUrl = `${protocol}${baseUrl}`;
    }
    return baseUrl;
  }

  // In browser, check if we're in development (localhost:3000) and use backend port
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // If frontend is on localhost:3000, backend should be on localhost:8000
    if (origin.includes("localhost:3000") || origin.includes("127.0.0.1:3000")) {
      return "http://localhost:8000";
    }
    // For production same-domain, use current origin
    return origin;
  }

  // Fallback to localhost for development
  return "http://localhost:8000";
}

AxiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

AxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't show toast for intentionally aborted requests
    if (error.code === "ECONNABORTED" && originalRequest?.signal?.aborted) {
      return Promise.reject(error); // Silent reject for aborted requests
    }

    // Check if this is actually an axios request (not a browser error)
    // Ignore errors that don't have a config (not from axios)
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Ignore errors for static assets, favicon, or other non-API requests
    const url = originalRequest.url || "";
    if (url.includes("favicon") || url.includes(".ico") || url.includes(".png") || url.includes(".jpg") || url.includes(".svg") || url.includes("_next")) {
      return Promise.reject(error);
    }

    if (!error.response) {
      // Only show network errors for actual API requests, not for static assets
      if (originalRequest.baseURL && url.startsWith(originalRequest.baseURL)) {
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
          // Only show timeout error if not intentionally aborted
          if (!originalRequest?.signal?.aborted) {
        toast.error("Request timeout. Pastikan backend server sedang berjalan.", {
          duration: 5000,
        });
          }
      } else if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
          // Only show network error if it's actually an API request
        toast.error("Tidak dapat terhubung ke server. Pastikan backend server sedang berjalan di http://localhost:8000", {
          duration: 5000,
        });
      } else {
          // Only show generic error if it's an API request
        toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.", {
          duration: 5000,
        });
        }
      }
      
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const data = error.response?.data as any;

    // Handle maintenance mode
    if (status === 503 && data?.maintenance) {
      // Only redirect if not already on maintenance page
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/maintenance")) {
        window.location.href = "/maintenance";
      }
      return Promise.reject(error);
    }

    if (status === 401) {
      return Promise.reject(error);
    }

    if (status === 403) {
      return Promise.reject(error);
    }

    if (status === 500) {
      toast.error(data?.msg || data?.error || "Terjadi kesalahan pada server. Silakan coba lagi nanti.", {
        duration: 5000,
      });
      return Promise.reject(error);
    }

    if (data?.msg || data?.error) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;
