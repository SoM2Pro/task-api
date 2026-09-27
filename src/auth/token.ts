import { SignJWT, errors, jwtVerify } from "jose";
import { config } from "../config.js";

/**
 * ユーザーIDを sub に入れたアクセストークン(JWT)を発行する。
 */
export async function issueToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(config.jwtIssuer)
    .setAudience(config.jwtAudience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + config.jwtExpiresInSeconds)
    .sign(config.jwtSecret);
}

/**
 * アクセストークンを検証し、成功したらユーザーID(sub)を返す。
 * 署名不一致・期限切れ・形式不正など、トークン側の問題なら undefined を返す。
 */
export async function verifyToken(token: string): Promise<string | undefined> {
  try {
    const { payload } = await jwtVerify(token, config.jwtSecret, {
      algorithms: ["HS256"],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });
    if (typeof payload.sub === "string") {
      return payload.sub;
    }
    else {
      return undefined;
    }
  } catch (err) {
    if (err instanceof errors.JOSEError) {
      return undefined;
    }
    throw err;
  }
}
