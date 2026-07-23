import axiosClient from "./axiosClient";

// POST /api/tickets/:id/handover-requests — TEKNIK_PERSONEL, kendisine
// atanmış talebi başka bir teknik personele devretmek için onay isteği gönderir.
export const createHandoverRequest = (ticketId, payload) =>
  axiosClient.post(`/tickets/${ticketId}/handover-requests`, payload).then((res) => res.data);

// PATCH /api/handover-requests/:id/respond — yalnızca hedef kişi, body: { decision: "ACCEPTED"|"REJECTED", responseNote? }
export const respondHandoverRequest = (id, payload) =>
  axiosClient.patch(`/handover-requests/${id}/respond`, payload).then((res) => res.data);

// PATCH /api/handover-requests/:id/cancel — yalnızca isteği oluşturan kişi, PENDING iken.
export const cancelHandoverRequest = (id) =>
  axiosClient.patch(`/handover-requests/${id}/cancel`).then((res) => res.data);
