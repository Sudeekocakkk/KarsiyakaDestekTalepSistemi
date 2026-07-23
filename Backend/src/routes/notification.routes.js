import express from "express";
import {
  getAllNotificationsAdmin,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller.js";
import {
  authenticate,
  requirePasswordChangeCompleted,
} from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

router.get("/admin", authorize("ADMIN"), getAllNotificationsAdmin);

export default router;
