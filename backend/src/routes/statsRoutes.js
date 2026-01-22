// backend/src/routes/statsRoutes.js
import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { getTodoStats } from "../controllers/statsController.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/todos", getTodoStats);

export default router;
