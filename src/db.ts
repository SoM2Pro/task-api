import pg from "pg";
import { config } from "./config.js";

/**
 * PostgreSQL への接続プール。
 * リクエストのたびに接続を張るのではなく、張った接続を使い回す(既定で最大10本)。
 * pool.query() は空いている接続を1本借りて SQL を実行し、終わったら返す。
 */
export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// 使われていない接続が DB 側から切られたとき(DB の再起動など)に、プロセスごと落ちないようにする
pool.on("error", (err) => {
  console.error("PostgreSQL の待機中の接続でエラーが発生しました:", err);
});

/**
 * PostgreSQL のエラーコード(SQLSTATE)が一致するかを調べる。
 * 例: "23505" = 一意制約違反(unique_violation)
 */
export function hasPgErrorCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === code;
}
