import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../auth/token.js";
import { unauthorized } from "../errors.js";

/**
 * Authorization: Bearer <token> を検証し、成功したら res.locals.userId にユーザーIDを入れる。
 * 失敗したら 401 を投げる(Express 5 なので、async 関数から投げた例外はエラーハンドラに渡る)。
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {

  const authHeader = req.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw unauthorized("認証が必要です。");
  }

  const token = authHeader.slice("Bearer ".length);
  const userId = await verifyToken(token);
  if (!userId) {
    throw unauthorized("トークンが無効です。", 'Bearer error="invalid_token"');
  }
  res.locals.userId = userId;
  next();
}
