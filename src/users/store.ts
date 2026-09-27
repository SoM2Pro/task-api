import { randomUUID } from "node:crypto";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

const usersById = new Map<string, User>();
// ログイン時に username から引くための索引(username → id)
const idsByUsername = new Map<string, string>();

/**
 * ユーザーを登録する。username が既に使われていれば undefined を返す。
 */
export function createUser(
  username: string,
  passwordHash: string,
): User | undefined {
  if (idsByUsername.has(username)) {
    return undefined;
  }
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const user: User = { id, username, passwordHash, createdAt };
  usersById.set(id, user);
  idsByUsername.set(username, id);
  return user;
}

/**
 * username でユーザーを探す。
 */
export function findUserByUsername(username: string): User | undefined {
  const id = idsByUsername.get(username);
  if (!id) {
    return undefined;
  }
  return usersById.get(id);
}
