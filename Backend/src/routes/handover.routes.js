import express from "express";
import {
  cancelHandoverRequest,
  respondHandoverRequest,
} from "../controllers/handover.controller.js";
import {
  authenticate,
  requirePasswordChangeCompleted,
} from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validateRespondHandoverRequest } from "../validations/handover.validation.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);
router.use(authorize("TEKNIK_PERSONEL"));

router.patch("/:id/respond", validateRespondHandoverRequest, respondHandoverRequest);
router.patch("/:id/cancel", cancelHandoverRequest);

export default router;
