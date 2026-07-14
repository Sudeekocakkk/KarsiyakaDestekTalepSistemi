import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment,
} from "../controllers/department.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);

router.post("/", authorize("ADMIN"), createDepartment);
router.patch("/:id", authorize("ADMIN"), updateDepartment);
router.delete("/:id", authorize("ADMIN"), deleteDepartment);

export default router;