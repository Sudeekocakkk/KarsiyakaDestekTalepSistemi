import express from "express";
import {
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

export default router;

