import { pool } from "../db.js";
import type { CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from "./schema.js";

// DB から返ってくる1行の形。列名は snake_case、timestamptz は Date になる
type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
};

// API で返す列。user_id は返さない(持ち主は本人なので返す必要がない)
const TASK_COLUMNS =
  "id, title, description, status, due_date, created_at, updated_at";

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date ? row.due_date.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/*
 * どの関数も userId を受け取り、WHERE に必ず user_id = ... を付ける。
 * 他人のタスクは「存在しない」のと同じ結果(0件)になるので、ルーターは 404 を返す(D5)。
 */

export async function listTasks(userId: string): Promise<Task[]> {
  const result = await pool.query<TaskRow>(
    `SELECT ${TASK_COLUMNS}
     FROM tasks
     WHERE user_id = $1
     ORDER BY created_at`,
    [userId],
  );
  return result.rows.map(toTask);
}

export async function findTask(
  userId: string,
  id: string,
): Promise<Task | undefined> {
  const result = await pool.query<TaskRow>(
    `SELECT ${TASK_COLUMNS}
     FROM tasks
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  const row = result.rows[0];
  return row ? toTask(row) : undefined;
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<Task> {
  // id・created_at・updated_at は書かない。DB の既定値(gen_random_uuid() / now())が入る
  const result = await pool.query<TaskRow>(
    `INSERT INTO tasks (user_id, title, description, status, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${TASK_COLUMNS}`,
    [userId, input.title, input.description, input.status, input.dueDate],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("INSERT ... RETURNING が行を返しませんでした");
  }
  return toTask(row);
}

// API のフィールド名 → DB の列名。SET 句に入れてよい列はここにあるものだけ
const UPDATABLE_COLUMNS = {
  title: "title",
  description: "description",
  status: "status",
  dueDate: "due_date",
} as const satisfies Record<keyof UpdateTaskInput, string>;

export async function updateTask(
  userId: string,
  id: string,
  input: UpdateTaskInput,
): Promise<Task | undefined> {
  // 送られてきたフィールドだけを SET 句に並べる。
  // 値は $1, $2 ... のプレースホルダで渡し、列名は上の固定の表からしか選ばない(SQL インジェクション対策)
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of Object.keys(UPDATABLE_COLUMNS) as (keyof UpdateTaskInput)[]) {
    if (key in input) {
      values.push(input[key]);
      sets.push(`${UPDATABLE_COLUMNS[key]} = $${values.length}`);
    }
  }
  values.push(id, userId);
  const idParam = `$${values.length - 1}`;
  const userIdParam = `$${values.length}`;

  const result = await pool.query<TaskRow>(
    `UPDATE tasks
     SET ${sets.join(", ")}, updated_at = now()
     WHERE id = ${idParam} AND user_id = ${userIdParam}
     RETURNING ${TASK_COLUMNS}`,
    values,
  );
  const row = result.rows[0];
  return row ? toTask(row) : undefined;
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM tasks
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  // rowCount = 実際に削除された行数。他人のタスクや存在しない ID なら 0
  return result.rowCount === 1;
}
