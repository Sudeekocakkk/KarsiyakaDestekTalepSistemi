import prisma from "../config/prisma.js";

const TURKISH_MONTH_ABBR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

// "Tamamlanan" = COZULDU. "Bekleyen" = henüz sonuçlanmamış (COZULDU/IPTAL_EDILDI
// dışındaki) durumlar. IPTAL_EDILDI talepler "Toplam"a dahildir ama ne
// tamamlanan ne bekleyen sayılır (kendi ayrı, sonuçlanmış durumu).
const PENDING_STATUSES = ["YENI", "ATANDI", "ISLEMDE", "BEKLEMEDE"];

// Dashboard'daki "Aylık Talep Dağılımı" ve "Taleplerin Kategoriye Göre
// Dağılımı" grafikleri için tek, rol bazlı sınırlı (self-scoped) endpoint.
// Var olan /reports/* uçları yalnızca ADMIN'e açık olduğundan (bkz.
// report.routes.js), teknik personel ve personel de dashboard'unu
// görebilsin diye bu uç herhangi bir authorize() kısıtı olmadan, ama
// ticket.controller.js'teki getMyTickets/getAssignedTickets/getAllTickets
// ile BİREBİR aynı görünürlük kuralıyla çalışır:
//   ADMIN -> tüm talepler, TEKNIK_PERSONEL -> kendisine atananlar,
//   PERSONEL -> kendi oluşturduğu talepler.
export const getDashboardCharts = async (req, res) => {
  try {
    const where = {};

    if (req.user.role === "TEKNIK_PERSONEL") {
      where.assignedToId = req.user.id;
    } else if (req.user.role === "PERSONEL") {
      where.createdById = req.user.id;
    }

    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: TURKISH_MONTH_ABBR[date.getMonth()],
      });
    }

    const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [ticketsInRange, categoryGroups] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          ...where,
          createdAt: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      }),

      prisma.ticket.groupBy({
        by: ["categoryId"],
        where,
        _count: {
          categoryId: true,
        },
      }),
    ]);

    const bucketByKey = new Map(
      months.map((month) => [month.key, { total: 0, completed: 0, pending: 0 }])
    );

    for (const ticket of ticketsInRange) {
      const key = `${ticket.createdAt.getFullYear()}-${String(
        ticket.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;

      const bucket = bucketByKey.get(key);

      if (!bucket) continue;

      bucket.total += 1;

      if (ticket.status === "COZULDU") {
        bucket.completed += 1;
      } else if (PENDING_STATUSES.includes(ticket.status)) {
        bucket.pending += 1;
      }
    }

    const monthly = months.map((month) => ({
      month: month.key,
      label: month.label,
      ...bucketByKey.get(month.key),
    }));

    const categoryIds = categoryGroups
      .map((group) => group.categoryId)
      .filter((id) => id !== null);

    const categoryRecords = categoryIds.length
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

    const categoryNameById = new Map(categoryRecords.map((c) => [c.id, c.name]));

    const categories = categoryGroups
      .filter((group) => group._count.categoryId > 0 && group.categoryId !== null)
      .map((group) => ({
        categoryId: group.categoryId,
        categoryName: categoryNameById.get(group.categoryId) || "Bilinmeyen Kategori",
        count: group._count.categoryId,
      }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      monthly,
      categories,
    });
  } catch (error) {
    console.error("getDashboardCharts error:", error);

    return res.status(500).json({
      message: "Dashboard grafik verileri alınırken bir hata oluştu.",
    });
  }
};

// Dashboard'daki (yalnızca ADMIN'e görünen) "En Yoğun Müdürlükler" kartı için.
// Ticket.departmentId üzerinden doğrudan groupBy yapar (getDepartmentReport'un
// User.createdTickets üzerinden dolaylı yoluna göre daha basit/direkt ve aynı
// sonucu verir, çünkü talep oluşturulurken departmentId zaten req.user.departmentId'den
// kopyalanıyor). isActive durumuna bakılmaksızın TÜM müdürlükler dahil edilir:
// Ticket.departmentId FK'sı onDelete: Restrict olduğundan bir talebin
// departmanı asla silinmiş/geçersiz olamaz; isActive alanı yalnızca YENİ kayıt
// formundaki müdürlük seçimini etkiler, geçmiş talep hacmini gizlemek için
// kullanılmaz. Talebi olmayan müdürlükler groupBy sonucunda hiç görünmez.
export const getTopDepartments = async (req, res) => {
  try {
    const grouped = await prisma.ticket.groupBy({
      by: ["departmentId"],
      _count: {
        departmentId: true,
      },
    });

    const sorted = grouped
      .map((group) => ({
        departmentId: group.departmentId,
        ticketCount: group._count.departmentId,
      }))
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 5);

    const departments = sorted.length
      ? await prisma.department.findMany({
          where: { id: { in: sorted.map((d) => d.departmentId) } },
          select: { id: true, name: true },
        })
      : [];

    const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));

    const topDepartments = sorted.map((entry) => ({
      departmentId: entry.departmentId,
      departmentName: departmentNameById.get(entry.departmentId) || "Bilinmeyen Müdürlük",
      ticketCount: entry.ticketCount,
    }));

    return res.status(200).json({
      topDepartments,
    });
  } catch (error) {
    console.error("getTopDepartments error:", error);

    return res.status(500).json({
      message: "En yoğun müdürlükler alınırken bir hata oluştu.",
    });
  }
};

export const getTicketSummary = async (req, res) => {
  try {
    const [
      totalTickets,
      newTickets,
      assignedTickets,
      inProgressTickets,
      waitingTickets,
      solvedTickets,
      cancelledTickets,
      urgentTickets,
    ] = await Promise.all([
      prisma.ticket.count(),

      prisma.ticket.count({
        where: {
          status: "YENI",
        },
      }),

      prisma.ticket.count({
        where: {
          status: "ATANDI",
        },
      }),

      prisma.ticket.count({
        where: {
          status: "ISLEMDE",
        },
      }),

      prisma.ticket.count({
        where: {
          status: "BEKLEMEDE",
        },
      }),

      prisma.ticket.count({
        where: {
          status: "COZULDU",
        },
      }),

      prisma.ticket.count({
        where: {
          status: "IPTAL_EDILDI",
        },
      }),

      prisma.ticket.count({
        where: {
          priority: "ACIL",
        },
      }),
    ]);

    return res.status(200).json({
      summary: {
        totalTickets,
        newTickets,
        assignedTickets,
        inProgressTickets,
        waitingTickets,
        solvedTickets,
        cancelledTickets,
        urgentTickets,
      },
    });
  } catch (error) {
    console.error("getTicketSummary error:", error);

    return res.status(500).json({
      message: "Talep raporu alınırken bir hata oluştu.",
      error: error.message,
    });
  }
};
export const getCategoryReport = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const report = categories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      isActive: category.isActive,
      ticketCount: category._count.tickets,
    }));

    return res.status(200).json({
      report,
    });
  } catch (error) {
    console.error("getCategoryReport error:", error);

    return res.status(500).json({
      message: "Kategori raporu alınırken bir hata oluştu.",
    });
  }
};

export const getDepartmentReport = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        users: {
          select: {
            id: true,
            createdTickets: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const report = departments.map((department) => {
      const tickets = department.users.flatMap(
        (user) => user.createdTickets
      );

      return {
        departmentId: department.id,
        departmentName: department.name,
        userCount: department.users.length,
        totalTickets: tickets.length,
        solvedTickets: tickets.filter(
          (ticket) => ticket.status === "COZULDU"
        ).length,
        waitingTickets: tickets.filter(
          (ticket) => ticket.status === "BEKLIYOR"
        ).length,
      };
    });

    return res.status(200).json({
      report,
    });
  } catch (error) {
    console.error("getDepartmentReport error:", error);

    return res.status(500).json({
      message: "Müdürlük raporu alınırken bir hata oluştu.",
    });
  }
};

export const getPersonnelPerformance = async (req, res) => {
  try {
    const personnel = await prisma.user.findMany({
      where: {
        role: "TEKNIK_PERSONEL",
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        assignedTickets: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const report = personnel.map((person) => {
      const totalAssigned = person.assignedTickets.length;

      const solvedTickets = person.assignedTickets.filter(
        (ticket) => ticket.status === "COZULDU"
      );

      const inProgressTickets = person.assignedTickets.filter(
        (ticket) =>
          ticket.status === "ATANDI" ||
          ticket.status === "ISLEMDE"
      );

      const cancelledTickets = person.assignedTickets.filter(
        (ticket) => ticket.status === "IPTAL_EDILDI"
      );

      const solutionTimes = solvedTickets
        .filter((ticket) => ticket.resolvedAt)
        .map((ticket) => {
          const start = new Date(ticket.createdAt).getTime();
          const end = new Date(ticket.resolvedAt).getTime();

          return end - start;
        });

      const averageSolutionHours =
        solutionTimes.length > 0
          ? Number(
              (
                solutionTimes.reduce(
                  (total, current) => total + current,
                  0
                ) /
                solutionTimes.length /
                (1000 * 60 * 60)
              ).toFixed(2)
            )
          : null;

      return {
        userId: person.id,
        name: person.name,
        email: person.email,
        isActive: person.isActive,
        totalAssigned,
        solvedCount: solvedTickets.length,
        inProgressCount: inProgressTickets.length,
        cancelledCount: cancelledTickets.length,
        averageSolutionHours,
      };
    });

    return res.status(200).json({
      report,
    });
  } catch (error) {
    console.error("getPersonnelPerformance error:", error);

    return res.status(500).json({
      message: "Personel performans raporu alınırken hata oluştu.",
      error: error.message,
    });
  }
};