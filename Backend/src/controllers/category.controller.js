import prisma from "../config/prisma.js";

const parseId = (value) => {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, specializationId } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Kategori adı zorunludur.",
      });
    }

    if (!specializationId) {
      return res.status(400).json({
        message: "Uzmanlık seçimi zorunludur.",
      });
    }

    const parsedSpecializationId = Number(specializationId);

    if (Number.isNaN(parsedSpecializationId)) {
      return res.status(400).json({
        message: "Geçerli bir uzmanlık ID'si giriniz.",
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Bu kategori zaten mevcut.",
      });
    }

    const specialization = await prisma.specialization.findUnique({
      where: {
        id: parsedSpecializationId,
      },
    });

    if (!specialization) {
      return res.status(404).json({
        message: "Uzmanlık bulunamadı.",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        specializationId: parsedSpecializationId,
      },
      include: {
        specialization: true,
      },
    });

    return res.status(201).json({
      message: "Kategori oluşturuldu.",
      category,
    });
  } catch (error) {
    console.error("createCategory error:", error);

    return res.status(500).json({
      message: "Kategori oluşturulurken bir hata oluştu.",
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const where = {};

    if (includeInactive !== "true") {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("getCategories error:", error);

    return res.status(500).json({
      message: "Kategoriler alınırken bir hata oluştu.",
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const categoryId = parseId(req.params.id);

    if (!categoryId) {
      return res.status(400).json({
        message: "Geçersiz kategori kimliği.",
      });
    }

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Kategori bulunamadı.",
      });
    }

    return res.status(200).json({
      category,
    });
  } catch (error) {
    console.error("getCategoryById error:", error);

    return res.status(500).json({
      message: "Kategori alınırken bir hata oluştu.",
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const categoryId = parseId(req.params.id);
    const { name, isActive } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        message: "Geçersiz kategori kimliği.",
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: "Kategori bulunamadı.",
      });
    }

    const data = {};

    if (name !== undefined) {
      if (!name?.trim()) {
        return res.status(400).json({
          message: "Kategori adı boş bırakılamaz.",
        });
      }

      const categoryWithSameName = await prisma.category.findUnique({
        where: {
          name: name.trim(),
        },
      });

      if (
        categoryWithSameName &&
        categoryWithSameName.id !== categoryId
      ) {
        return res.status(409).json({
          message: "Bu kategori adı zaten kullanılıyor.",
        });
      }

      data.name = name.trim();
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

    const category = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data,
    });

    return res.status(200).json({
      message: "Kategori güncellendi.",
      category,
    });
  } catch (error) {
    console.error("updateCategory error:", error);

    return res.status(500).json({
      message: "Kategori güncellenirken bir hata oluştu.",
    });
  }
};

export const deactivateCategory = async (req, res) => {
  try {
    const categoryId = parseId(req.params.id);

    if (!categoryId) {
      return res.status(400).json({
        message: "Geçersiz kategori kimliği.",
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: "Kategori bulunamadı.",
      });
    }

    const category = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      message: "Kategori pasif hale getirildi.",
      category,
    });
  } catch (error) {
    console.error("deactivateCategory error:", error);

    return res.status(500).json({
      message: "Kategori pasif hale getirilirken bir hata oluştu.",
    });
  }
};