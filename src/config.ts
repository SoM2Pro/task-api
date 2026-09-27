const MIN_SECRET_BYTES = 32;

/**
 * 環境変数を読む。未設定または空文字なら例外を投げる。
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Environment variable '${name}' is not set`);
  }
  return value;
}

/**
 * JWT_SECRET を読み、jose に渡せるバイト列に変換する。
 */
function loadJwtSecret(): Uint8Array {
  const secret = requireEnv("JWT_SECRET");
  const encoded = new TextEncoder().encode(secret);
  if (encoded.length < MIN_SECRET_BYTES) {
    throw new Error(`Environment variable 'JWT_SECRET' must be at least ${MIN_SECRET_BYTES} bytes`);
  }
  return encoded;
}

// モジュールの読み込み時に評価されるので、設定が不正ならサーバーは起動せずに落ちる(fail fast)。
export const config = {
  jwtSecret: loadJwtSecret(),
  jwtIssuer: "task-api",
  jwtAudience: "task-api",
  jwtExpiresInSeconds: 600,
  // Swagger UI(docker run -p 8080:8080)からの呼び出しを許可する
  corsAllowedOrigin: process.env.CORS_ORIGIN ?? "http://localhost:8080",
} as const;
