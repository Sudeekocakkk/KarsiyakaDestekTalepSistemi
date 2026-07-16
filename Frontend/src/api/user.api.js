import axiosClient from "./axiosClient";

// Tüm endpointler ADMIN rolü gerektirir (bkz. Backend/src/routes/user.routes.js).

export const createUser = (payload) =>
  axiosClient.post("/users", payload).then((res) => res.data);

export const getUsers = (params) =>
  axiosClient.get("/users", { params }).then((res) => res.data);

export const getUserById = (id) =>
  axiosClient.get(`/users/${id}`).then((res) => res.data);

export const updateUser = (id, payload) =>
  axiosClient.patch(`/users/${id}`, payload).then((res) => res.data);

export const deactivateUser = (id) =>
  axiosClient.patch(`/users/${id}/deactivate`).then((res) => res.data);
