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

