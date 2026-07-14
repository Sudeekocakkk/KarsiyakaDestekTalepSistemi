import express from "express";
import {
  getCategoryReport,
  getDepartmentReport,
  getPersonnelPerformance,
  getTicketSummary,
} from "../controllers/report.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/tickets",
  authorize("BILGI_ISLEM", "ADMIN"),
  getTicketSummary
);

router.get(
  "/categories",
  authorize("BILGI_ISLEM", "ADMIN"),
  getCategoryReport
);

router.get(
  "/departments",
  authorize("ADMIN"),
  getDepartmentReport
);

router.get(
  "/personnel-performance",
  authorize("ADMIN"),
  getPersonnelPerformance
);

export default router;