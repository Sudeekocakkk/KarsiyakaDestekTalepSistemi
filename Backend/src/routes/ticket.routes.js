import express from "express";
import {
  createTicket,
  getAllTickets,
  getAssignedTickets,
  getMyTickets,
  getTicketById,
  updateTicket,
} from "../controllers/ticket.controller.js";

import {
  authenticate,
  requirePasswordChangeCompleted,
} from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { uploadTicketImages } from "../middlewares/upload.middleware.js";
import { validateCreateTicket } from "../validations/ticket.validation.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

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

// Talep detayındaki tek "Kaydet" butonunun karşılığı: personel atama, durum,
// çözüm açıklaması ve açıklama/not alanlarından yalnızca gönderilenleri
// günceller. Rol/sahiplik denetimi alan bazında controller içinde yapılır,
// bu yüzden burada rota seviyesinde rol kısıtı uygulanmaz (PERSONEL de kendi
// talebine not ekleyebilmelidir).
router.patch("/:id", updateTicket);

export default router;