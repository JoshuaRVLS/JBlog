import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  timeout: 30000,
});

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

    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        toast.error("Request timeout. Pastikan backend server sedang berjalan.", {
          duration: 5000,
        });
      } else if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        toast.error("Tidak dapat terhubung ke server. Pastikan backend server sedang berjalan di http://localhost:8000", {
          duration: 5000,
        });
      } else {
        toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.", {
          duration: 5000,
        });
      }
      
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const data = error.response?.data as any;

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
