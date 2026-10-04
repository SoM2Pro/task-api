-- テーブル定義。設計の原本: 001_ClaudeTraining/Web/Week3/db_design.md
-- このファイルは、DB のボリュームが空のとき(初回起動時)にだけ実行される。
-- 定義を変えたら `docker compose down -v` でボリュームごと消してから起動し直す(データも消える)。

CREATE TABLE users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 一意制約。同時に同じ名前で登録されても、後から来た方は DB が拒否する
  username      text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ユーザーが削除されたら、そのユーザーのタスクも一緒に削除する(D4)
  user_id     uuid          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       varchar(100)  NOT NULL,
  description varchar(1000),
  -- 状態は3つの値のどれかに限る(D2)
  status      text          NOT NULL DEFAULT 'todo'
                            CHECK (status IN ('todo', 'doing', 'done')),
  due_date    timestamptz,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

-- 「自分のタスクの一覧」は user_id で絞り込むので、索引を張る。
-- PostgreSQL は外部キーを作っても、参照する側(tasks.user_id)に索引を自動では作らない。
CREATE INDEX tasks_user_id_idx ON tasks (user_id);
