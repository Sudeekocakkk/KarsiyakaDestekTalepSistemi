import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getActiveDepartmentsPublic,
  getDepartmentById,
  getDepartments,
  updateDepartment,
} from "../controllers/department.controller.js";

import {
  authenticate,
  requirePasswordChangeCompleted,
} from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

// Kayıt formu oturum açmadan çağırır; bu yüzden authenticate'ten önce tanımlanır.
router.get("/public/active", getActiveDepartmentsPublic);

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);

router.post("/", authorize("ADMIN"), createDepartment);
router.patch("/:id", authorize("ADMIN"), updateDepartment);
router.delete("/:id", authorize("ADMIN"), deleteDepartment);

export default router;