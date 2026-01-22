// backend/src/routes/todoRoutes.js
import express from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
import { authMiddleware } from "../middlewares/auth.js";
import {
  getTodos,
  createTodo,
  toggleTodo,
  updateTodo,
  deleteTodo
} from "../controllers/todoController.js";

const router = express.Router();

const createTodoSchema = z.object({
  body: z.object({
    text: z.string().min(1, "Text tidak boleh kosong").max(200, "Max 200 karakter")
  })
});

const updateTodoSchema = z.object({
  body: z.object({
    text: z
      .string()
      .min(1, "Text tidak boleh kosong")
      .max(200, "Max 200 karakter")
  })
});

router.use(authMiddleware);

router.get("/", getTodos);
router.post("/", validate(createTodoSchema), createTodo);
router.patch("/:id/toggle", toggleTodo);
router.patch("/:id", validate(updateTodoSchema), updateTodo);
router.delete("/:id", deleteTodo);

export default router;
