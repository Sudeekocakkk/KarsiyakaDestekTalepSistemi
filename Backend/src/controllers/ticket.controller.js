import prisma from "../config/prisma.js";
import { addTicketAssignedEmailJob } from "../queues/mail.queue.js";
import { recordDevice } from "../services/device.service.js";
import { findTechnicianWithLeastLoad } from "../services/ticketAssignment.service.js";
import {
  notifyRole,
  notifySpecializationTechnicians,
  notifyUser,
} from "../services/notification.service.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Talep bir teknik personele atandığında (manuel admin ataması veya
// otomatik atama) çağrılır. Mail'i doğrudan burada GÖNDERMEZ — Redis/BullMQ
// tabanlı "ticket-email" kuyruğuna bir iş ekler; gerçek gönderim
// Backend/src/workers/mail.worker.js tarafından ayrı bir process'te yapılır.
// addTicketAssignedEmailJob kendi içinde hataları loglar ve asla fırlatmaz,
// bu yüzden burada ekstra try/catch'e gerek yoktur — talep atama işlemi
// kuyruk/Redis sorunlarından etkilenmez.
export const enqueueAssignmentEmail = async (technician, ticket) => {
  if (!technician?.email) {
    console.error(
      `[ticket-assign-mail] Teknik personelin (id: ${technician?.id}) e-posta adresi boş; mail kuyruğa eklenemiyor.`
    );
    return;
  }

  await addTicketAssignedEmailJob({
    ticketId: ticket.id,
    assignedToId: technician.id,
    toEmail: technician.email,
    technicianName: technician.name,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    priority: ticket.priority,
    categoryName: ticket.category?.name,
    ticketUrl: `${FRONTEND_URL}/teknik/talepler/${ticket.id}`,
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

// Frontend/src/utils/constants.js'teki TICKET_STATUS_LABELS/TICKET_PRIORITY_LABELS
// ile birebir aynı Türkçe etiketler. Arama teriminin durum/öncelik ETİKETİYLE
// (örn. "çözüldü") eşleşip eşleşmediğini bulup ilgili enum değer(ler)ini
// where.OR'a eklemek için kullanılır — ham enum koduna (COZULDU) göre arama
// kullanıcı için anlamsız olurdu.
const TICKET_STATUS_LABELS = {
  YENI: "Yeni",
  ATANDI: "Atandı",
  ISLEMDE: "İşlemde",
  BEKLEMEDE: "Beklemede",
  COZULDU: "Çözüldü",
  IPTAL_EDILDI: "İptal Edildi",
};

const TICKET_PRIORITY_LABELS = {
  DUSUK: "Düşük",
  NORMAL: "Normal",
  YUKSEK: "Yüksek",
  ACIL: "Acil",
};

const normalizeForMatch = (value) => value.toString().toLocaleLowerCase("tr-TR");

// getAllTickets/getMyTickets/getAssignedTickets tarafından paylaşılır (kod
// tekrarından kaçınmak için): talep no, başlık, açıklama, durum, öncelik,
// kategori, müdürlük, atanan personel ve oluşturan kullanıcı adında arar.
// Çağıran fonksiyon bunu kendi rol bazlı `where` nesnesine (örn.
// createdById/assignedToId) EKLER; bu yüzden arama sonucu her zaman o
// rolün zaten görebildiği talep kümesiyle sınırlı kalır.
const buildTicketSearchOr = (term) => {
  const normalizedTerm = normalizeForMatch(term);

  const matchingStatuses = Object.entries(TICKET_STATUS_LABELS)
    .filter(([, label]) => normalizeForMatch(label).includes(normalizedTerm))
    .map(([value]) => value);

  const matchingPriorities = Object.entries(TICKET_PRIORITY_LABELS)
    .filter(([, label]) => normalizeForMatch(label).includes(normalizedTerm))
    .map(([value]) => value);

  return [
    { ticketNumber: { contains: term, mode: "insensitive" } },
    { title: { contains: term, mode: "insensitive" } },
    { description: { contains: term, mode: "insensitive" } },
    { category: { name: { contains: term, mode: "insensitive" } } },
    { department: { name: { contains: term, mode: "insensitive" } } },
    { assignedTo: { name: { contains: term, mode: "insensitive" } } },
    { createdBy: { name: { contains: term, mode: "insensitive" } } },
    ...(matchingStatuses.length ? [{ status: { in: matchingStatuses } }] : []),
    ...(matchingPriorities.length ? [{ priority: { in: matchingPriorities } }] : []),
  ];
};

export const ticketInclude = {
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
  device: {
    select: {
      id: true,
      ipAddress: true,
      hostname: true,
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
      device: {
        select: {
          id: true,
          ipAddress: true,
          hostname: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
  transfers: {
    include: {
      fromUser: { select: { id: true, name: true } },
      toSpecialization: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  },
  handoverRequests: {
    include: {
      requestedBy: { select: { id: true, name: true } },
      requestedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  },
};

// Cihaz/IP bilgisi kuralı gereği yalnızca ADMIN ve atanmış TEKNIK_PERSONEL
// tarafından görülebilir; PERSONEL için hem talebin hem de her log
// satırının device alanı yanıttan çıkarılır.
export const stripDeviceInfoForPersonel = (ticket, user) => {
  if (!ticket || user?.role !== "PERSONEL") return ticket;

  return {
    ...ticket,
    device: null,
    logs: ticket.logs?.map((log) => ({ ...log, device: null })),
  };
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

    // Best-effort cihaz kaydı: recordDevice hiçbir zaman fırlatmaz,
    // device null dönerse ticket/log'lar deviceId=null ile oluşturulur.
    const device = await recordDevice(req);

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
        deviceId: device?.id ?? null,
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
        data: { ...log, ticketId: created.id, deviceId: device?.id ?? null },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: created.id },
      include: ticketInclude,
    });

    // Otomatik atama akışı: ticket.assignedTo, ticketInclude sayesinde
    // {id, name, email, role} olarak zaten geliyor, ek sorguya gerek yok.
    if (assignedToId && ticket.assignedTo) {
      await enqueueAssignmentEmail(ticket.assignedTo, ticket);
    }

    // Bildirimler: uzmanlıktaki diğer teknik personellere ve tüm adminlere
    // "yeni talep bu uzmanlık alanına düştü" bilgisi; otomatik atanan
    // kişiye ayrıca kendine özel bir atama bildirimi gider (bu yüzden genel
    // bildirimden hariç tutulur — aynı kişiye iki farklı bildirim yerine
    // her biri tek, anlamlı bir bildirim alır).
    const specializationName = category.specialization?.name || "İlgili";
    const newTicketMessage = `${ticket.ticketNumber} numaralı ${TICKET_PRIORITY_LABELS[ticket.priority]} öncelikli talep ${specializationName} uzmanlık alanına düştü.`;

    await notifySpecializationTechnicians(
      category.specializationId,
      {
        ticketId: ticket.id,
        title: "Yeni Talep Oluşturuldu",
        message: newTicketMessage,
        type: "YENI_TALEP",
      },
      assignedToId
    );

    await notifyRole("ADMIN", {
      ticketId: ticket.id,
      title: "Yeni Talep Oluşturuldu",
      message: newTicketMessage,
      type: "YENI_TALEP",
    });

    if (assignedToId) {
      await notifyUser({
        userId: assignedToId,
        ticketId: ticket.id,
        title: "Yeni Talep Atandı",
        message: `${ticket.ticketNumber} numaralı talep size otomatik olarak atandı.`,
        type: "TALEP_ATANDI",
      });
    }

    return res.status(201).json({
      message: assignedToId
        ? "Destek talebi oluşturuldu ve otomatik atandı."
        : "Destek talebi oluşturuldu.",
      ticket: stripDeviceInfoForPersonel(ticket, req.user),
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
    const { status, priority, categoryId, search } = req.query;

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

    if (search?.trim()) {
      where.OR = buildTicketSearchOr(search.trim());
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
    const { status, priority, categoryId, search } = req.query;

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

    if (search?.trim()) {
      where.OR = buildTicketSearchOr(search.trim());
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
      departmentId,
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

    // "En Yoğun Müdürlükler" kartındaki bir satıra tıklanınca dashboard'dan
    // ?departmentId=... ile buraya yönlendirilir (yalnızca ADMIN erişebilir).
    if (departmentId) {
      const parsedDepartmentId = parseId(departmentId);
      if (!parsedDepartmentId) {
        return res.status(400).json({ message: "Geçersiz müdürlük kimliği." });
      }
      where.departmentId = parsedDepartmentId;
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
      where.OR = buildTicketSearchOr(search.trim());
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

    let canView = canViewTicket(ticket, req.user);

    // Henüz talebe atanmamış olsa bile, kendisine bekleyen bir devir
    // isteği gönderilmiş TEKNIK_PERSONEL, bildirim üzerinden geldiği
    // talep detayını görüntüleyebilmelidir (yalnızca görüntüleme — alan
    // bazlı düzenleme yetkileri updateTicket'ta değişmeden kalır).
    if (!canView && req.user.role === "TEKNIK_PERSONEL") {
      const hasPendingHandover = await prisma.handoverRequest.findFirst({
        where: {
          ticketId: ticket.id,
          requestedToId: req.user.id,
          status: "PENDING",
        },
      });

      canView = Boolean(hasPendingHandover);
    }

    if (!canView) {
      return res.status(403).json({
        message: "Bu talebi görüntüleme yetkiniz yok.",
      });
    }

    return res.status(200).json({
      ticket: stripDeviceInfoForPersonel(ticket, req.user),
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
    let statusChanged = false;

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
        statusChanged = true;

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

    const device = logs.length > 0 ? await recordDevice(req) : null;

    for (const log of logs) {
      await prisma.ticketLog.create({
        data: { ...log, ticketId, deviceId: device?.id ?? null },
      });
    }

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: ticketInclude,
    });

    // Manuel atama akışı (admin, "Personele Ata" alanı üzerinden).
    if (technicianToNotify) {
      await enqueueAssignmentEmail(technicianToNotify, updatedTicket);

      await notifyUser({
        userId: technicianToNotify.id,
        ticketId: updatedTicket.id,
        title: "Yeni Talep Atandı",
        message: `${updatedTicket.ticketNumber} numaralı talep size atandı.`,
        type: "TALEP_ATANDI",
      });
    }

    if (statusChanged) {
      await notifyUser({
        userId: updatedTicket.createdById,
        ticketId: updatedTicket.id,
        title: "Talep Durumu Güncellendi",
        message: `${updatedTicket.ticketNumber} numaralı talebiniz "${TICKET_STATUS_LABELS[updatedTicket.status]}" durumuna güncellendi.`,
        type: "TALEP_DURUM_DEGISTI",
      });
    }

    return res.status(200).json({
      message: "Talep güncellendi.",
      ticket: stripDeviceInfoForPersonel(updatedTicket, req.user),
    });
  } catch (error) {
    console.error("updateTicket error:", error);

    return res.status(500).json({
      message: "Talep güncellenirken bir hata oluştu.",
    });
  }
};
