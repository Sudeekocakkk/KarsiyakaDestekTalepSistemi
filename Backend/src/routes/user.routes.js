import express from "express";
import {
  createUser,
  deactivateUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/user.controller.js";
import {
  authenticate,
  requirePasswordChangeCompleted,
} from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);
router.use(authorize("ADMIN"));

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.patch("/:id/deactivate", deactivateUser);

export default router;