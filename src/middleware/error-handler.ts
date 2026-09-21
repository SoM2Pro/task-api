import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors.js";

type Problem = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
};

function sendProblem(
  res: Response,
  problem: Problem,
  extensions: Record<string, unknown> = {},
) : void {
  res
    .status(problem.status)
    .type("application/problem+json")
    .json({ ...problem, ...extensions });
}

export function notFoundHandler(req: Request, res: Response): void {
  sendProblem(res, {
    type: "about:blank",
    title: "Not Found",
    status: 404,
    detail: `エンドポイント ${req.method} ${req.originalUrl} は存在しません。`,
    instance: req.originalUrl,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    sendProblem(
      res,
      {
        type: "about:blank",
        title: err.title,
        status: err.status,
        detail: err.detail,
        instance: req.originalUrl,
      },
      err.extensions,
    );
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    sendProblem(res, {
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "リクエストボディが不正なJSONです。",
      instance: req.originalUrl,
    });
    return;
  }

  console.error(err);
  sendProblem(res, {
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    detail: "予期しないエラーが発生しました。",
    instance: req.originalUrl,
  });
}
