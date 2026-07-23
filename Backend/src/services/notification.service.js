import prisma from "../config/prisma.js";
import { getIO } from "../socket/index.js";
import { userRoom } from "../socket/rooms.js";

const notificationInclude = {
  ticket: {
    select: {
      id: true,
      ticketNumber: true,
      title: true,
      priority: true,
      status: true,
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  },
};

// Bildirimi ÖNCE veritabanına yazar, SONRA ilgili kullanıcının socket
// odasına yayınlar. Bu sıra bilinçlidir: socket bağlantısı kopuk/yok olsa
// bile bildirim kaybolmaz — kullanıcı tekrar bağlandığında veya sayfayı
// yenilediğinde GET /api/notifications ile aynı kaydı görür. Hata
// durumunda fırlatmaz; çağıran akış (talep oluşturma/güncelleme) bir
// bildirim hatası yüzünden başarısız olmamalı.
export const notifyUser = async ({ userId, ticketId = null, title, message, type }) => {
  try {
    const notification = await prisma.notification.create({
      data: { userId, ticketId, title, message, type },
      include: notificationInclude,
    });

    getIO()?.to(userRoom(userId)).emit("notification:new", notification);

    return notification;
  } catch (error) {
    console.error("[notification] Bildirim oluşturulamadı:", error.message);
    return null;
  }
};

export const notifyUsers = async (userIds, payload) => {
  const uniqueIds = [...new Set(userIds)];
  return Promise.all(uniqueIds.map((userId) => notifyUser({ ...payload, userId })));
};

export const notifyRole = async (role, payload) => {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });

  return notifyUsers(
    users.map((user) => user.id),
    payload
  );
};

export const notifySpecializationTechnicians = async (
  specializationId,
  payload,
  excludeUserId = null
) => {
  const users = await prisma.user.findMany({
    where: {
      role: "TEKNIK_PERSONEL",
      isActive: true,
      specializations: { some: { id: specializationId } },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  return notifyUsers(
    users.map((user) => user.id),
    payload
  );
};
