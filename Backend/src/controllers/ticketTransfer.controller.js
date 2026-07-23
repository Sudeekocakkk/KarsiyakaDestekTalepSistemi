import prisma from "../config/prisma.js";
import {
  enqueueAssignmentEmail,
  stripDeviceInfoForPersonel,
  ticketInclude,
} from "./ticket.controller.js";
import { recordDevice } from "../services/device.service.js";
import { findTechnicianWithLeastLoad } from "../services/ticketAssignment.service.js";
import { notifyRole, notifyUser } from "../services/notification.service.js";

const CLOSED_STATUSES = ["COZULDU", "IPTAL_EDILDI"];

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// POST /api/tickets/:id/transfer — bir talebi, atanmış teknik personelin
// (veya ADMIN'in) başka bir uzmanlık alanına (isteğe bağlı olarak belirli
// bir kişiye) aktarması. Önceki personelin TicketLog kayıtları asla
// silinmez; bu uç yalnızca yeni bir TicketTransfer + TicketLog satırı
// ekler ve Ticket.assignedToId'yi günceller.
export const transferTicket = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);

    if (!ticketId) {
      return res.status(400).json({ message: "Geçersiz talep kimliği." });
    }

    const { toSpecializationId, toUserId, reason, workDescription } = req.body;
    const parsedSpecializationId = Number(toSpecializationId);
    const parsedToUserId =
      toUserId !== undefined && toUserId !== null && toUserId !== ""
        ? Number(toUserId)
        : null;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      return res.status(404).json({ message: "Talep bulunamadı." });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isAssignedTechnician =
      req.user.role === "TEKNIK_PERSONEL" && ticket.assignedToId === req.user.id;

    if (!isAdmin && !isAssignedTechnician) {
      return res.status(403).json({
        message: "Bu talep size atanmadığı için aktaramazsınız.",
      });
    }

    if (CLOSED_STATUSES.includes(ticket.status)) {
      return res.status(400).json({
        message: "Çözülmüş veya iptal edilmiş bir talep başka bir uzmanlığa aktarılamaz.",
      });
    }

    const specialization = await prisma.specialization.findFirst({
      where: { id: parsedSpecializationId, isActive: true },
    });

    if (!specialization) {
      return res.status(404).json({
        message: "Hedef uzmanlık alanı bulunamadı veya aktif değil.",
      });
    }

    let targetTechnicianId = null;

    if (parsedToUserId) {
      const targetTechnician = await prisma.user.findFirst({
        where: {
          id: parsedToUserId,
          role: "TEKNIK_PERSONEL",
          isActive: true,
          specializations: { some: { id: parsedSpecializationId } },
        },
      });

      if (!targetTechnician) {
        return res.status(400).json({
          message: "Seçilen personel bu uzmanlık alanında aktif değil.",
        });
      }

      targetTechnicianId = targetTechnician.id;
    } else {
      targetTechnicianId = await findTechnicianWithLeastLoad(parsedSpecializationId);

      if (!targetTechnicianId) {
        return res.status(400).json({
          message: "Bu uzmanlık alanında aktif teknik personel bulunamadı.",
        });
      }
    }

    const trimmedReason = reason.trim();
    const trimmedWorkDescription = workDescription.trim();
    const device = await recordDevice(req);

    // Sıralı, üst düzey sorgular (bkz. ticket.controller.js'teki
    // $transaction/nested-write kaçınma gerekçesi) — proje konvansiyonu.
    await prisma.ticketTransfer.create({
      data: {
        ticketId,
        fromUserId: req.user.id,
        toSpecializationId: parsedSpecializationId,
        toUserId: targetTechnicianId,
        reason: trimmedReason,
        workDescription: trimmedWorkDescription,
      },
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId: targetTechnicianId,
        status: "ATANDI",
      },
    });

    await prisma.ticketLog.create({
      data: {
        ticketId,
        type: "UZMANLIGA_AKTARILDI",
        description:
          `İşlem: ${trimmedWorkDescription}\n` +
          `Aktarma nedeni: ${trimmedReason}\n` +
          `Hedef uzmanlık: ${specialization.name}`,
        previousValue: ticket.assignedToId ? String(ticket.assignedToId) : null,
        newValue: String(targetTechnicianId),
        userId: req.user.id,
        deviceId: device?.id ?? null,
      },
    });

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: ticketInclude,
    });

    if (updatedTicket.assignedTo) {
      await enqueueAssignmentEmail(updatedTicket.assignedTo, updatedTicket);
    }

    await notifyUser({
      userId: targetTechnicianId,
      ticketId,
      title: "Yeni Talep Atandı",
      message: `${updatedTicket.ticketNumber} numaralı talep ${specialization.name} uzmanlık alanına aktarıldı ve size atandı.`,
      type: "TALEP_ATANDI",
    });

    if (ticket.assignedToId && ticket.assignedToId !== targetTechnicianId) {
      await notifyUser({
        userId: ticket.assignedToId,
        ticketId,
        title: "Talep Aktarıldı",
        message: `${updatedTicket.ticketNumber} numaralı talebi ${specialization.name} uzmanlık alanına devrettiniz.`,
        type: "TALEP_DEVREDILDI",
      });
    }

    await notifyRole("ADMIN", {
      ticketId,
      title: "Talep Uzmanlığa Aktarıldı",
      message: `${updatedTicket.ticketNumber} numaralı talep ${specialization.name} uzmanlık alanına aktarıldı.`,
      type: "TALEP_DEVREDILDI",
    });

    return res.status(200).json({
      message: "Talep başarıyla aktarıldı.",
      ticket: stripDeviceInfoForPersonel(updatedTicket, req.user),
    });
  } catch (error) {
    console.error("transferTicket error:", error);

    return res.status(500).json({
      message: "Talep aktarılırken bir hata oluştu.",
    });
  }
};
