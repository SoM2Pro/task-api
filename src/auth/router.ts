import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { badRequest, conflict, unauthorized } from "../errors.js";
import * as users from "../users/store.js";
import { getDummyHash, hashPassword, verifyPassword } from "./password.js";
import { credentialsSchema } from "./schema.js";
import { issueToken } from "./token.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest("リクエストボディが不正です。", {
      errors: z.flattenError(parsed.error),
    });
  }
  const { username, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  const user = users.createUser(username, passwordHash);
  if (!user) {
    throw conflict("ユーザー名は既に使用されています。");
  }
  res.status(201).json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest("リクエストボディが不正です。", {
      errors: z.flattenError(parsed.error),
    });
  }
  const { username, password } = parsed.data;
  const user = users.findUserByUsername(username);
  const storedHash = user ? user.passwordHash : await getDummyHash();
  const isValid = await verifyPassword(password, storedHash);
  if (!isValid || !user) {
    throw unauthorized("ユーザー名またはパスワードが違います。");
  }
  const accessToken = await issueToken(user.id);
  res.status(200).json({
    accessToken,
    tokenType: "Bearer",
    expiresIn: config.jwtExpiresInSeconds,
  });
});
