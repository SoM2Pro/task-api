# task-api

タスクの作成・取得・更新・削除ができるREST API。  
Node.js + TypeScript でのAPI設計、OpenAPI仕様書の作成、コンテナ化を実践するための学習用プロジェクト。

## 技術スタック
- Node.js 22 / TypeScript
- Express 5
- zod（バリデーション）
- jose（JWT の発行・検証）
- PostgreSQL 18（`pg` で接続。ローカルでは Docker Compose で起動）
- Docker（マルチステージビルド）

## データストア
ユーザーとタスクは PostgreSQL に保存する。API サーバーを再起動してもデータは残る。

- テーブル定義は [db/init/001_schema.sql](./db/init/001_schema.sql)。DB のボリュームが空のとき（初回起動時）にだけ実行される
- データは Docker の名前付きボリューム `db-data` に置く。`docker compose down` でコンテナを消しても残り、
  `docker compose down -v` でボリュームごと消したときだけ失われる
- テーブル定義を変えたときは `docker compose down -v` → `docker compose up -d` で作り直す（データも消える）
- タスクは作成したユーザーのものになり、本人しか操作できない（他人のタスクは 404）

## セットアップ

### 必要なもの
- Node.js 22.12 以上（`package.json` の `engines` で指定）
- Docker（PostgreSQL の起動に必須。API をコンテナで動かす場合、Swagger UI を見る場合にも使う）
- jq（「ローカルで起動する」の curl の例で、レスポンスからトークンを取り出すのに使用）

### 環境変数

| 変数 | 必須 | 内容 |
|---|---|---|
| `JWT_SECRET` | ○ | JWT の署名に使う秘密鍵。32バイト以上。**未設定または短すぎる場合、サーバーは起動時に終了する** |
| `DATABASE_URL` | ○ | PostgreSQL の接続先。`postgres://ユーザー:パスワード@ホスト:ポート/DB名` の形式。**未設定の場合、サーバーは起動時に終了する** |
| `PORT` | | 待ち受けポート（既定 `3000`） |
| `CORS_ORIGIN` | | ブラウザからの呼び出しを許可するオリジン（既定 `http://localhost:8080` = Swagger UI） |

ローカルでは、リポジトリのルートに `.env` を作って設定する。`npm run dev` はこのファイルを読み込む。

```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
echo "DATABASE_URL=postgres://taskapi:taskapi@localhost:5432/taskapi" >> .env
```

`DATABASE_URL` の値は [compose.yaml](./compose.yaml) のローカル開発用の設定に合わせたもの。

`.env` は `.gitignore` と `.dockerignore` で除外しており、Git にも Docker イメージにも含まれない。

### ローカルで起動する

```bash
npm ci
docker compose up -d   # PostgreSQL を起動（初回はテーブルも作られる）
docker compose ps      # STATUS が healthy になるまで待つ
npm run dev
```

PostgreSQL は `127.0.0.1:5432` にだけ公開しているので、同じマシンの中からしか接続できない。
止めるときは `docker compose stop`（データは残る）。

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
docker compose up -d   # PostgreSQL を先に起動しておく
docker build -t task-api .
docker run -d --name task-api -p 3000:3000 --env-file .env \
  -e DATABASE_URL=postgres://taskapi:taskapi@host.docker.internal:5432/taskapi \
  task-api

curl localhost:3000/health
docker logs task-api
```

コンテナの中の `localhost` はコンテナ自身を指すため、`.env` の `DATABASE_URL`（`localhost`）のままでは
PostgreSQL に届かない。`-e` で、ホストの Mac を指す `host.docker.internal` に上書きしている
（`-e` は `--env-file` より優先される。Docker Desktop で使える名前）。

停止・削除:

```bash
docker rm -f task-api
```

イメージの構成:

- **マルチステージビルド**。builder（`node:22`）で `npm ci` → `tsc` を実行し、
  runner（`node:22-slim`）へは `dist` のみを持ち込む
- runner では `npm ci --omit=dev` により本番依存（express / zod / jose / pg）だけを導入する
- 秘密鍵と DB の接続先はイメージに含めず、実行時に環境変数として渡す（`--env-file` または `-e`）
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
