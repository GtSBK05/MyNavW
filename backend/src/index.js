// backend/src/index.js
import express from "express";
import cors from "cors";
import compression from "compression";
import { ENV } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(compression());
app.use(cors({ origin: ENV.CORS_ORIGIN }));
app.use(express.json({ limit: "50kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "MyNavW" });
});

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/stats", statsRoutes);

app.use(errorHandler);

app.listen(ENV.PORT, () => {
  console.log(`MyNavW API running at http://localhost:${ENV.PORT}`);
});
