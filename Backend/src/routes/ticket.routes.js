import express from "express";
import {
  addMessage,
  addSolution,
  assignTicket,
  createTicket,
  getAllTickets,
  getAssignedTickets,
  getMyTickets,
  getTicketById,
  updateTicketStatus,
} from "../controllers/ticket.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { uploadTicketImages } from "../middlewares/upload.middleware.js";
import { validateCreateTicket } from "../validations/ticket.validation.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize("PERSONEL"),
  uploadTicketImages.array("images", 5),
  validateCreateTicket,
  createTicket
);

router.get("/my", authorize("PERSONEL"), getMyTickets);

router.get(
  "/assigned",
  authorize("TEKNIK_PERSONEL"),
  getAssignedTickets
);

router.get("/", authorize("ADMIN"), getAllTickets);

router.get("/:id", getTicketById);

router.patch(
  "/:id/assign",
  authorize("ADMIN"),
  assignTicket
);

router.patch(
  "/:id/status",
  authorize("ADMIN"),
  updateTicketStatus
);

router.patch(
  "/:id/solution",
  authorize("ADMIN"),
  addSolution
);

router.post("/:id/messages", addMessage);

export default router;