import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// OWASP Password Storage Cheat Sheet の推奨値。
// 128 * N * r = 128MiB を使うので、既定の maxmem(32MiB)では足りない。
const SCRYPT_OPTIONS = {
  N: 2 ** 17,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
} as const;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * scrypt(コールバック形式)を Promise で包む。
 */
function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (err, key) => {
      if (err) {
        reject(err);
      } else {
        resolve(key);
      }
    });
  });
}

/**
 * パスワードをハッシュ化し、保存用の文字列 "<salt>:<hash>"(どちらも base64)を返す。
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await deriveKey(password, salt);
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

/**
 * 入力されたパスワードが、保存済みの文字列と一致するかを確かめる。
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltBase64, hashBase64] = stored.split(":");
  if (!saltBase64 || !hashBase64) {
    return false;
  }

  const salt = Buffer.from(saltBase64, "base64");
  const storedHash = Buffer.from(hashBase64, "base64");
  const hash = await deriveKey(password, salt);
  if (hash.length !== storedHash.length) {
    return false;
  }
  return timingSafeEqual(hash, storedHash);
}

let dummyHash: Promise<string> | undefined;

/**
 * ユーザーが存在しないときの照合用ハッシュ。
 * 存在するときと同じだけ時間をかけることで、応答時間からユーザーの有無が分からないようにする。
 */
export function getDummyHash(): Promise<string> {
  if (!dummyHash) {
    const randomPassword = randomBytes(32).toString("base64");
    dummyHash = hashPassword(randomPassword);
  }
  return dummyHash;
}

void getDummyHash(); // 初回呼び出しで dummyHash を作る
