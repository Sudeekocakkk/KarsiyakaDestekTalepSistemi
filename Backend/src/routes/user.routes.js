import express from "express";
import {
  createUser,
  deactivateUser,
  getTechnicians,
  getUserById,
  getUsers,
  updateMe,
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

// Oturum açmış herhangi bir rol kendi profilini bu uçtan günceller;
// bu yüzden aşağıdaki ADMIN yetki kapısından önce tanımlanır.
router.patch("/me", updateMe);

// Devir isteği/uzmanlığa aktarım akışlarında bir TEKNIK_PERSONEL'in diğer
// aktif teknik personelleri görebilmesi gerekir; bu yüzden de ADMIN yetki
// kapısından önce, kendi rol kısıtıyla tanımlanır.
router.get("/technicians", authorize("TEKNIK_PERSONEL", "ADMIN"), getTechnicians);

router.use(authorize("ADMIN"));

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.patch("/:id/deactivate", deactivateUser);

export default router;