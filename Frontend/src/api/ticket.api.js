import axiosClient from "./axiosClient";

// POST /api/tickets — PERSONEL rolü, multipart/form-data (images alanı, en fazla 5 dosya).
// Content-Type header'ı bilinçli olarak elle ayarlanmıyor: tarayıcı, FormData gövdesi için
// gerekli "boundary" değerini otomatik ekler. Elle "multipart/form-data" set edilirse
// boundary eksik kalır ve backend (multer) gövdeyi parse edemez.
export const createTicket = (formData) =>
  axiosClient.post("/tickets", formData).then((res) => res.data);

// GET /api/tickets/my — PERSONEL rolü, kendi oluşturduğu talepler.
export const getMyTickets = (params) =>
  axiosClient.get("/tickets/my", { params }).then((res) => res.data);

// GET /api/tickets/assigned — TEKNIK_PERSONEL rolü, kendisine atanan talepler.
export const getAssignedTickets = (params) =>
  axiosClient.get("/tickets/assigned", { params }).then((res) => res.data);

// GET /api/tickets — ADMIN rolü, tüm talepler (filtre: status, priority, categoryId,
// assignedToId, createdById, search).
export const getAllTickets = (params) =>
  axiosClient.get("/tickets", { params }).then((res) => res.data);

// GET /api/tickets/:id
export const getTicketById = (id) =>
  axiosClient.get(`/tickets/${id}`).then((res) => res.data);

// PATCH /api/tickets/:id/assign — ADMIN rolü.
export const assignTicket = (id, assignedToId) =>
  axiosClient
    .patch(`/tickets/${id}/assign`, { assignedToId })
    .then((res) => res.data);

// PATCH /api/tickets/:id/status — yalnızca ADMIN rolü yetkili (backend kısıtı).
export const updateTicketStatus = (id, status) =>
  axiosClient
    .patch(`/tickets/${id}/status`, { status })
    .then((res) => res.data);

// PATCH /api/tickets/:id/solution — yalnızca ADMIN rolü yetkili (backend kısıtı).
export const addSolution = (id, resolutionDescription) =>
  axiosClient
    .patch(`/tickets/${id}/solution`, { resolutionDescription })
    .then((res) => res.data);

// POST /api/tickets/:id/messages — talebi görüntüleme yetkisi olan herkes.
export const addMessage = (id, message) =>
  axiosClient
    .post(`/tickets/${id}/messages`, { message })
    .then((res) => res.data);
