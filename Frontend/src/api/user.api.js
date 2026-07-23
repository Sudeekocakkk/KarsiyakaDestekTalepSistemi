import axiosClient from "./axiosClient";

// Aksi belirtilmedikçe tüm endpointler ADMIN rolü gerektirir
// (bkz. Backend/src/routes/user.routes.js).

// PATCH /api/users/me — oturum açmış herhangi bir rol kendi profilini
// günceller (name, email, phone). Başka bir kullanıcı bu uçtan etkilenemez;
// rol/departman/uzmanlık gibi yönetimsel alanlar desteklenmez.
export const updateMe = (payload) =>
  axiosClient.patch("/users/me", payload).then((res) => res.data);

export const createUser = (payload) =>
  axiosClient.post("/users", payload).then((res) => res.data);

export const getUsers = (params) =>
  axiosClient.get("/users", { params }).then((res) => res.data);

// GET /api/users/technicians — TEKNIK_PERSONEL veya ADMIN erişebilir
// (devir isteği hedef personel seçimi için, GET /api/users'ın aksine
// ADMIN'e kilitli değildir).
export const getTechnicians = (params) =>
  axiosClient.get("/users/technicians", { params }).then((res) => res.data);

export const getUserById = (id) =>
  axiosClient.get(`/users/${id}`).then((res) => res.data);

export const updateUser = (id, payload) =>
  axiosClient.patch(`/users/${id}`, payload).then((res) => res.data);

export const deactivateUser = (id) =>
  axiosClient.patch(`/users/${id}/deactivate`).then((res) => res.data);
