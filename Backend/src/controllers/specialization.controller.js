import prisma from "../config/prisma.js";

const parseId = (value) => {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createSpecialization = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Uzmanlık adı zorunludur.",
      });
    }

    const normalizedName = name.trim();

    const existingSpecialization =
      await prisma.specialization.findUnique({
        where: {
          name: normalizedName,
        },
      });

    if (existingSpecialization) {
      return res.status(409).json({
        message: "Bu uzmanlık alanı zaten mevcut.",
      });
    }

    const specialization = await prisma.specialization.create({
      data: {
        name: normalizedName,
        description: description?.trim() || null,
      },
    });

    return res.status(201).json({
      message: "Uzmanlık alanı oluşturuldu.",
      specialization,
    });
  } catch (error) {
    console.error("createSpecialization error:", error);

    return res.status(500).json({
      message: "Uzmanlık alanı oluşturulurken bir hata oluştu.",
    });
  }
};

export const getSpecializations = async (req, res) => {
  try {
    const specializations = await prisma.specialization.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      count: specializations.length,
      specializations,
    });
  } catch (error) {
    console.error("getSpecializations error:", error);

    return res.status(500).json({
      message: "Uzmanlık alanları alınırken bir hata oluştu.",
    });
  }
};

export const getSpecializationById = async (req, res) => {
  try {
    const specializationId = parseId(req.params.id);

    if (!specializationId) {
      return res.status(400).json({
        message: "Geçersiz uzmanlık kimliği.",
      });
    }

    const specialization = await prisma.specialization.findUnique({
      where: {
        id: specializationId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
      },
    });

    if (!specialization) {
      return res.status(404).json({
        message: "Uzmanlık alanı bulunamadı.",
      });
    }

    return res.status(200).json({
      specialization,
    });
  } catch (error) {
    console.error("getSpecializationById error:", error);

    return res.status(500).json({
      message: "Uzmanlık alanı alınırken bir hata oluştu.",
    });
  }
};

export const updateSpecialization = async (req, res) => {
  try {
    const specializationId = parseId(req.params.id);

    if (!specializationId) {
      return res.status(400).json({
        message: "Geçersiz uzmanlık kimliği.",
      });
    }

    const existingSpecialization =
      await prisma.specialization.findUnique({
        where: {
          id: specializationId,
        },
      });

    if (!existingSpecialization) {
      return res.status(404).json({
        message: "Uzmanlık alanı bulunamadı.",
      });
    }

    const { name, description, isActive } = req.body;
    const data = {};

    if (name !== undefined) {
      if (!name?.trim()) {
        return res.status(400).json({
          message: "Uzmanlık adı boş bırakılamaz.",
        });
      }

      data.name = name.trim();
    }

    if (description !== undefined) {
      data.description = description?.trim() || null;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive değeri true veya false olmalıdır.",
        });
      }

      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Güncellenecek bir alan gönderilmedi.",
      });
    }

    const specialization = await prisma.specialization.update({
      where: {
        id: specializationId,
      },
      data,
    });

    return res.status(200).json({
      message: "Uzmanlık alanı güncellendi.",
      specialization,
    });
  } catch (error) {
    console.error("updateSpecialization error:", error);

    return res.status(500).json({
      message: "Uzmanlık alanı güncellenirken bir hata oluştu.",
    });
  }
};

export const deleteSpecialization = async (req, res) => {
  try {
    const specializationId = parseId(req.params.id);

    if (!specializationId) {
      return res.status(400).json({
        message: "Geçersiz uzmanlık kimliği.",
      });
    }

    const existingSpecialization =
      await prisma.specialization.findUnique({
        where: {
          id: specializationId,
        },
      });

    if (!existingSpecialization) {
      return res.status(404).json({
        message: "Uzmanlık alanı bulunamadı.",
      });
    }

    const specialization = await prisma.specialization.update({
      where: {
        id: specializationId,
      },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      message: "Uzmanlık alanı pasif hale getirildi.",
      specialization,
    });
  } catch (error) {
    console.error("deleteSpecialization error:", error);

    return res.status(500).json({
      message: "Uzmanlık alanı pasif hale getirilirken bir hata oluştu.",
    });
  }
};