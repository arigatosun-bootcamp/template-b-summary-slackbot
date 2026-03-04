# 開発スケジュール — Summary Slackbot

## 概要

- 作業日数: **5日間（Day1〜Day5）**
- 1Dayあたりの作業時間: **2〜3時間**
- 合計: **10〜15時間**

---

## Day1: 環境構築 + 認証機能

**ゴール: ログイン・新規登録ができてトップ画面が表示される状態**

| タスク | 内容 | 成果物 |
|--------|------|--------|
| Supabaseプロジェクト作成 | Supabaseでプロジェクト作成、`create_tables.sql`実行 | DBテーブル作成完了 |
| 環境変数設定 | `.env.local` にSupabase URL・キーを設定 | .env.local |
| Supabase Auth設定 | メール認証を有効化 | Supabase設定完了 |
| 認証画面作成 | ログイン画面・新規登録画面のUI | login/page.tsx, register/page.tsx |
| 認証処理実装 | `supabase.ts` で signUp / signIn / signOut | src/lib/supabase.ts |
| 認証ガード | `middleware.ts` で未ログインリダイレクト | src/middleware.ts |
| トップ画面（空） | ログイン後にトップ画面が表示される | src/app/page.tsx |

**確認ポイント:**
- [ ] メール+パスワードで新規登録できる
- [ ] 確認メールが届き、リンクをクリックで認証完了
- [ ] ログインしてトップ画面が表示される
- [ ] 未ログインで `/` にアクセスすると `/login` にリダイレクトされる

---

## Day2: 要約機能（スクレイピング + LLM）

**ゴール: URLを入力してAIの要約が画面に表示される状態**

| タスク | 内容 | 成果物 |
|--------|------|--------|
| URL入力フォーム | SummaryForm コンポーネント作成 | src/components/SummaryForm.tsx |
| 要約レベル選択 | 簡単/普通/詳しくのセレクトボックス | SummaryForm内 |
| ローディング表示 | Loading コンポーネント作成 | src/components/Loading.tsx |
| スクレイピングAPI | `api/lib/scraper.py` でURL→タイトル+本文 | api/lib/scraper.py |
| LLM要約API | `api/lib/llm.py` でClaude/ChatGPT対応 | api/lib/llm.py |
| 要約エンドポイント | `api/summarize.py` でメインAPI作成 | api/summarize.py |
| 要約結果画面 | SummaryResult コンポーネント作成 | src/app/result/page.tsx |
| APIクライアント | `src/lib/api.ts` でPython APIとの通信 | src/lib/api.ts |

**確認ポイント:**
- [ ] URLを入力して「要約する」を押すと要約が表示される
- [ ] 簡単/普通/詳しくで要約の長さが変わる
- [ ] 要約中にローディング表示が出る
- [ ] 存在しないURLでエラーメッセージが表示される
- [ ] LLM_PROVIDERを変えて両方で要約できる

---

## Day3: Slack投稿 + DB保存 + 履歴機能

**ゴール: 要約がSlackに投稿され、履歴画面で過去の要約が見られる状態**

| タスク | 内容 | 成果物 |
|--------|------|--------|
| Slack Webhook設定 | Slack AppでIncoming Webhook作成、URLを環境変数に設定 | .env.local（更新） |
| Slack投稿モジュール | `api/lib/slack.py` でWebhook送信 | api/lib/slack.py |
| DB保存モジュール | `api/lib/database.py` でSupabaseにデータ保存 | api/lib/database.py |
| 要約API更新 | 要約完了後にDB保存+Slack投稿を追加 | api/summarize.py（更新） |
| 履歴一覧画面 | HistoryList コンポーネント + 一覧取得API | src/app/history/page.tsx, api/history.py |
| 履歴詳細画面 | HistoryDetail コンポーネント | src/app/history/[id]/page.tsx |
| 空状態表示 | EmptyState コンポーネント（履歴0件時） | src/components/EmptyState.tsx |
| ヘッダーナビ | Header コンポーネント（トップ/履歴/設定/ログアウト） | src/components/Header.tsx |

