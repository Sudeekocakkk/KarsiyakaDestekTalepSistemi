import axiosClient from "./axiosClient";

export const getCategories = (params) =>
  axiosClient.get("/categories", { params }).then((res) => res.data);

export const getCategoryById = (id) =>
  axiosClient.get(`/categories/${id}`).then((res) => res.data);

// ADMIN rolü gerekir.
export const createCategory = (payload) =>
  axiosClient.post("/categories", payload).then((res) => res.data);

// Not: backend yalnızca name ve isActive alanlarını destekliyor;
// specializationId oluşturma sonrası değiştirilemiyor.
export const updateCategory = (id, payload) =>
  axiosClient.patch(`/categories/${id}`, payload).then((res) => res.data);

export const deactivateCategory = (id) =>
  axiosClient.patch(`/categories/${id}/deactivate`).then((res) => res.data);
