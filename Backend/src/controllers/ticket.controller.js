import prisma from "../config/prisma.js";
import { sendMail } from "../utils/mailer.js";

const sendAssignmentEmail = async (technician, ticket) => {
  if (!technician?.email) {
    console.error(
      `[ticket-assign-mail] Teknik personelin (id: ${technician?.id}) e-posta adresi boş; mail gönderilemiyor.`
    );
    return;
  }

  await sendMail({
    to: technician.email,
    subject: `Yeni Talep Atandı: ${ticket.ticketNumber}`,
    text:
      `Merhaba ${technician.name},\n\n` +
      `"${ticket.title}" başlıklı (${ticket.ticketNumber}) destek talebi size atandı.\n\n` +
      `Öncelik: ${ticket.priority}\n` +
      `Açıklama: ${ticket.description}\n\n` +
      "Karşıyaka Destek",
  });
};

const VALID_TICKET_STATUSES = [
  "YENI",
  "ATANDI",
  "ISLEMDE",
  "BEKLEMEDE",
  "COZULDU",
  "IPTAL_EDILDI",
];

const ticketInclude = {
  category: true,
  attachments: true,
  department: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  logs: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const generateTicketNumber = async () => {
  const count = await prisma.ticket.count();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  return `KD-${date}-${String(count + 1).padStart(4, "0")}`;
};

const findTechnicianWithLeastLoad = async (specializationId) => {
  const technicians = await prisma.user.findMany({
    where: {
      role: "TEKNIK_PERSONEL",
      isActive: true,
      specializations: {
        some: {
          id: specializationId,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          assignedTickets: {
            where: {
              status: {
                notIn: ["COZULDU", "IPTAL_EDILDI"],
              },
            },
          },
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  if (technicians.length === 0) {
    return null;
  }

  technicians.sort(
    (a, b) => a._count.assignedTickets - b._count.assignedTickets
  );

  return technicians[0].id;
};

const canViewTicket = (ticket, user) => {
  if (user.role === "ADMIN") {
    return true;
  }

  if (user.role === "PERSONEL") {
    return ticket.createdById === user.id;
  }

  if (user.role === "TEKNIK_PERSONEL") {
    return ticket.assignedToId === user.id;
  }

  return false;
};

export const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      priority = "NORMAL",
      location,
      creatorId,
      createdById,
    } = req.body;

    if (creatorId !== undefined || createdById !== undefined) {
      return res.status(400).json({
        message:
          "Talep oluşturucu bilgisi gönderilemez. Oluşturan kullanıcı oturum bilgisinden alınır.",
      });
    }

    if (!title?.trim() || !description?.trim() || !categoryId) {
      return res.status(400).json({
        message: "Başlık, açıklama ve kategori zorunludur.",
      });
    }

    const parsedCategoryId = parseId(categoryId);

    if (!parsedCategoryId) {
      return res.status(400).json({
        message: "Geçerli bir kategori seçmelisiniz.",
      });
    }

    const validPriorities = ["DUSUK", "NORMAL", "YUKSEK", "ACIL"];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        message: "Geçersiz öncelik değeri.",
      });
    }

    if (!req.user.departmentId) {
      return res.status(400).json({
        message:
          "Talep oluşturmak için hesabınıza bağlı bir müdürlük bulunmalıdır.",
      });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: parsedCategoryId,
        isActive: true,
      },
      include: {
        specialization: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Kategori bulunamadı veya aktif değil.",
      });
    }

    const assignedToId = await findTechnicianWithLeastLoad(
      category.specializationId
    );

    const logs = [
      {
        type: "TALEP_OLUSTURULDU",
        description: "Destek talebi oluşturuldu.",
        userId: req.user.id,
      },
    ];

    if (assignedToId) {
      logs.push({
        type: "PERSONEL_ATANDI",
        description: "Talep otomatik olarak teknik personele atandı.",
        userId: req.user.id,
        newValue: String(assignedToId),
      });
    }

    const uploadedFiles = req.files || [];
    const ticketNumber = await generateTicketNumber();

    // Bilinçli olarak nested-write (`attachments: { create }`, `logs: { create }`)
    // veya prisma.$transaction yerine ayrı, üst düzey ve sırayla await edilen
    // sorgular kullanılır. node-postgres'teki "client zaten bir sorgu
    // çalıştırırken tekrar query()" deprecation uyarısının gerçek kaynağı
    // Prisma'nın (7.8.0) sürücü adaptörü tabanlı sorgu derleyicisidir: hem
    // nested write'lar hem de prisma.$transaction, aynı bağlantı üzerinde
    // birden fazla ifade çalıştırılmasını gerektiren bir "işlem düğümleri"
    // planı oluşturuyor ve bu düğümleri (kod tarafımızda her adım tek tek
    // await edilse bile) dahili olarak Array.map ile eşzamanlı yürütüyor
    // (bkz. @prisma/client/runtime/client.js içindeki interpretNode). Bu,
    // uygulama kodumuzdaki eksik bir await değil, Prisma'nın kendi çalışma
    // zamanının davranışı; tarafımızdan düzeltilemez. Aşağıdaki gibi her
    // sorguyu bağımsız, üst düzey bir prisma çağrısı olarak (implicit/explicit
    // transaction'a hiç girmeden) sırayla çalıştırmak bu kod yolunu tamamen
    // atlar ve uyarıyı ortadan kaldırır.
    const created = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: title.trim(),
        description: description.trim(),
        categoryId: parsedCategoryId,
        priority,
        location: location?.trim() || null,
        createdById: req.user.id,
        departmentId: req.user.departmentId,
        assignedToId,
        status: assignedToId ? "ATANDI" : "YENI",
      },
    });

    for (const file of uploadedFiles) {
      await prisma.ticketAttachment.create({
        data: {
          ticketId: created.id,
          originalName: file.originalname,
          fileName: file.filename,
          fileUrl: `/uploads/tickets/${file.filename}`,
          mimeType: file.mimetype,
          fileSize: file.size,
        },
      });
    }

    for (const log of logs) {
      await prisma.ticketLog.create({
        data: { ...log, ticketId: created.id },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: created.id },
      include: ticketInclude,
    });

    // Otomatik atama akışı: ticket.assignedTo, ticketInclude sayesinde
    // {id, name, email, role} olarak zaten geliyor, ek sorguya gerek yok.
    if (assignedToId && ticket.assignedTo) {
      await sendAssignmentEmail(ticket.assignedTo, ticket);
    }

    return res.status(201).json({
      message: assignedToId
        ? "Destek talebi oluşturuldu ve otomatik atandı."
        : "Destek talebi oluşturuldu.",
      ticket,
    });
  } catch (error) {
    console.error("createTicket error:", error);

    return res.status(500).json({
      message: "Talep oluşturulurken bir hata oluştu.",
    });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const { status, priority, categoryId } = req.query;

    const where = {
      createdById: req.user.id,
    };

    if (status) {
      if (!VALID_TICKET_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Geçersiz talep durumu.",
        });
      }

      where.status = status;
    }

    if (priority) where.priority = priority;

    if (categoryId) {
      const parsedCategoryId = parseId(categoryId);

      if (!parsedCategoryId) {
        return res.status(400).json({
          message: "Geçersiz kategori kimliği.",
        });
      }

      where.categoryId = parsedCategoryId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        category: true,
        department: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("getMyTickets error:", error);

    return res.status(500).json({
      message: "Talepler alınırken bir hata oluştu.",
    });
  }
};

