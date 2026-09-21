import { Router } from "express";
import { z } from "zod";
import { badRequest, notFound } from "../errors.js";
import { createTaskSchema, updateTaskSchema } from "./schema.js";
import * as store from "./store.js";

export const tasksRouter = Router();

tasksRouter.get("/", (_req, res) => {
  res.json(store.listTasks());
});

tasksRouter.post("/", (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest("リクエストボディが不正です。", {
      errors: z.flattenError(parsed.error),
    });
  }

  const tasks = store.createTask(parsed.data);
  res.status(201).location(`/tasks/${tasks.id}`).json(tasks);
});

tasksRouter.get("/:id", (req, res) => {
  const task = store.findTask(req.params.id);
  if (!task) throw notFound(`タスク ${req.params.id} は存在しません。`);

  res.json(task);
});

tasksRouter.patch("/:id", (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest("リクエストボディが不正です。", {
      errors: z.flattenError(parsed.error),
    });
  }

  const task = store.updateTask(req.params.id, parsed.data);
  if (!task) throw notFound(`ID '${req.params.id}' のタスクは存在しません。`);
  res.json(task);
});

tasksRouter.delete("/:id", (req, res) => {
  const deleted = store.deleteTask(req.params.id);
  if (!deleted) throw notFound(`ID '${req.params.id}' のタスクは存在しません。`);
  res.status(204).send();
});
