import express from "express";
import { authRouter } from "./auth/router.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { tasksRouter } from "./tasks/router.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/tasks", tasksRouter);
app.use("/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);
