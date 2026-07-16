import prisma from "../config/prisma.js";

const parseId = (value) => {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Müdürlük adı zorunludur.",
      });
    }

    const existingDepartment = await prisma.department.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingDepartment) {
      return res.status(409).json({
        message: "Bu müdürlük zaten mevcut.",
      });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
      },
    });

    return res.status(201).json({
      message: "Müdürlük oluşturuldu.",
      department,
    });
  } catch (error) {
    console.error("createDepartment error:", error);

    return res.status(500).json({
      message: "Müdürlük oluşturulurken bir hata oluştu.",
    });
  }
};

// Oturum gerektirmez: kayıt formunun müdürlük seçimi için yalnızca aktif
// müdürlüklerin id ve adını döner (kullanıcı sayısı/pasif müdürlük gibi
// yönetim detaylarını içermez).
export const getActiveDepartmentsPublic = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("getActiveDepartmentsPublic error:", error);

    return res.status(500).json({
      message: "Müdürlükler alınırken bir hata oluştu.",
    });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("getDepartments error:", error);

    return res.status(500).json({
      message: "Müdürlükler alınırken bir hata oluştu.",
    });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const departmentId = parseId(req.params.id);

    if (!departmentId) {
      return res.status(400).json({
        message: "Geçersiz müdürlük kimliği.",
      });
    }

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({
        message: "Müdürlük bulunamadı.",
      });
    }

    return res.status(200).json({
      department,
    });
  } catch (error) {
    console.error("getDepartmentById error:", error);

    return res.status(500).json({
      message: "Müdürlük alınırken bir hata oluştu.",
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const departmentId = parseId(req.params.id);
    const { name } = req.body;

    if (!departmentId) {
      return res.status(400).json({
        message: "Geçersiz müdürlük kimliği.",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Müdürlük adı zorunludur.",
      });
    }

    const existingDepartment = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
    });

    if (!existingDepartment) {
      return res.status(404).json({
        message: "Müdürlük bulunamadı.",
      });
    }

    const departmentWithSameName =
      await prisma.department.findUnique({
        where: {
          name: name.trim(),
        },
      });

    if (
      departmentWithSameName &&
      departmentWithSameName.id !== departmentId
    ) {
      return res.status(409).json({
        message: "Bu müdürlük adı zaten kullanılıyor.",
      });
    }

    const department = await prisma.department.update({
      where: {
        id: departmentId,
      },
      data: {
        name: name.trim(),
      },
    });

    return res.status(200).json({
      message: "Müdürlük güncellendi.",
      department,
    });
  } catch (error) {
    console.error("updateDepartment error:", error);

    return res.status(500).json({
      message: "Müdürlük güncellenirken bir hata oluştu.",
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const departmentId = parseId(req.params.id);

    if (!departmentId) {
      return res.status(400).json({
        message: "Geçersiz müdürlük kimliği.",
      });
    }

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({
        message: "Müdürlük bulunamadı.",
      });
    }

    if (department._count.users > 0) {
      return res.status(400).json({
        message:
          "Bu müdürlüğe bağlı kullanıcılar olduğu için silinemez.",
      });
    }

    await prisma.department.delete({
      where: {
        id: departmentId,
      },
    });

    return res.status(200).json({
      message: "Müdürlük silindi.",
    });
  } catch (error) {
    console.error("deleteDepartment error:", error);

    return res.status(500).json({
      message: "Müdürlük silinirken bir hata oluştu.",
    });
  }
};