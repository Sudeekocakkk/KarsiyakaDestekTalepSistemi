import express from "express";
import {
  createSpecialization,
  deleteSpecialization,
  getSpecializationById,
  getSpecializations,
  updateSpecialization,
} from "../controllers/specialization.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getSpecializations);
router.get("/:id", getSpecializationById);

router.post("/", authorize("ADMIN"), createSpecialization);
router.patch("/:id", authorize("ADMIN"), updateSpecialization);
router.delete("/:id", authorize("ADMIN"), deleteSpecialization);

export default router;