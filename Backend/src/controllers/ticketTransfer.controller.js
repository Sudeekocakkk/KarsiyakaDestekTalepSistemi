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

// POST /api/tickets/:id/transfer — "İşi Devret": atanmış teknik personelin
// (veya ADMIN'in) talebi doğrudan (onay beklemeden) başka bir teknik
// personele atamasıdır. Hedef uzmanlık VE hedef personel alanlarının
// ikisi de "Fark Etmez" olabilir:
//   - Uzmanlık verilmemiş + personel verilmemiş → tüm aktif teknik
//     personeller arasından en az yüklü olan otomatik atanır.
//   - Uzmanlık verilmiş + personel verilmemiş → yalnızca o uzmanlıktaki
//     en az yüklü aktif personel otomatik atanır.
//   - Personel verilmişse (uzmanlık verilmiş/verilmemiş fark etmeksizin)
//     doğrudan o kişiye atanır (uzmanlık verilmişse kişinin o uzmanlıkta
//     olduğu doğrulanır).
// Önceki personelin TicketLog kayıtları asla silinmez; bu uç yalnızca yeni
// bir TicketTransfer + TicketLog satırı ekler ve Ticket.assignedToId'yi günceller.
export const transferTicket = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);

    if (!ticketId) {
      return res.status(400).json({ message: "Geçersiz talep kimliği." });
    }

    const { toSpecializationId, toUserId } = req.body;
    const parsedSpecializationId =
      toSpecializationId !== undefined && toSpecializationId !== null && toSpecializationId !== ""
        ? Number(toSpecializationId)
        : null;
    const parsedToUserId =
      toUserId !== undefined && toUserId !== null && toUserId !== ""
        ? Number(toUserId)
        : null;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Talep bulunamadı." });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isAssignedTechnician =
      req.user.role === "TEKNIK_PERSONEL" && ticket.assignedToId === req.user.id;

    if (!isAdmin && !isAssignedTechnician) {
      return res.status(403).json({
        message: "Bu talep size atanmadığı için devredemezsiniz.",
      });
    }

    if (CLOSED_STATUSES.includes(ticket.status)) {
      return res.status(400).json({
        message: "Çözülmüş veya iptal edilmiş bir talep devredilemez.",
      });
    }

    let specialization = null;

    if (parsedSpecializationId) {
      specialization = await prisma.specialization.findFirst({
        where: { id: parsedSpecializationId, isActive: true },
      });

      if (!specialization) {
        return res.status(404).json({
          message: "Hedef uzmanlık alanı bulunamadı veya aktif değil.",
        });
      }
    }

    let targetTechnicianId = null;

    if (parsedToUserId) {
      const targetTechnician = await prisma.user.findFirst({
        where: {
          id: parsedToUserId,
          role: "TEKNIK_PERSONEL",
          isActive: true,
          ...(parsedSpecializationId
            ? { specializations: { some: { id: parsedSpecializationId } } }
            : {}),
        },
      });

      if (!targetTechnician) {
        return res.status(400).json({
          message: parsedSpecializationId
            ? "Seçilen personel bu uzmanlık alanında aktif değil."
            : "Seçilen personel aktif değil.",
        });
      }

      targetTechnicianId = targetTechnician.id;
    } else {
      targetTechnicianId = await findTechnicianWithLeastLoad(parsedSpecializationId);

      if (!targetTechnicianId) {
        return res.status(400).json({
          message: parsedSpecializationId
            ? "Bu uzmanlık alanında aktif teknik personel bulunamadı."
            : "Sistemde aktif teknik personel bulunamadı.",
        });
      }
    }

    const targetTechnician = await prisma.user.findUnique({
      where: { id: targetTechnicianId },
      select: { id: true, name: true },
    });

    const device = await recordDevice(req);
    const specializationLabel = specialization ? specialization.name : "Fark Etmez";

    // Sıralı, üst düzey sorgular (bkz. ticket.controller.js'teki
    // $transaction/nested-write kaçınma gerekçesi) — proje konvansiyonu.
    await prisma.ticketTransfer.create({
      data: {
        ticketId,
        fromUserId: req.user.id,
        toSpecializationId: parsedSpecializationId,
        toUserId: targetTechnicianId,
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
          `Eski personel: ${ticket.assignedTo?.name || "Atanmamış"}\n` +
          `Yeni personel: ${targetTechnician.name}\n` +
          `Seçilen uzmanlık: ${specializationLabel}\n` +
          `İşlemi yapan: ${req.user.name}`,
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

    // Yeni atanan personele: TALEP_ATANDI tipi masaüstü bildirimini de
    // tetikler (bkz. NotificationContext.jsx) — yalnızca bu kişinin
    // socket odasına (user:{id}) gönderilir, başka kimseye gitmez.
    await notifyUser({
      userId: targetTechnicianId,
      ticketId,
      title: "Yeni Talep Atandı",
      message: `${updatedTicket.ticketNumber} numaralı talep ${req.user.name} tarafından size devredildi.`,
      type: "TALEP_ATANDI",
    });

    if (ticket.assignedToId && ticket.assignedToId !== targetTechnicianId) {
      await notifyUser({
        userId: ticket.assignedToId,
        ticketId,
        title: "Talep Devredildi",
        message: `${updatedTicket.ticketNumber} numaralı talep ${req.user.name} tarafından ${targetTechnician.name} kişisine devredildi.`,
        type: "TALEP_DEVREDILDI",
      });
    }

    await notifyRole("ADMIN", {
      ticketId,
      title: "Talep Devredildi",
      message: `${updatedTicket.ticketNumber} numaralı talep ${targetTechnician.name} kişisine devredildi.`,
      type: "TALEP_DEVREDILDI",
    });

    return res.status(200).json({
      message: "Talep başarıyla devredildi.",
      ticket: stripDeviceInfoForPersonel(updatedTicket, req.user),
    });
  } catch (error) {
    console.error("transferTicket error:", error);

    return res.status(500).json({
      message: "Talep devredilirken bir hata oluştu.",
    });
  }
};