export const getAssignedTickets = async (req, res) => {
  try {
    const { status, priority, categoryId } = req.query;

    const where = {
      assignedToId: req.user.id,
    };

    if (status) {
      if (!VALID_TICKET_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Geçersiz talep durumu.",
        });
      }

      where.status = status;
    }

    if (priority) where.priority = priority;

    if (categoryId) {
      const parsedCategoryId = parseId(categoryId);

      if (!parsedCategoryId) {
        return res.status(400).json({
          message: "Geçersiz kategori kimliği.",
        });
      }

      where.categoryId = parsedCategoryId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        category: true,
        department: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("getAssignedTickets error:", error);

    return res.status(500).json({
      message: "Atanan talepler alınırken bir hata oluştu.",
    });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      categoryId,
      assignedToId,
      assignedUserId,
      createdById,
      creatorId,
      search,
    } = req.query;

    const where = {};

    if (status) {
      if (!VALID_TICKET_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Geçersiz talep durumu." });
      }
      where.status = status;
    }

    if (priority) where.priority = priority;

    if (categoryId) {
      const parsedCategoryId = parseId(categoryId);
      if (!parsedCategoryId) {
        return res.status(400).json({ message: "Geçersiz kategori kimliği." });
      }
      where.categoryId = parsedCategoryId;
    }

    const assigneeFilter = assignedToId || assignedUserId;

    if (assigneeFilter) {
      const parsedAssignedToId = parseId(assigneeFilter);
      if (!parsedAssignedToId) {
        return res.status(400).json({ message: "Geçersiz personel kimliği." });
      }
      where.assignedToId = parsedAssignedToId;
    }

    const creatorFilter = createdById || creatorId;

    if (creatorFilter) {
      const parsedCreatedById = parseId(creatorFilter);
      if (!parsedCreatedById) {
        return res.status(400).json({ message: "Geçersiz kullanıcı kimliği." });
      }
      where.createdById = parsedCreatedById;
    }

    if (search?.trim()) {
      where.OR = [
        {
          title: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        category: true,
        department: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            departmentId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("getAllTickets error:", error);

    return res.status(500).json({
      message: "Talepler alınırken bir hata oluştu.",
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);

    if (!ticketId) {
      return res.status(400).json({
        message: "Geçersiz talep kimliği.",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: ticketInclude,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Talep bulunamadı.",
      });
    }

    if (!canViewTicket(ticket, req.user)) {
      return res.status(403).json({
        message: "Bu talebi görüntüleme yetkiniz yok.",
      });
    }

    return res.status(200).json({
      ticket,
    });
  } catch (error) {
    console.error("getTicketById error:", error);

    return res.status(500).json({
      message: "Talep alınırken bir hata oluştu.",
    });
  }
};

// Talep detay ekranındaki tek "Kaydet" butonunun karşılığıdır: personel atama,
// durum değişikliği, çözüm açıklaması ve açıklama/not ekleme işlemlerinin
// hepsini tek bir atomik Prisma güncellemesinde (nested `logs.create`) toplar.
// Yalnızca body'de gönderilen alanlar işlenir; her alan için rol/sahiplik
// kontrolü ayrı ayrı yapılır.
export const updateTicket = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);

    if (!ticketId) {
      return res.status(400).json({
        message: "Geçersiz talep kimliği.",
      });
    }

    const { assignedToId, status, resolutionDescription, message } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Talep bulunamadı.",
      });
    }

    if (!canViewTicket(ticket, req.user)) {
      return res.status(403).json({
        message: "Bu talebi güncelleme yetkiniz yok.",
      });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isAssignedTechnician =
      req.user.role === "TEKNIK_PERSONEL" && ticket.assignedToId === req.user.id;

    const data = {};
    const logs = [];
    let technicianToNotify = null;

    // Personele atama — yalnızca ADMIN.
    if (assignedToId !== undefined && assignedToId !== null && assignedToId !== "") {
      if (!isAdmin) {
        return res.status(403).json({
          message: "Personel atama yetkisi yalnızca yöneticidedir.",
        });
      }

      const parsedAssignedToId = parseId(assignedToId);

      if (!parsedAssignedToId) {
        return res.status(400).json({
          message: "Geçerli bir personel kimliği gönderilmelidir.",
        });
      }

      if (parsedAssignedToId !== ticket.assignedToId) {
        const assignedUser = await prisma.user.findFirst({
          where: {
            id: parsedAssignedToId,
            role: "TEKNIK_PERSONEL",
            isActive: true,
          },
        });

        if (!assignedUser) {
          return res.status(404).json({
            message: "Aktif teknik personel bulunamadı.",
          });
        }

        data.assignedToId = parsedAssignedToId;

        if (ticket.status === "YENI") {
          data.status = "ATANDI";
        }

        logs.push({
          type: "PERSONEL_ATANDI",
          description: "Talep teknik personele atandı.",
          userId: req.user.id,
          previousValue: ticket.assignedToId ? String(ticket.assignedToId) : null,
          newValue: String(parsedAssignedToId),
        });

        technicianToNotify = assignedUser;
      }
    }

    // Durum değişikliği — ADMIN veya yalnızca kendisine atanmış talep için TEKNIK_PERSONEL.
    if (status !== undefined && status !== null && status !== "") {
      if (!VALID_TICKET_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Geçersiz talep durumu.",
        });
      }

      if (!isAdmin && !isAssignedTechnician) {
        return res.status(403).json({
          message: "Yalnızca size atanmış taleplerin durumunu güncelleyebilirsiniz.",
        });
      }

      if (status !== ticket.status) {
        data.status = status;
        data.resolvedAt = status === "COZULDU" ? new Date() : ticket.resolvedAt;
        data.closedAt = status === "IPTAL_EDILDI" ? new Date() : ticket.closedAt;

        logs.push({
          type: "DURUM_DEGISTIRILDI",
          description: "Talep durumu güncellendi.",
          userId: req.user.id,
          previousValue: ticket.status,
          newValue: status,
        });
      }
    }

    // Çözüm açıklaması — ADMIN veya yalnızca kendisine atanmış talep için TEKNIK_PERSONEL.
    if (resolutionDescription !== undefined && resolutionDescription !== null) {
      const trimmedSolution = resolutionDescription.trim();

      if (trimmedSolution && trimmedSolution !== (ticket.resolutionDescription || "")) {
        if (!isAdmin && !isAssignedTechnician) {
          return res.status(403).json({
            message: "Yalnızca size atanmış taleplere çözüm açıklaması ekleyebilirsiniz.",
          });
        }

        data.resolutionDescription = trimmedSolution;

        logs.push({
          type: "COZUM_EKLENDI",
          description: trimmedSolution,
          userId: req.user.id,
        });
      }
    }

    // Açıklama / not — talebi görüntüleme yetkisi olan herkes (canViewTicket'ta kontrol edildi).
    if (message !== undefined && message !== null) {
      const trimmedMessage = message.trim();

      if (trimmedMessage) {
        logs.push({
          type: "ACIKLAMA_EKLENDI",
          description: trimmedMessage,
          userId: req.user.id,
        });
      }
    }

    if (Object.keys(data).length === 0 && logs.length === 0) {
      return res.status(400).json({
        message: "Güncellenecek bir alan gönderilmedi.",
      });
    }

    // Bilinçli olarak nested `logs: { create: ... }` veya prisma.$transaction
    // yerine ayrı, üst düzey ve sırayla await edilen sorgular kullanılır
    // (bkz. createTicket üzerindeki ayrıntılı gerekçe): node-postgres'teki
    // "client zaten bir sorgu çalıştırırken tekrar query()" uyarısının
    // kaynağı, Prisma 7.8.0'ın sürücü adaptörü sorgu derleyicisinin bir
    // transaction/nested-write içindeki ifadeleri dahili olarak eşzamanlı
    // yürütmesidir; bizim await sıramızla ilgisi yok. Aşağıdaki gibi hiç
    // transaction'a girmeden ayrı üst düzey çağrılar yapmak bu kod yolunu
    // atlar ve uyarıyı ortadan kaldırır.
    if (Object.keys(data).length > 0) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data,
      });
    }

    for (const log of logs) {
      await prisma.ticketLog.create({
        data: { ...log, ticketId },
      });
    }

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: ticketInclude,
    });

    // Manuel atama akışı (admin, "Personele Ata" alanı üzerinden).
    if (technicianToNotify) {
      await sendAssignmentEmail(technicianToNotify, updatedTicket);
    }

    return res.status(200).json({
      message: "Talep güncellendi.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("updateTicket error:", error);

    return res.status(500).json({
      message: "Talep güncellenirken bir hata oluştu.",
    });
  }
};
