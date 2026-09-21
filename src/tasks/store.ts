import { randomUUID } from "node:crypto";
import type { CreateTaskInput, Task, UpdateTaskInput } from "./schema.js";

const tasks = new Map<string, Task>();

export function listTasks(): Task[] {
  return [...tasks.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function findTask(id: string): Task | undefined {
  return tasks.get(id);
}

export function createTask(input: CreateTaskInput): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    status: input.status,
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
  };
  tasks.set(task.id, task);
  return task;
}

export function updateTask(
  id: string,
  input: UpdateTaskInput,
): Task | undefined {
  const current = tasks.get(id);
  if (!current) return undefined;

  const updated: Task = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  tasks.set(id, updated);
  return updated;
}

export function deleteTask(id: string): boolean {
  return tasks.delete(id);
}
