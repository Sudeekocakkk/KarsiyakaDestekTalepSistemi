import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Giriş yapmanız gerekiyor.",
      });
    }

    const token = authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Kullanıcı bulunamadı veya aktif değil.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Geçersiz veya süresi dolmuş token.",
    });
  }
};

// authenticate'ten SONRA kullanılır. Şifresini değiştirmesi zorunlu olan bir
// kullanıcının /auth/change-password ve /auth/me dışındaki uçlara erişmesini
// engeller. Bu iki rota bilinçli olarak bu middleware'i kullanmaz.
export const requirePasswordChangeCompleted = (req, res, next) => {
  if (req.user?.mustChangePassword) {
    return res.status(403).json({
      message: "Devam etmeden önce şifrenizi değiştirmeniz gerekiyor.",
      mustChangePassword: true,
    });
  }

  next();
};

