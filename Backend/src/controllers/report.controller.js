import prisma from "../config/prisma.js";

export const getTicketSummary = async (req, res) => {
  try {
    const [
      totalTickets,
      newTickets,
      assignedTickets,
      inProgressTickets,
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