import axiosClient from "./axiosClient";

export const getDepartments = () =>
  axiosClient.get("/departments").then((res) => res.data);

// Oturum gerektirmez — kayıt formunda müdürlük seçimi için kullanılır.
// Yalnızca aktif müdürlüklerin id/ad bilgisini döner.
export const getActiveDepartmentsPublic = () =>
  axiosClient.get("/departments/public/active").then((res) => res.data);

export const getDepartmentById = (id) =>
  axiosClient.get(`/departments/${id}`).then((res) => res.data);

// ADMIN rolü gerekir.
export const createDepartment = (payload) =>
  axiosClient.post("/departments", payload).then((res) => res.data);

// Not: backend yalnızca name alanını destekliyor, isActive toggle endpointi yok.
export const updateDepartment = (id, payload) =>
  axiosClient.patch(`/departments/${id}`, payload).then((res) => res.data);

// Bağlı kullanıcısı olan müdürlük silinemez (backend kontrolü).
export const deleteDepartment = (id) =>
  axiosClient.delete(`/departments/${id}`).then((res) => res.data);
