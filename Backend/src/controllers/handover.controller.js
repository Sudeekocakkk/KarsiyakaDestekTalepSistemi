import prisma from "../config/prisma.js";
import { stripDeviceInfoForPersonel, ticketInclude } from "./ticket.controller.js";
import { recordDevice } from "../services/device.service.js";
import { notifyUser } from "../services/notification.service.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const CLOSED_STATUSES = ["COZULDU", "IPTAL_EDILDI"];

const handoverInclude = {
  ticket: { select: { id: true, ticketNumber: true, title: true } },
  requestedBy: { select: { id: true, name: true, email: true } },
  requestedTo: { select: { id: true, name: true, email: true } },
};

// POST /api/tickets/:id/handover-requests — talebe atanmış teknik personel,
// işi başka bir teknik personele devretmek için onay isteği gönderir.
// Aynı talep için ikinci bir PENDING istek, migration.sql'e elle eklenen
// kısmi (partial) unique index (handover_requests_one_pending_per_ticket)
// tarafından DB seviyesinde engellenir — burada Prisma'nın P2002 hatası
// yakalanıp anlaşılır bir Türkçe mesaja çevrilir.
export const createHandoverRequest = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);

    if (!ticketId) {
      return res.status(400).json({ message: "Geçersiz talep kimliği." });
    }

    const { requestedToId, reason } = req.body;
    const parsedRequestedToId = Number(requestedToId);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      return res.status(404).json({ message: "Talep bulunamadı." });
    }

    if (ticket.assignedToId !== req.user.id) {
      return res.status(403).json({
        message: "Bu talep size atanmadığı için devredemezsiniz.",
      });
    }

    if (CLOSED_STATUSES.includes(ticket.status)) {
      return res.status(400).json({
        message: "Çözülmüş veya iptal edilmiş bir talep devredilemez.",
      });
    }

    if (parsedRequestedToId === req.user.id) {
      return res.status(400).json({
        message: "Talebi kendinize devredemezsiniz.",
      });
    }

    const targetTechnician = await prisma.user.findFirst({
      where: {
        id: parsedRequestedToId,
        role: "TEKNIK_PERSONEL",
        isActive: true,
      },
    });

    if (!targetTechnician) {
      return res.status(404).json({
        message: "Aktif teknik personel bulunamadı.",
      });
    }

    const trimmedReason = reason.trim();
    const device = await recordDevice(req);

    let handoverRequest;

    try {
      handoverRequest = await prisma.handoverRequest.create({
        data: {
          ticketId,
          requestedById: req.user.id,
          requestedToId: parsedRequestedToId,
          reason: trimmedReason,
        },
        include: handoverInclude,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Bu talep için zaten bekleyen bir devir isteği var.",
        });
      }
      throw error;
    }

    await prisma.ticketLog.create({
      data: {
        ticketId,
        type: "DEVIR_ISTENDI",
        description: trimmedReason,
        userId: req.user.id,
        newValue: String(parsedRequestedToId),
        deviceId: device?.id ?? null,
      },
    });

    await notifyUser({
      userId: parsedRequestedToId,
      ticketId,
      title: "Devir İsteği",
      message: `${req.user.name}, ${ticket.ticketNumber} numaralı talebi size devretmek istiyor.`,
      type: "DEVIR_ISTEGI_ALINDI",
    });

    return res.status(201).json({
      message: "Devir isteği gönderildi.",
      handoverRequest,
    });
  } catch (error) {
    console.error("createHandoverRequest error:", error);

    return res.status(500).json({
      message: "Devir isteği oluşturulurken bir hata oluştu.",
    });
  }
};

