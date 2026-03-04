-- ============================================
-- Summary Slackbot — テーブル作成SQL
-- ============================================
-- auth.users テーブルは Supabase Auth が自動管理するため
-- ここでは summaries テーブルのみ作成する

-- ============================================
-- summaries テーブル（要約履歴）
-- ============================================
CREATE TABLE summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    summary TEXT NOT NULL,
    summary_level TEXT DEFAULT '普通' CHECK (summary_level IN ('簡単', '普通', '詳しく')),
    llm_provider TEXT DEFAULT 'anthropic' CHECK (llm_provider IN ('anthropic', 'openai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- コメント
COMMENT ON TABLE summaries IS '要約履歴テーブル';
COMMENT ON COLUMN summaries.user_id IS 'auth.usersのユーザーID';
COMMENT ON COLUMN summaries.url IS '要約した記事のURL';
COMMENT ON COLUMN summaries.title IS '記事のタイトル（スクレイピングで取得）';
COMMENT ON COLUMN summaries.summary IS 'AIが生成した要約本文';
COMMENT ON COLUMN summaries.summary_level IS '要約レベル（簡単/普通/詳しく）';
COMMENT ON COLUMN summaries.llm_provider IS '使用したLLM（anthropic/openai）';

-- ============================================
-- インデックス
-- ============================================
-- ユーザーごとの履歴取得を高速化
CREATE INDEX idx_summaries_user_id ON summaries(user_id);

-- 重複URLチェック用（同一ユーザー×同一URL）
CREATE INDEX idx_summaries_user_url ON summaries(user_id, url);

-- 新しい順にソート用
CREATE INDEX idx_summaries_created_at ON summaries(created_at DESC);

-- ============================================
-- Row Level Security（RLS）
-- ============================================
-- RLSを有効化
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のデータのみ参照可能
CREATE POLICY "Users can view own summaries"
    ON summaries
    FOR SELECT
    USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のデータのみ作成可能
CREATE POLICY "Users can insert own summaries"
    ON summaries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のデータのみ削除可能（アカウント削除時）
CREATE POLICY "Users can delete own summaries"
    ON summaries
    FOR DELETE
    USING (auth.uid() = user_id);
