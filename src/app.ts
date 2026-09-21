import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { tasksRouter } from "./tasks/router.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/tasks", tasksRouter);

app.use(notFoundHandler);
app.use(errorHandler);
