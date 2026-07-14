import express from "express";
import {
  createCategory,
  deactivateCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/category.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.post("/", authorize("ADMIN"), createCategory);
router.patch("/:id", authorize("ADMIN"), updateCategory);
router.patch(
  "/:id/deactivate",
  authorize("ADMIN"),
  deactivateCategory
);

export default router;