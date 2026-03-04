-- ============================================
-- Summary Slackbot — テーブル作成SQL
-- ============================================
-- ER図（docs/er-diagram.html）に基づいて作成
-- Supabase（PostgreSQL）で実行する
-- ============================================

-- 1. workspaces（ワークスペース情報）
CREATE TABLE workspaces (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id     TEXT NOT NULL UNIQUE,
    team_name   TEXT,
    bot_token   TEXT NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. channels（チャンネル情報）
CREATE TABLE channels (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_id    TEXT NOT NULL,
    channel_name  TEXT,
    UNIQUE (workspace_id, channel_id)
);

-- 3. summaries（要約履歴）
CREATE TABLE summaries (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_id     UUID REFERENCES channels(id) ON DELETE SET NULL,
    slack_user_id  TEXT NOT NULL,
    url            TEXT NOT NULL,
    title          TEXT,
    summary        TEXT NOT NULL,
    summary_level  TEXT DEFAULT '普通',
    llm_provider   TEXT DEFAULT 'anthropic',
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- インデックス（検索を高速化）
-- ============================================

-- ユーザーごとの履歴取得を高速化
CREATE INDEX idx_summaries_user ON summaries (slack_user_id, created_at DESC);

-- 同じURLの重複チェックを高速化
CREATE INDEX idx_summaries_url ON summaries (workspace_id, url);

-- ワークスペースごとの検索を高速化
CREATE INDEX idx_summaries_workspace ON summaries (workspace_id, created_at DESC);
