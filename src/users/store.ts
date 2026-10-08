import { hasPgErrorCode, pool } from "../db.js";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

// DB から返ってくる1行の形。列名は snake_case、timestamptz は Date になる
type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
};

const USER_COLUMNS = "id, username, password_hash, created_at";

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * ユーザーを登録する。username が既に使われていれば undefined を返す。
 *
 * 以前は「探してから作る」の2段階だったが、今は INSERT を1回投げるだけ。
 * 重複は users.username の一意制約で DB が拒否する(SQLSTATE 23505)ので、
 * 同時に同じ名前で登録されても、片方は必ず失敗する。
 */
export async function createUser(
  username: string,
  passwordHash: string,
): Promise<User | undefined> {
  try {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING ${USER_COLUMNS}`,
      [username, passwordHash],
    );
    const row = result.rows[0];
    return row ? toUser(row) : undefined;
  } catch (err) {
    if (hasPgErrorCode(err, "23505")) {
      return undefined;
    }
    throw err;
  }
}

/**
 * username でユーザーを探す。
 */
export async function findUserByUsername(
  username: string,
): Promise<User | undefined> {
  const result = await pool.query<UserRow>(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE username = $1`,
    [username],
  );
  const row = result.rows[0];
  return row ? toUser(row) : undefined;
}
