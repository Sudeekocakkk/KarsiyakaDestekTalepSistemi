import prisma from "../config/prisma.js";

const VALID_NOTIFICATION_TYPES = [
  "YENI_TALEP",
  "TALEP_ATANDI",
  "TALEP_DEVREDILDI",
  "TALEP_DURUM_DEGISTI",
  "DEVIR_ISTEGI_ALINDI",
  "DEVIR_ISTEGI_SONUCLANDI",
];

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

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

// GET /api/notifications — oturum açmış kullanıcının kendi bildirimleri.
export const getMyNotifications = async (req, res) => {
  try {
    const { isRead, limit } = req.query;

    const where = { userId: req.user.id };

    if (isRead !== undefined) {
      if (!["true", "false"].includes(isRead)) {
        return res.status(400).json({
          message: "isRead değeri true veya false olmalıdır.",
        });
      }
      where.isRead = isRead === "true";
    }

    const parsedLimit = limit ? Number(limit) : 50;
    const take = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: notificationInclude,
        orderBy: { createdAt: "desc" },
        take,
      }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      }),
    ]);

    return res.status(200).json({
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("getMyNotifications error:", error);

    return res.status(500).json({
      message: "Bildirimler alınırken bir hata oluştu.",
    });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const notificationId = parseId(req.params.id);

    if (!notificationId) {
      return res.status(400).json({
        message: "Geçersiz bildirim kimliği.",
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({
        message: "Bildirim bulunamadı.",
      });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        message: "Bu bildirimi görüntüleme yetkiniz yok.",
      });
    }

    const updated = notification.isRead
      ? notification
      : await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true, readAt: new Date() },
        });

    return res.status(200).json({
      message: "Bildirim okundu olarak işaretlendi.",
      notification: updated,
    });
  } catch (error) {
    console.error("markNotificationRead error:", error);

    return res.status(500).json({
      message: "Bildirim güncellenirken bir hata oluştu.",
    });
  }
};

// PATCH /api/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({
      message: "Tüm bildirimler okundu olarak işaretlendi.",
    });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);

    return res.status(500).json({
      message: "Bildirimler güncellenirken bir hata oluştu.",
    });
  }
};

// GET /api/notifications/admin — ADMIN, tüm bildirimleri tür/alıcı/okunma
// durumuna göre filtreleyerek görüntüler.
export const getAllNotificationsAdmin = async (req, res) => {
  try {
    const { type, userId, isRead, limit } = req.query;

    const where = {};

    if (type) {
      if (!VALID_NOTIFICATION_TYPES.includes(type)) {
        return res.status(400).json({
          message: "Geçersiz bildirim türü.",
        });
      }
      where.type = type;
    }

    if (userId) {
      const parsedUserId = parseId(userId);
      if (!parsedUserId) {
        return res.status(400).json({
          message: "Geçersiz kullanıcı kimliği.",
        });
      }
      where.userId = parsedUserId;
    }

    if (isRead !== undefined) {
      if (!["true", "false"].includes(isRead)) {
        return res.status(400).json({
          message: "isRead değeri true veya false olmalıdır.",
        });
      }
      where.isRead = isRead === "true";
    }

    const parsedLimit = limit ? Number(limit) : 100;
    const take = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 300) : 100;

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        ...notificationInclude,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    return res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("getAllNotificationsAdmin error:", error);

    return res.status(500).json({
      message: "Bildirimler alınırken bir hata oluştu.",
    });
  }
};
