// backend/src/controllers/statsController.js
import { prisma } from "../db/prisma.js";

export async function getTodoStats(req, res, next) {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.id }
    });

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;

    res.json({ total, completed, active });
  } catch (err) {
    next(err);
  }
}
