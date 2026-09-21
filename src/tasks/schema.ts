import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "doing", "done"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).nullable(),
  status: taskStatusSchema,
  dueDate: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskSchema = z.strictObject({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).nullable().default(null),
  status: taskStatusSchema.default("todo"),
  dueDate: z.iso.datetime().nullable().default(null),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .strictObject({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).nullable(),
    status: taskStatusSchema,
    dueDate: z.iso.datetime().nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "更新するフィールドを1つ以上指定してください。",
  });
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
