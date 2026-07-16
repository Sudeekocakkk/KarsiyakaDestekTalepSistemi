import axiosClient from "./axiosClient";

// POST /api/auth/setup — sistemde hiç kullanıcı yokken ilk ADMIN hesabını oluşturur.
export const setupAdmin = (payload) =>
  axiosClient.post("/auth/setup", payload).then((res) => res.data);

// POST /api/auth/register — açık kayıt, her zaman PERSONEL rolü ile hesap açar.
export const register = (payload) =>
  axiosClient.post("/auth/register", payload).then((res) => res.data);

// POST /api/auth/login
export const login = (payload) =>
  axiosClient.post("/auth/login", payload).then((res) => res.data);

// GET /api/auth/me
export const getMe = () =>
  axiosClient.get("/auth/me").then((res) => res.data);