**確認ポイント:**
- [ ] 要約完了後にSlackチャンネルに投稿される
- [ ] Supabaseのsummariesテーブルにデータが保存される
- [ ] 履歴一覧で過去の要約が新しい順に表示される
- [ ] 履歴詳細で要約内容が正しく表示される
- [ ] 履歴0件の場合「まだ要約履歴がありません」と表示

---

## Day4: 追加機能（重複チェック + アカウント削除 + 仕上げ）

**ゴール: 重複URLチェック、設定画面、レスポンシブ対応が完了した状態**

| タスク | 内容 | 成果物 |
|--------|------|--------|
| 重複URLチェック | check_url API + 確認ダイアログ | api/check_url.py, ConfirmDialog.tsx |
| 設定画面 | アカウント削除ボタン + 確認ダイアログ | src/app/settings/page.tsx |
| パスワードリセット | パスワードリセット画面 | src/app/reset-password/page.tsx |
| エラーハンドリング | 全画面のエラー表示を統一 | src/components/ErrorMessage.tsx |
| レスポンシブ対応 | スマホ表示の調整、ハンバーガーメニュー | Header.tsx（更新）、CSS |
| 認証トークン対応 | Python API側のトークン検証 | api/lib/auth.py |

**確認ポイント:**
- [ ] 同じURLを入力すると「再要約しますか？」と確認される
- [ ] アカウント削除で確認ダイアログが出る
- [ ] 削除後にログイン画面に戻り、再ログインできない
- [ ] パスワードリセットでメールが届く
- [ ] スマホでも画面が崩れない

---

## Day5: デプロイ + テスト + 仕上げ

**ゴール: Vercelにデプロイして本番環境で動く状態**

| タスク | 内容 | 成果物 |
|--------|------|--------|
| Vercelデプロイ | Vercelにデプロイ、環境変数設定 | 本番環境URL |
| Slack App更新 | Webhook URLの確認（Vercel環境） | Slack App設定 |
| エラーケーステスト | 各種エラーケースの動作確認 | テスト結果 |
| バグ修正 | テストで見つかったバグを修正 | コード修正 |
| UI調整 | 見た目の微調整 | CSS修正 |
| デモ準備 | デモ用の記事URLを準備、発表の流れを確認 | デモ手順書 |

**確認ポイント:**
- [ ] Vercel上で新規登録 → ログイン → 要約 → Slack投稿の一連の流れが動く
- [ ] 履歴機能が動作する
- [ ] エラー時に適切なメッセージが返る
- [ ] スマホからアクセスしても使える
- [ ] デモの流れがスムーズに進む

---

## 全体タイムライン

```
Day1  環境構築 + 認証機能            → 🔐 ログインできる
Day2  要約機能（スクレイピング+LLM）  → 📝 AI要約が表示される ← ここが核心
Day3  Slack投稿 + DB保存 + 履歴      → 💬 Slackに投稿 + 履歴表示
Day4  追加機能 + 仕上げ              → ✨ 完成度を上げる
Day5  デプロイ + テスト + デモ準備    → 🚀 本番稼働
```

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| Supabase Auth設定でつまずく | Day1が遅れる | 公式ドキュメントを参照、最小限の設定で進める |
| スクレイピングがうまくいかないサイトがある | 一部URLで要約できない | エラーハンドリングで対応、対応URLを限定 |
| LLM APIの応答が遅い | ユーザー体験が悪い | ローディング表示+10秒タイムアウト |
| Vercelのサーバーレス制約 | デプロイ時にエラー | ローカルで十分テストしてからデプロイ |
| フロントエンド（Next.js）の実装に時間がかかる | スケジュール遅延 | Day2のLLM要約を最優先、UIは最小限でリリース |
| Slack Webhook設定が分からない | Day3が遅れる | 公式ドキュメント + 設定手順書を事前に確認 |
