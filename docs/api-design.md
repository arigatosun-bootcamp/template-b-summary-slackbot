# API設計書 — Summary Slackbot

## 1. API一覧

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| POST | `/api/summarize` | 記事をスクレイピング → LLM要約 → Slack投稿 | 必要 |
| POST | `/api/check-url` | 重複URLチェック | 必要 |
| GET | `/api/history` | 要約履歴一覧取得 | 必要 |
| GET | `/api/history/[id]` | 要約履歴詳細取得 | 必要 |
| GET | `/api/health` | ヘルスチェック | 不要 |

---

## 2. API詳細

### POST `/api/summarize`

記事URLを受け取り、スクレイピング → LLM要約 → DB保存 → Slack投稿を行う。

#### リクエスト

```json
{
  "url": "https://example.com/article",
  "summary_level": "普通"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| url | string | 必須 | 要約する記事のURL |
| summary_level | string | 任意 | "簡単" / "普通"（デフォルト） / "詳しく" |

#### レスポンス（成功: 200）

```json
{
  "id": "uuid-xxx",
  "title": "AIで変わるビジネスの未来",
  "summary": "・AI技術は2026年に急速に進化\n・企業の業務効率化で標準に\n...",
  "summary_level": "普通",
  "llm_provider": "anthropic",
  "url": "https://example.com/article",
  "slack_posted": true,
  "created_at": "2026-03-04T14:30:00Z"
}
```

#### エラーレスポンス

| ステータス | エラー | 説明 |
|-----------|--------|------|
| 400 | `invalid_url` | URL形式が不正 |
| 400 | `missing_url` | URLが未指定 |
| 401 | `unauthorized` | 未認証 |
| 404 | `page_not_found` | ページが存在しない |
| 422 | `scrape_failed` | スクレイピング失敗（コンテンツ取得不可） |
| 500 | `llm_error` | LLM API呼び出し失敗 |
| 500 | `slack_error` | Slack投稿失敗（要約は保存済み） |
| 504 | `timeout` | タイムアウト（10秒超過） |

```json
{
  "error": "page_not_found",
  "message": "このページは存在しません"
}
```

---

### POST `/api/check-url`

URLが過去に要約済みかチェックする。

#### リクエスト

```json
{
  "url": "https://example.com/article"
}
```

#### レスポンス（成功: 200）

```json
{
  "exists": true,
  "summary_id": "uuid-xxx",
  "title": "AIで変わるビジネスの未来",
  "summary_level": "普通",
  "created_at": "2026-03-02T10:00:00Z"
}
```

`exists: false` の場合は他のフィールドなし。

---

### GET `/api/history`

ログインユーザーの要約履歴を新しい順に取得。

#### レスポンス（成功: 200）

```json
{
  "summaries": [
    {
      "id": "uuid-xxx",
      "title": "AIで変わるビジネスの未来",
      "url": "https://example.com/article",
      "summary_level": "普通",
      "created_at": "2026-03-04T14:30:00Z"
    }
  ],
  "count": 1
}
```

履歴0件の場合: `{ "summaries": [], "count": 0 }`

---

### GET `/api/history/[id]`

指定IDの要約詳細を取得。

#### レスポンス（成功: 200）

```json
{
  "id": "uuid-xxx",
  "title": "AIで変わるビジネスの未来",
  "url": "https://example.com/article",
  "summary": "・AI技術は2026年に急速に進化\n・企業の業務効率化で標準に\n...",
  "summary_level": "普通",
  "llm_provider": "anthropic",
  "created_at": "2026-03-04T14:30:00Z"
}
```

| ステータス | エラー | 説明 |
|-----------|--------|------|
| 401 | `unauthorized` | 未認証 |
| 404 | `not_found` | 該当の要約が見つからない |

---

### GET `/api/health`

サーバーの稼働状態を確認。

#### レスポンス（成功: 200）

```json
{
  "status": "ok"
}
```

---

## 3. 認証方式

- フロントエンド（Next.js）で Supabase Auth を使ってログイン
- ログイン後のセッショントークンを API リクエスト時に Authorization ヘッダーで送信
- Python API 側でトークンを検証し、`user_id` を取得

```
Authorization: Bearer <supabase-access-token>
```

---

## 4. 内部モジュール構成

```
api/
├── summarize.py      # POST /api/summarize（メインAPI）
├── check_url.py      # POST /api/check-url
├── history.py        # GET /api/history, /api/history/[id]
├── health.py         # GET /api/health
└── lib/
    ├── scraper.py    # スクレイピング処理
    ├── llm.py        # LLM要約処理（Claude/ChatGPT切り替え）
    ├── slack.py      # Slack Webhook投稿
    ├── database.py   # Supabase DB操作
    └── auth.py       # トークン検証・ユーザー取得
