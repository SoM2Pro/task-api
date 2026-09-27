import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

const ALLOWED_METHODS = "GET, POST, PATCH, DELETE";
const ALLOWED_HEADERS = "Authorization, Content-Type";
// ブラウザがプリフライトの結果をキャッシュしてよい秒数
const PREFLIGHT_MAX_AGE_SECONDS = 600;

/**
 * 許可したオリジンからのブラウザのリクエストに、CORS のレスポンスヘッダを付ける。
 * プリフライト(OPTIONS)には、ここで 204 を返して終わらせる。
 */
export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get("Origin");
  if (origin && origin === config.corsAllowedOrigin) {
    res.set("Access-Control-Allow-Origin", origin);
  }

  res.vary("Origin");

  if (req.method === "OPTIONS" && req.get("Access-Control-Request-Method")) {
    res.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    res.set("Access-Control-Max-Age", PREFLIGHT_MAX_AGE_SECONDS.toString());
    res.status(204).end();
    return;
  }

  next();
}
