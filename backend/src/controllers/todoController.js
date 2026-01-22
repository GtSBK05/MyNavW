// backend/src/controllers/todoController.js
import { prisma } from "../db/prisma.js";

export async function getTodos(req, res, next) {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" }
    });
    res.json(todos);
  } catch (err) {
    next(err);
  }
}

export async function createTodo(req, res, next) {
  try {
    const { text } = req.body;

    const todo = await prisma.todo.create({
      data: {
        text,
        userId: req.user.id
      }
    });

    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

export async function toggleTodo(req, res, next) {
  try {
    const id = Number(req.params.id);

    const todo = await prisma.todo.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!todo) {
      return res.status(404).json({ error: "Todo tidak ditemukan" });
    }

    const updated = await prisma.todo.update({
      where: { id },
      data: { completed: !todo.completed }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function updateTodo(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text tidak boleh kosong" });
    }

    const todo = await prisma.todo.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!todo) {
      return res.status(404).json({ error: "Todo tidak ditemukan" });
    }

    const updated = await prisma.todo.update({
      where: { id },
      data: { text: text.trim() }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteTodo(req, res, next) {
  try {
    const id = Number(req.params.id);

    const todo = await prisma.todo.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!todo) {
      return res.status(404).json({ error: "Todo tidak ditemukan" });
    }

    await prisma.todo.delete({ where: { id } });

    res.json({ message: "Todo dihapus" });
  } catch (err) {
    next(err);
  }
}
