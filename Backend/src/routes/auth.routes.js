import express from "express";
import {
  changePassword,
  getMe,
  login,
  register,
  setupAdmin,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import {
  validateLogin,
  validateRegister,
} from "../validations/auth.validation.js";

const router = express.Router();

router.post("/setup", setupAdmin);
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

router.get("/me", authenticate, getMe);

// Bilinçli olarak requirePasswordChangeCompleted kullanmaz: mustChangePassword
// engelini kaldırmanın tek yolu budur.
router.patch("/change-password", authenticate, changePassword);

export default router;