// PATCH /api/handover-requests/:id/respond — yalnızca hedef kullanıcı,
// PENDING bir isteği kabul/reddedebilir. Çift kabul/race condition,
// $transaction yerine tek bir atomik updateMany (WHERE status=PENDING)
// + count kontrolü ile önlenir: PostgreSQL'de tek UPDATE ifadesi atomiktir,
// bu yüzden iki eşzamanlı istekten yalnızca biri count:1 alabilir.
export const respondHandoverRequest = async (req, res) => {
  try {
    const requestId = parseId(req.params.id);

    if (!requestId) {
      return res.status(400).json({ message: "Geçersiz devir isteği kimliği." });
    }

    const { decision, responseNote } = req.body;

    const claim = await prisma.handoverRequest.updateMany({
      where: {
        id: requestId,
        requestedToId: req.user.id,
        status: "PENDING",
      },
      data: {
        status: decision,
        responseNote: responseNote?.trim() || null,
        respondedAt: new Date(),
      },
    });

    if (claim.count === 0) {
      const existing = await prisma.handoverRequest.findUnique({
        where: { id: requestId },
      });

      if (!existing) {
        return res.status(404).json({ message: "Devir isteği bulunamadı." });
      }

      if (existing.requestedToId !== req.user.id) {
        return res.status(403).json({
          message: "Bu isteğe yanıt verme yetkiniz yok.",
        });
      }

      return res.status(409).json({
        message: "Bu istek zaten sonuçlandırılmış veya iptal edilmiş.",
      });
    }

    const handoverRequest = await prisma.handoverRequest.findUnique({
      where: { id: requestId },
      include: handoverInclude,
    });

    if (decision === "ACCEPTED") {
      const ticket = await prisma.ticket.findUnique({
        where: { id: handoverRequest.ticketId },
      });

      // Bu istek atomik claim ile "sahiplenildi" (artık PENDING değil), bu
      // yüzden başka bir kabul burada yarışamaz. Ama talep, bu sırada başka
      // bir yoldan (ör. admin ataması) devredilmiş olabilir — bu durumda
      // reassign YAPILMAZ, istek geçersiz sayılır.
      if (!ticket || ticket.assignedToId !== handoverRequest.requestedById) {
        await prisma.handoverRequest.update({
          where: { id: requestId },
          data: {
            responseNote:
              (handoverRequest.responseNote ? `${handoverRequest.responseNote}\n` : "") +
              "(Sistem) Talep bu sırada başka bir personele atandığı için istek geçersiz sayıldı.",
          },
        });

        return res.status(409).json({
          message: "Talep artık bu personelde değil; devir isteği kabul edilemedi.",
        });
      }

      const device = await recordDevice(req);

      await prisma.ticket.update({
        where: { id: handoverRequest.ticketId },
        data: { assignedToId: req.user.id },
      });

      await prisma.ticketLog.create({
        data: {
          ticketId: handoverRequest.ticketId,
          type: "DEVIR_KABUL_EDILDI",
          description: responseNote?.trim() || null,
          previousValue: String(handoverRequest.requestedById),
          newValue: String(req.user.id),
          userId: req.user.id,
          deviceId: device?.id ?? null,
        },
      });

      await notifyUser({
        userId: handoverRequest.requestedById,
        ticketId: handoverRequest.ticketId,
        title: "Devir İsteği Kabul Edildi",
        message: `${req.user.name}, ${ticket.ticketNumber} numaralı talebi devraldı.`,
        type: "DEVIR_ISTEGI_SONUCLANDI",
      });

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: handoverRequest.ticketId },
        include: ticketInclude,
      });

      return res.status(200).json({
        message: "Devir isteği kabul edildi.",
        handoverRequest,
        ticket: stripDeviceInfoForPersonel(updatedTicket, req.user),
      });
    }

    // REJECTED
    const device = await recordDevice(req);

    await prisma.ticketLog.create({
      data: {
        ticketId: handoverRequest.ticketId,
        type: "DEVIR_REDDEDILDI",
        description: responseNote?.trim() || null,
        userId: req.user.id,
        deviceId: device?.id ?? null,
      },
    });

    await notifyUser({
      userId: handoverRequest.requestedById,
      ticketId: handoverRequest.ticketId,
      title: "Devir İsteği Reddedildi",
      message: `${req.user.name}, ${handoverRequest.ticket.ticketNumber} numaralı talebi devralmayı reddetti.`,
      type: "DEVIR_ISTEGI_SONUCLANDI",
    });

    return res.status(200).json({
      message: "Devir isteği reddedildi.",
      handoverRequest,
    });
  } catch (error) {
    console.error("respondHandoverRequest error:", error);

    return res.status(500).json({
      message: "Devir isteği yanıtlanırken bir hata oluştu.",
    });
  }
};

// PATCH /api/handover-requests/:id/cancel — yalnızca isteği oluşturan kişi,
// PENDING iken iptal edebilir.
export const cancelHandoverRequest = async (req, res) => {
  try {
    const requestId = parseId(req.params.id);

    if (!requestId) {
      return res.status(400).json({ message: "Geçersiz devir isteği kimliği." });
    }

    const claim = await prisma.handoverRequest.updateMany({
      where: {
        id: requestId,
        requestedById: req.user.id,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
        respondedAt: new Date(),
      },
    });

    if (claim.count === 0) {
      const existing = await prisma.handoverRequest.findUnique({
        where: { id: requestId },
      });

      if (!existing) {
        return res.status(404).json({ message: "Devir isteği bulunamadı." });
      }

      if (existing.requestedById !== req.user.id) {
        return res.status(403).json({
          message: "Bu isteği iptal etme yetkiniz yok.",
        });
      }

      return res.status(409).json({
        message: "Bu istek zaten sonuçlandırılmış.",
      });
    }

    const handoverRequest = await prisma.handoverRequest.findUnique({
      where: { id: requestId },
      include: handoverInclude,
    });

    const device = await recordDevice(req);

    await prisma.ticketLog.create({
      data: {
        ticketId: handoverRequest.ticketId,
        type: "DEVIR_IPTAL_EDILDI",
        userId: req.user.id,
        deviceId: device?.id ?? null,
      },
    });

    return res.status(200).json({
      message: "Devir isteği iptal edildi.",
      handoverRequest,
    });
  } catch (error) {
    console.error("cancelHandoverRequest error:", error);

    return res.status(500).json({
      message: "Devir isteği iptal edilirken bir hata oluştu.",
    });
  }
};
