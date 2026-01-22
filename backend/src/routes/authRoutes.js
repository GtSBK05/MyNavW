// backend/src/routes/authRoutes.js
import express from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

const authSchema = z.object({
  body: z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter")
  })
});

router.post("/register", validate(authSchema), register);
router.post("/login", validate(authSchema), login);

export default router;
