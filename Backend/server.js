import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import prisma from "./src/config/prisma.js";
import { verifyMailTransport } from "./src/utils/mailer.js";
import { initSocket } from "./src/socket/index.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const startServer = async () => {
  try {
    await prisma.$connect();
    await verifyMailTransport();

    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Sunucu ${PORT} portunda çalışıyor.`);
      console.log("PostgreSQL bağlantısı başarılı.");
    });
  } catch (error) {
    console.error("Sunucu başlatılamadı:", error);
    process.exit(1);
  }
};

startServer();

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);