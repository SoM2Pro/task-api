import { SignJWT } from "jose";
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
