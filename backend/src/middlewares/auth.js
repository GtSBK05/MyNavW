// backend/src/middlewares/auth.js
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token tidak ada" });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token tidak valid" });
  }
}
