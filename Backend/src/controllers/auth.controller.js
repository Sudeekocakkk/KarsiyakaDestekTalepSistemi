import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { generateToken } from "../utils/generateToken.js";

// Sistemde hiç kullanıcı yoksa ilk ADMIN hesabını oluşturur
export const setupAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Ad, e-posta ve şifre zorunludur.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Şifre en az 8 karakter olmalıdır.",
      });
    }

    // Sistemde daha önce kullanıcı oluşturulmuş mu?
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return res.status(403).json({
        message:
          "İlk kurulum daha önce tamamlanmış. Yeni kullanıcıları yalnızca yönetici oluşturabilir.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "İlk yönetici hesabı başarıyla oluşturuldu.",
      user: admin,
    });
  } catch (error) {
    console.error("İlk yönetici oluşturma hatası:", error);

    return res.status(500).json({
      message: "İlk yönetici oluşturulurken bir hata oluştu.",
    });
  }
};

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      departmentId,
      role: requestedRole,
    } = req.body;

    if (requestedRole !== undefined && requestedRole !== null && requestedRole !== "") {
      return res.status(400).json({
        message:
          "Kayıt sırasında rol seçilemez. Yeni hesaplar PERSONEL rolüyle oluşturulur.",
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

    if (
      departmentId === undefined ||
      departmentId === null ||
      departmentId === ""
    ) {
      return res.status(400).json({
        message: "Müdürlük seçimi zorunludur.",
      });
    }

    const parsedDepartmentId = Number(departmentId);

    if (!Number.isInteger(parsedDepartmentId) || parsedDepartmentId <= 0) {
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

    if (!department.isActive) {
      return res.status(400).json({
        message: "Seçilen müdürlük aktif değil.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim() || null,

        // Kullanıcı kendi rolünü seçemez.
        role: "PERSONEL",

        isActive: true,
        departmentId: parsedDepartmentId,

        // Kendi hesabını oluşturan kullanıcı şifresini kendi belirlediği
        // için zorunlu şifre değişikliğine tabi değildir.
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        departmentId: true,
        department: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Personel hesabı başarıyla oluşturuldu.",
      user,
    });
  } catch (error) {
    console.error("Kayıt olma hatası:", error);

    return res.status(500).json({
      message: "Hesap oluşturulurken bir hata oluştu.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "E-posta ve şifre zorunludur.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        department: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "E-posta veya şifre hatalı.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Kullanıcı hesabı aktif değil.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "E-posta veya şifre hatalı.",
      });
    }

    const token = generateToken(user.id, user.role);

    return res.status(200).json({
      message: "Giriş başarılı.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        departmentId: user.departmentId,
        department: user.department,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Giriş hatası:", error);

    return res.status(500).json({
      message: "Giriş yapılırken bir hata oluştu.",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        department: true,
      },
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
    console.error("Kullanıcı bilgisi hatası:", error);

    return res.status(500).json({
      message: "Kullanıcı bilgileri alınırken bir hata oluştu.",
    });
  }
};

// Oturum açmış herhangi bir kullanıcı kendi şifresini değiştirebilir.
// mustChangePassword=true olan kullanıcılar için bu, engeli kaldıran tek yoldur.
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Mevcut şifre ve yeni şifre zorunludur.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Yeni şifre en az 6 karakter olmalıdır.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Mevcut şifre hatalı.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return res.status(200).json({
      message: "Şifreniz başarıyla güncellendi.",
    });
  } catch (error) {
    console.error("Şifre değiştirme hatası:", error);

    return res.status(500).json({
      message: "Şifre değiştirilirken bir hata oluştu.",
    });
  }
};