# task-api

タスクの作成・取得・更新・削除ができるREST API。  
Node.js + TypeScript でのAPI設計、OpenAPI仕様書の作成、コンテナ化を実践するための学習用プロジェクト。

## 技術スタック
- Node.js 22 / TypeScript
- Express 5
- zod（バリデーション）
- Docker（マルチステージビルド）

## データストア
現時点ではプロセス内のインメモリストア（`Map`）に保持する。サーバーを再起動するとデータは失われる。  
API設計の実践を目的とした段階のため、永続化層は意図的に未導入。

## セットアップ

### 必要なもの
- Node.js 22.12 以上（`package.json` の `engines` で指定）
- Docker（コンテナで動かす場合、Swagger UI を見る場合）

### ローカルで起動する

```bash
npm ci
npm run dev
```

`http://localhost:3000` で待ち受ける。動作確認:

```bash
curl localhost:3000/health
# {"status":"ok"}

curl -X POST localhost:3000/tasks \
  -H 'content-type: application/json' \
  -d '{"title":"最初のタスク"}'
```

待ち受けポートは環境変数 `PORT` で変更できる（既定 3000）。

### npm スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | tsx watch で起動。ソース変更時に自動再起動する |
| `npm run build` | `tsc` で `src/` を `dist/` にコンパイル |
| `npm start` | `dist/server.js` を実行（先に `npm run build` が必要） |
| `npm run typecheck` | 型検査のみ実行（`tsc --noEmit`） |
| `npm run lint:api` | `openapi.yaml` を Redocly で検証 |

> `npm run dev` が使う tsx はトランスパイルのみで**型検査を行わない**。
> 型エラーがあっても起動してしまうため、`npm run typecheck` を併用すること。

## Docker で起動する

```bash
docker build -t task-api .
docker run -d --name task-api -p 3000:3000 task-api

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
- runner では `npm ci --omit=dev` により本番依存（express / zod）だけを導入する
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

> "Try it out" からの実行は、APIサーバー側がCORS未対応のため現時点では失敗する。

## ライセンス
MIT
