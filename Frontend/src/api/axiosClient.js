import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const TOKEN_KEY = "karsiyaka_destek_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

// JWT token'ı her isteğe Authorization: Bearer <token> olarak ekler.
axiosClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backendin döndürdüğü hata mesajını (error.response.data.message) arayüzde
// gösterilebilecek tutarlı bir formata indirger.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Beklenmeyen bir hata oluştu.";

    if (error?.response?.status === 401) {
      tokenStorage.clear();
    }

    return Promise.reject({
      status: error?.response?.status ?? null,
      message,
      raw: error,
    });
  }
);

export default axiosClient;
