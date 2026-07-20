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

// PATCH /api/tickets/:id — talep detayındaki tek "Kaydet" butonunun karşılığı.
// payload yalnızca değişen alanları içermelidir: assignedToId (ADMIN),
// status (ADMIN veya kendisine atanmış TEKNIK_PERSONEL), resolutionDescription
// (ADMIN veya kendisine atanmış TEKNIK_PERSONEL) ve message (görüntüleme
// yetkisi olan herkes). Rol/sahiplik kontrolü backend tarafında yapılır.
export const updateTicket = (id, payload) =>
  axiosClient.patch(`/tickets/${id}`, payload).then((res) => res.data);
