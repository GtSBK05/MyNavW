// backend/src/config/env.js
import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3001"
};
