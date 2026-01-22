// backend/src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { ENV } from "../config/env.js";

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash }
    });

    const token = createToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Email atau password salah" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: "Email atau password salah" });
    }

    const token = createToken(user);

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}
