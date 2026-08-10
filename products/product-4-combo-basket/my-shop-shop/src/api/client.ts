import axios from "axios";
import config from "../config";

const BASE_URL = config.apiUrl;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Attach shop auth token on every request (client-side only)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("shop_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error normaliser — throw a readable Error on non-2xx
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message || err.message || "Unknown error";
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
