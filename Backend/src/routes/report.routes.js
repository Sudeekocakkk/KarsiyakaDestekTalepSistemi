import express from "express";
import {
  getCategoryReport,
  getDashboardCharts,
  getDepartmentReport,
  getPersonnelPerformance,
  getTicketSummary,
  getTopDepartments,
} from "../controllers/report.controller.js";
import {
  authenticate,
  requirePasswordChangeCompleted,
} from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

// Dashboard grafikleri: oturum açmış herhangi bir rol erişebilir; görünürlük
// controller içinde req.user.role'e göre kendi kendini sınırlar (bkz.
// getDashboardCharts). Bu yüzden aşağıdaki ADMIN'e özel uçlardan farklı
// olarak authorize() kullanmaz.
router.get("/dashboard", getDashboardCharts);

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
  "/departments/top",
  authorize("ADMIN"),
  getTopDepartments
);

router.get(
  "/personnel-performance",
  authorize("ADMIN"),
  getPersonnelPerformance
);

export default router;