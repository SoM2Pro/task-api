import express from "express";
import { cors } from "./middleware/cors.js";
import { authRouter } from "./auth/router.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { tasksRouter } from "./tasks/router.js";

export const app = express();

app.use(cors);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/tasks", requireAuth, tasksRouter);
app.use("/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);
