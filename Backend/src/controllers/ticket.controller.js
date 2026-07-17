import prisma from "../config/prisma.js";

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

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: await generateTicketNumber(),
        title: title.trim(),
        description: description.trim(),
        categoryId: parsedCategoryId,
        priority,
        location: location?.trim() || null,
        createdById: req.user.id,
        departmentId: req.user.departmentId,
        assignedToId,
        status: assignedToId ? "ATANDI" : "YENI",

        attachments: {
          create: uploadedFiles.map((file) => ({
            originalName: file.originalname,
            fileName: file.filename,
            fileUrl: `/uploads/tickets/${file.filename}`,
            mimeType: file.mimetype,
            fileSize: file.size,
          })),
        },

        logs: {
          create: logs,
        },
      },
      include: ticketInclude,
    });

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

    if (status) where.status = status;
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

    if (status) where.status = status;
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

    if (status) where.status = status;
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

export const assignTicket = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);
    const assignedToId = parseId(
      req.body.assignedToId ?? req.body.assignedUserId
    );

    if (!ticketId || !assignedToId) {
      return res.status(400).json({
        message: "Geçerli talep ve personel kimliği gönderilmelidir.",
      });
    }

    const [ticket, assignedUser] = await Promise.all([
      prisma.ticket.findUnique({
        where: { id: ticketId },
      }),
      prisma.user.findFirst({
        where: {
          id: assignedToId,
          role: "TEKNIK_PERSONEL",
          isActive: true,
        },
      }),
    ]);

    if (!ticket) {
      return res.status(404).json({
        message: "Talep bulunamadı.",
      });
    }

    if (!assignedUser) {
      return res.status(404).json({
        message: "Aktif teknik personel bulunamadı.",
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        assignedToId,
        status: ticket.status === "YENI" ? "ATANDI" : ticket.status,
        logs: {
          create: {
            type: "PERSONEL_ATANDI",
            description: "Talep teknik personele atandı.",
            userId: req.user.id,
            newValue: String(assignedToId),
          },
        },
      },
      include: ticketInclude,
    });

    return res.status(200).json({
      message: "Talep personele atandı.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("assignTicket error:", error);

    return res.status(500).json({
      message: "Talep atanırken bir hata oluştu.",
    });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);
    const { status } = req.body;

    const validStatuses = [
      "YENI",
      "ATANDI",
      "ISLEMDE",
      "BEKLEMEDE",
      "COZULDU",
      "IPTAL_EDILDI",
    ];

    if (!ticketId) {
      return res.status(400).json({
        message: "Geçersiz talep kimliği.",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Geçersiz talep durumu.",
      });
    }

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

if (
  req.user.role === "TEKNIK_PERSONEL" &&
  ticket.assignedToId !== req.user.id
) {
  return res.status(403).json({
    message: "Yalnızca size atanmış taleplerin durumunu güncelleyebilirsiniz.",
  });
}


    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        status,
        resolvedAt: status === "COZULDU" ? new Date() : ticket.resolvedAt,
        closedAt: status === "IPTAL_EDILDI" ? new Date() : ticket.closedAt,
        logs: {
          create: {
            type: "DURUM_DEGISTIRILDI",
            description: "Talep durumu güncellendi.",
            userId: req.user.id,
            previousValue: ticket.status,
            newValue: status,
          },
        },
      },
      include: ticketInclude,
    });

    return res.status(200).json({
      message: "Talep durumu güncellendi.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("updateTicketStatus error:", error);

    return res.status(500).json({
      message: "Talep durumu güncellenirken bir hata oluştu.",
    });
  }
};

export const addSolution = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);
    const { solutionDescription, resolutionDescription } = req.body;
    const solutionText = resolutionDescription ?? solutionDescription;

    if (!ticketId) {
      return res.status(400).json({
        message: "Geçersiz talep kimliği.",
      });
    }

    if (!solutionText?.trim()) {
      return res.status(400).json({
        message: "Çözüm açıklaması zorunludur.",
      });
    }

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

    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        resolutionDescription: solutionText.trim(),
        logs: {
          create: {
            type: "COZUM_EKLENDI",
            description: solutionText.trim(),
            userId: req.user.id,
          },
        },
      },
      include: ticketInclude,
    });

    return res.status(200).json({
      message: "Çözüm açıklaması kaydedildi.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("addSolution error:", error);

    return res.status(500).json({
      message: "Çözüm açıklaması kaydedilirken bir hata oluştu.",
    });
  }
};

export const addMessage = async (req, res) => {
  try {
    const ticketId = parseId(req.params.id);
    const { message } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        message: "Geçersiz talep kimliği.",
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        message: "Mesaj boş bırakılamaz.",
      });
    }

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
        message: "Bu talebe mesaj ekleme yetkiniz yok.",
      });
    }

    const createdLog = await prisma.ticketLog.create({
      data: {
        type: "ACIKLAMA_EKLENDI",
        description: message.trim(),
        ticketId,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Açıklama talebe eklendi.",
      ticketLog: createdLog,
    });
  } catch (error) {
    console.error("addMessage error:", error);

    return res.status(500).json({
      message: "Açıklama eklenirken bir hata oluştu.",
    });
  }
};
