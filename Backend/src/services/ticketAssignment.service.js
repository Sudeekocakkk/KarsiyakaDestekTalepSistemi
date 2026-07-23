import prisma from "../config/prisma.js";

// Bir uzmanlık alanındaki aktif teknik personeller arasından açık iş
// sayısı en az olanı seçer. İş yoğunluğu hesaplanırken yalnızca henüz
// sonuçlanmamış talepler (YENI/ATANDI/ISLEMDE/BEKLEMEDE) sayılır.
// Hem otomatik talep ataması (ticket.controller.js) hem de uzmanlığa
// aktarım (ticketTransfer.controller.js) tarafından paylaşılan ortak
// servistir.
export const findTechnicianWithLeastLoad = async (specializationId) => {
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
