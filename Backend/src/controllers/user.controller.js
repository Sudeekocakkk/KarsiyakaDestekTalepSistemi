import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

const validRoles = ["PERSONEL", "TEKNIK_PERSONEL", "ADMIN"];

const parseId = (value) => {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  departmentId: true,
  createdAt: true,
  updatedAt: true,
  department: true,
  specializations: true,
};

export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "PERSONEL",
      departmentId,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Ad soyad, e-posta ve şifre zorunludur.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Şifre en az 6 karakter olmalıdır.",
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Geçersiz kullanıcı rolü.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Bu e-posta adresi zaten kullanılıyor.",
      });
    }

    let parsedDepartmentId = null;

    if (departmentId !== undefined && departmentId !== null) {
      parsedDepartmentId = parseId(departmentId);

      if (!parsedDepartmentId) {
        return res.status(400).json({
          message: "Geçersiz müdürlük kimliği.",
        });
      }

      const department = await prisma.department.findUnique({
        where: {
          id: parsedDepartmentId,
        },
      });

      if (!department) {
        return res.status(404).json({
          message: "Müdürlük bulunamadı.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        departmentId: parsedDepartmentId,
      },
      select: userSelect,
    });

    return res.status(201).json({
      message: "Kullanıcı oluşturuldu.",
      user,
    });
  } catch (error) {
    console.error("createUser error:", error);

    return res.status(500).json({
      message: "Kullanıcı oluşturulurken bir hata oluştu.",
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role, isActive, departmentId, search } = req.query;

    const where = {};

    if (role) {
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          message: "Geçersiz kullanıcı rolü.",
        });
      }

      where.role = role;
    }

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          message: "isActive değeri true veya false olmalıdır.",
        });
      }

      where.isActive = isActive === "true";
    }

    if (departmentId) {
      const parsedDepartmentId = parseId(departmentId);

      if (!parsedDepartmentId) {
        return res.status(400).json({
          message: "Geçersiz müdürlük kimliği.",
        });
      }

      where.departmentId = parsedDepartmentId;
    }

    if (search?.trim()) {
      where.OR = [
        {
          name: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("getUsers error:", error);

    return res.status(500).json({
      message: "Kullanıcılar alınırken bir hata oluştu.",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = parseId(req.params.id);

    if (!userId) {
      return res.status(400).json({
        message: "Geçersiz kullanıcı kimliği.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("getUserById error:", error);

    return res.status(500).json({
      message: "Kullanıcı bilgisi alınırken bir hata oluştu.",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = parseId(req.params.id);

    if (!userId) {
      return res.status(400).json({
        message: "Geçersiz kullanıcı kimliği.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    const {
      name,
      email,
      role,
      departmentId,
      isActive,
      password,
      specializationIds,
    } = req.body;

    const data = {};

    if (name !== undefined) {
      if (!name?.trim()) {
        return res.status(400).json({
          message: "Ad soyad boş bırakılamaz.",
        });
      }

      data.name = name.trim();
    }

    if (email !== undefined) {
      if (!email?.trim()) {
        return res.status(400).json({
          message: "E-posta boş bırakılamaz.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const emailOwner = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (emailOwner && emailOwner.id !== userId) {
        return res.status(409).json({
          message: "Bu e-posta adresi başka bir kullanıcıya ait.",
        });
      }

      data.email = normalizedEmail;
    }

    if (role !== undefined) {
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          message: "Geçersiz kullanıcı rolü.",
        });
      }

      data.role = role;
    }

    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === "") {
        data.departmentId = null;
      } else {
        const parsedDepartmentId = parseId(departmentId);

        if (!parsedDepartmentId) {
          return res.status(400).json({
            message: "Geçersiz müdürlük kimliği.",
          });
        }

        const department = await prisma.department.findUnique({
          where: {
            id: parsedDepartmentId,
          },
        });

        if (!department) {
          return res.status(404).json({
            message: "Müdürlük bulunamadı.",
          });
        }

        data.departmentId = parsedDepartmentId;
      }
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive değeri true veya false olmalıdır.",
        });
      }

      data.isActive = isActive;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Şifre en az 6 karakter olmalıdır.",
        });
      }

      data.password = await bcrypt.hash(password, 10);
    }
    if (specializationIds !== undefined) {
  if (!Array.isArray(specializationIds)) {
    return res.status(400).json({
      message: "specializationIds bir dizi olmalıdır.",
    });
  }

  const parsedSpecializationIds = specializationIds.map((value) =>
    parseId(value)
  );

  if (parsedSpecializationIds.some((id) => id === null)) {
    return res.status(400).json({
      message: "Geçersiz uzmanlık kimliği gönderildi.",
    });
  }

  const uniqueSpecializationIds = [
    ...new Set(parsedSpecializationIds),
  ];

  const resultingRole = role ?? existingUser.role;

  if (
    uniqueSpecializationIds.length > 0 &&
    resultingRole !== "TEKNIK_PERSONEL"
  ) {
    return res.status(400).json({
      message:
        "Uzmanlık alanı yalnızca teknik personele atanabilir.",
    });
  }

  const specializationCount =
    await prisma.specialization.count({
      where: {
        id: {
          in: uniqueSpecializationIds,
        },
        isActive: true,
      },
    });

  if (
    specializationCount !== uniqueSpecializationIds.length
  ) {
    return res.status(400).json({
      message:
        "Uzmanlık alanlarından biri bulunamadı veya aktif değil.",
    });
  }

  data.specializations = {
    set: uniqueSpecializationIds.map((id) => ({
      id,
    })),
  };
}

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Güncellenecek bir alan gönderilmedi.",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data,
      select: userSelect,
    });

    return res.status(200).json({
      message: "Kullanıcı güncellendi.",
      user,
    });
  } catch (error) {
    console.error("updateUser error:", error);

    return res.status(500).json({
      message: "Kullanıcı güncellenirken bir hata oluştu.",
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const userId = parseId(req.params.id);

    if (!userId) {
      return res.status(400).json({
        message: "Geçersiz kullanıcı kimliği.",
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        message: "Kendi hesabınızı pasif hale getiremezsiniz.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: false,
      },
      select: userSelect,
    });

    return res.status(200).json({
      message: "Kullanıcı pasif hale getirildi.",
      user,
    });
  } catch (error) {
    console.error("deactivateUser error:", error);

    return res.status(500).json({
      message: "Kullanıcı pasif hale getirilirken bir hata oluştu.",
    });
  }
};