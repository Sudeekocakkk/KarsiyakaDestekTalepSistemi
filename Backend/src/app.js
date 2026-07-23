import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import reportRoutes from "./routes/report.routes.js";
import specializationRoutes from "./routes/specialization.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import handoverRoutes from "./routes/handover.routes.js";

import prisma from "./config/prisma.js";
import {
  errorHandler,
  notFound,
} from "./middlewares/error.middleware.js";

import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Karşıyaka Destek API çalışıyor.",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: "Backend ve PostgreSQL bağlantısı başarılı.",
    });
  } catch (error) {
    console.error("Veritabanı bağlantı hatası:", error);

    return res.status(500).json({
      success: false,
      message: "PostgreSQL bağlantısı kurulamadı.",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/handover-requests", handoverRoutes);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);
app.use(notFound);
app.use(errorHandler);

export default app;