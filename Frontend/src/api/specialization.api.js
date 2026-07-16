import axiosClient from "./axiosClient";

export const getSpecializations = () =>
  axiosClient.get("/specializations").then((res) => res.data);

export const getSpecializationById = (id) =>
  axiosClient.get(`/specializations/${id}`).then((res) => res.data);

// ADMIN rolü gerekir.
export const createSpecialization = (payload) =>
  axiosClient.post("/specializations", payload).then((res) => res.data);

export const updateSpecialization = (id, payload) =>
  axiosClient.patch(`/specializations/${id}`, payload).then((res) => res.data);

// Backend rotası DELETE olsa da controller soft-delete uygular (isActive:false).
export const deleteSpecialization = (id) =>
  axiosClient.delete(`/specializations/${id}`).then((res) => res.data);
