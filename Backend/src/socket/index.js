import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { userRoom, roleRoom, specializationRoom } from "./rooms.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

let io = null;

// server.js tarafından http sunucusu oluşturulduktan sonra bir kez çağrılır.
// Kimlik doğrulama, mevcut JWT (generateToken.js) ile birebir uyumludur:
// socket.handshake.auth.token içindeki Bearer olmayan ham token doğrulanır.
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Giriş yapmanız gerekiyor."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          role: true,
          isActive: true,
          specializations: {
            select: { id: true },
          },
        },
      });

      if (!user || !user.isActive) {
        return next(new Error("Kullanıcı bulunamadı veya aktif değil."));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Geçersiz veya süresi dolmuş oturum."));
    }
  });

  io.on("connection", (socket) => {
    const { user } = socket;

    socket.join(userRoom(user.id));
    socket.join(roleRoom(user.role));

    if (user.role === "TEKNIK_PERSONEL") {
      for (const specialization of user.specializations) {
        socket.join(specializationRoom(specialization.id));
      }
    }
  });

  io.engine.on("connection_error", (error) => {
    console.error(`[socket] Bağlantı hatası: ${error.message}`);
  });

  console.log("[socket] Socket.IO başlatıldı.");

  return io;
};

// notification.service.js gibi diğer modüller circular import olmadan
// io örneğine erişebilsin diye singleton getter. Socket henüz
// başlatılmadıysa (ör. testler) null döner — çağıranlar bunu optional
// chaining ile ele almalıdır.
export const getIO = () => io;
