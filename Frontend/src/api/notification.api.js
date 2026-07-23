import axiosClient from "./axiosClient";

// GET /api/notifications — oturum açmış kullanıcının kendi bildirimleri.
export const getMyNotifications = (params) =>
  axiosClient.get("/notifications", { params }).then((res) => res.data);

export const markNotificationRead = (id) =>
  axiosClient.patch(`/notifications/${id}/read`).then((res) => res.data);

export const markAllNotificationsRead = () =>
  axiosClient.patch("/notifications/read-all").then((res) => res.data);

// GET /api/notifications/admin — yalnızca ADMIN.
export const getAdminNotifications = (params) =>
  axiosClient.get("/notifications/admin", { params }).then((res) => res.data);
