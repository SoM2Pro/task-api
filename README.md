# task-api

タスクの作成・取得・更新・削除ができるREST API。  
Node.js + TypeScript でのAPI設計、OpenAPI仕様書の作成、コンテナ化を実践するための学習用プロジェクト。

## 技術スタック
- Node.js 22 / TypeScript
- Express 5
- zod（バリデーション）
- jose（JWT の発行・検証）
- Docker（マルチステージビルド）

## データストア
現時点ではプロセス内のインメモリストア（`Map`）に保持する。サーバーを再起動すると、
タスクも登録済みのユーザーも失われる。  
API設計の実践を目的とした段階のため、永続化層は意図的に未導入。

## セットアップ

### 必要なもの
- Node.js 22.12 以上（`package.json` の `engines` で指定）
- Docker（コンテナで動かす場合、Swagger UI を見る場合）

### 環境変数

| 変数 | 必須 | 内容 |
|---|---|---|
| `JWT_SECRET` | ○ | JWT の署名に使う秘密鍵。32バイト以上。**未設定または短すぎる場合、サーバーは起動時に終了する** |
| `PORT` | | 待ち受けポート（既定 `3000`） |
| `CORS_ORIGIN` | | ブラウザからの呼び出しを許可するオリジン（既定 `http://localhost:8080` = Swagger UI） |

ローカルでは、リポジトリのルートに `.env` を作って設定する。`npm run dev` はこのファイルを読み込む。

```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
```

`.env` は `.gitignore` と `.dockerignore` で除外しており、Git にも Docker イメージにも含まれない。

### ローカルで起動する

```bash
npm ci
npm run dev
```

`http://localhost:3000` で待ち受ける。動作確認:

```bash
curl localhost:3000/health
# {"status":"ok"}

# ユーザー登録 → ログインしてトークンを取得
curl -X POST localhost:3000/auth/register \
  -H 'content-type: application/json' \
  -d '{"username":"alice","password":"password123"}'

TOKEN=$(curl -s -X POST localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"alice","password":"password123"}' | jq -r .accessToken)

# /tasks 配下はトークンが必要（ないと 401）
curl -X POST localhost:3000/tasks \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"最初のタスク"}'
```

トークンの有効期限は10分。期限が切れたら、再度ログインして取り直す。

### npm スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | tsx watch で起動。`.env` を読み込み、ソース変更時に自動再起動する |
| `npm run build` | `tsc` で `src/` を `dist/` にコンパイル |
| `npm start` | `dist/server.js` を実行（先に `npm run build` が必要） |
| `npm run typecheck` | 型検査のみ実行（`tsc --noEmit`） |
| `npm run lint:api` | `openapi.yaml` を Redocly で検証 |

> `npm run dev` が使う tsx はトランスパイルのみで**型検査を行わない**。
> 型エラーがあっても起動してしまうため、`npm run typecheck` を併用すること。

## Docker で起動する

```bash
docker build -t task-api .
docker run -d --name task-api -p 3000:3000 --env-file .env task-api

curl localhost:3000/health
docker logs task-api
```

停止・削除:

```bash
docker rm -f task-api
```

イメージの構成:

- **マルチステージビルド**。builder（`node:22`）で `npm ci` → `tsc` を実行し、
  runner（`node:22-slim`）へは `dist` のみを持ち込む
- runner では `npm ci --omit=dev` により本番依存（express / zod / jose）だけを導入する
- 秘密鍵はイメージに含めず、実行時に環境変数として渡す（`--env-file` または `-e JWT_SECRET=...`）
- 非rootユーザー `node`（uid 1000）で実行する

## API仕様書

エンドポイントの一覧、リクエスト・レスポンスの形式、ステータスコードは
すべて OpenAPI 3.1 形式で [openapi.yaml](./openapi.yaml) に定義している。**これが唯一の正**とし、
READMEには複製しない。

エラー応答は RFC 9457（Problem Details）形式で、`application/problem+json` として返す。

### 検証

```bash
npm run lint:api
```

### ブラウザで閲覧する（Swagger UI）

```bash
docker run --rm -p 8080:8080 \
  -e SWAGGER_JSON=/spec/openapi.yaml \
  -v "$(pwd)/openapi.yaml:/spec/openapi.yaml:ro" \
  swaggerapi/swagger-ui
```

`http://localhost:8080` を開く。終了は `Ctrl+C`。

> `$(pwd)/openapi.yaml` を参照するため、**リポジトリのルートで実行すること**。

"Try it out" で実際に API を呼ぶには、先に `npm run dev` でAPIサーバーを起動しておく。
`/tasks` 配下を呼ぶ手順:

1. `POST /auth/register` → `POST /auth/login` を実行し、レスポンスの `accessToken` をコピーする
2. 右上の **Authorize** にトークンを貼り付ける（`Bearer ` は付けない）
3. `/tasks` 配下の操作を実行する

Swagger UI（`localhost:8080`）から API（`localhost:3000`）への呼び出しはクロスオリジンになるため、
API は `CORS_ORIGIN` で許可したオリジンにだけ CORS のレスポンスヘッダを返す。

## ライセンス
MIT
