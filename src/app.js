import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { serveSwagger, setupSwagger } from "./config/swagger.js";
import AppError from "./utils/appError.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api-docs", serveSwagger, setupSwagger);

app.get("/", (req, res) => {
  res.json({
    status: "Done",
    message: "Server is running",
  });
});

app.use((req, res, next) => {
  next(new AppError(404, `Cannot ${req.method} ${req.originalUrl}`));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message: err.message,
  });
});

export default app;