```

### M-01: scraper.py（スクレイピング）

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `scrape_url(url)` | url: str | `{"title": str, "content": str}` | URLからタイトルと本文を取得 |

- `requests.get()` でHTMLを取得
- `BeautifulSoup` でタイトルと本文を抽出
- タイムアウト: 5秒
- User-Agent ヘッダーを設定

### M-02: llm.py（LLM要約）

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `summarize(content, level, provider)` | content: str, level: str, provider: str | str | 本文を要約して返す |

- `provider` が `anthropic` の場合: Anthropic SDK を使用
- `provider` が `openai` の場合: OpenAI SDK を使用
- プロンプトに要約レベルの指示を含める

### M-03: slack.py（Slack投稿）

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `post_to_slack(title, summary, url, level, user_email)` | 各str | bool | Webhookで投稿 |

- `SLACK_WEBHOOK_URL` 環境変数を使用
- 投稿成功で `True`、失敗で `False`

### M-04: database.py（DB操作）

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `save_summary(user_id, data)` | user_id: str, data: dict | dict | 要約をDBに保存 |
| `get_history(user_id)` | user_id: str | list | ユーザーの要約一覧取得 |
| `get_summary(user_id, summary_id)` | user_id: str, summary_id: str | dict | 要約詳細取得 |
| `check_url(user_id, url)` | user_id: str, url: str | dict or None | 重複URLチェック |

### M-05: auth.py（認証）

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `verify_token(request)` | request: HttpRequest | str (user_id) | トークン検証 |

- Authorization ヘッダーからトークン取得
- Supabase でトークン検証
- 無効なトークンの場合 401 エラー

---

## 5. 処理シーケンス（要約フロー）

```
ブラウザ        Next.js        Python API       Supabase      LLM API      Slack
  │               │               │               │             │           │
  │─ URL入力 ────→│               │               │             │           │
  │               │─ POST ───────→│               │             │           │
  │               │  /api/summarize│               │             │           │
  │               │               │─ 認証チェック ─→│             │           │
  │               │               │←─ user_id ────│             │           │
  │               │               │─ 重複チェック ─→│             │           │
  │               │               │←─ 結果 ───────│             │           │
  │               │               │─ スクレイピング │             │           │
  │               │               │  (requests)    │             │           │
  │               │               │─ 要約依頼 ─────┼────────────→│           │
  │               │               │←─ 要約結果 ────┼────────────│           │
  │               │               │─ DB保存 ──────→│             │           │
  │               │               │─ Slack投稿 ────┼─────────────┼──────────→│
  │               │←─ 要約結果 ───│               │             │           │
  │←─ 画面表示 ───│               │               │             │           │
```

---

## 6. 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（API側） | `eyJ...` |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL | `https://hooks.slack.com/...` |
| `OPENAI_API_KEY` | OpenAI APIキー | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic APIキー | `sk-ant-...` |
| `LLM_PROVIDER` | 使用するLLM | `anthropic` or `openai` |
