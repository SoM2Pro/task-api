import { Router, type Response } from "express";
import { z } from "zod";
import { badRequest, notFound } from "../errors.js";
import { createTaskSchema, updateTaskSchema } from "./schema.js";
import * as store from "./store.js";

export const tasksRouter = Router();

// requireAuth が res.locals.userId に入れたログイン中のユーザーID
function currentUserId(res: Response): string {
  return res.locals.userId as string;
}

/**
 * パスの :id を検証する。UUID の形でなければ 404 にする。
 * そのまま DB に渡すと、PostgreSQL が uuid 型への変換に失敗して 500 になるため。
 */
function parseTaskId(id: string): string {
  if (!z.uuid().safeParse(id).success) {
    throw notFound(`ID '${id}' のタスクは存在しません。`);
  }
  return id;
}

tasksRouter.get("/", async (_req, res) => {
  res.json(await store.listTasks(currentUserId(res)));
});

tasksRouter.post("/", async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest("リクエストボディが不正です。", {
      errors: z.flattenError(parsed.error),
    });
  }

  const task = await store.createTask(currentUserId(res), parsed.data);
  res.status(201).location(`/tasks/${task.id}`).json(task);
});

tasksRouter.get("/:id", async (req, res) => {
  const id = parseTaskId(req.params.id);
  const task = await store.findTask(currentUserId(res), id);
  if (!task) throw notFound(`ID '${id}' のタスクは存在しません。`);

  res.json(task);
});

tasksRouter.patch("/:id", async (req, res) => {
  const id = parseTaskId(req.params.id);
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest("リクエストボディが不正です。", {
      errors: z.flattenError(parsed.error),
    });
  }

  const task = await store.updateTask(currentUserId(res), id, parsed.data);
  if (!task) throw notFound(`ID '${id}' のタスクは存在しません。`);
  res.json(task);
});

tasksRouter.delete("/:id", async (req, res) => {
  const id = parseTaskId(req.params.id);
  const deleted = await store.deleteTask(currentUserId(res), id);
  if (!deleted) throw notFound(`ID '${id}' のタスクは存在しません。`);
  res.status(204).send();
});
