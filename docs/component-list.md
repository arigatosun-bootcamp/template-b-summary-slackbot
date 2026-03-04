# コンポーネント一覧 — Summary Slackbot

## 1. フロントエンド（Next.js / TypeScript）

### 1.1 ページコンポーネント

| ID | ファイル | URL | 説明 |
|----|---------|-----|------|
| P-01 | `src/app/login/page.tsx` | `/login` | ログイン画面 |
| P-02 | `src/app/register/page.tsx` | `/register` | 新規登録画面 |
| P-03 | `src/app/reset-password/page.tsx` | `/reset-password` | パスワードリセット画面 |
| P-04 | `src/app/page.tsx` | `/` | トップ画面（要約入力） |
| P-05 | `src/app/result/page.tsx` | `/result` | 要約結果画面 |
| P-06 | `src/app/history/page.tsx` | `/history` | 履歴一覧画面 |
| P-07 | `src/app/history/[id]/page.tsx` | `/history/[id]` | 履歴詳細画面 |
| P-08 | `src/app/settings/page.tsx` | `/settings` | 設定画面 |
| P-09 | `src/app/layout.tsx` | — | 共通レイアウト |

### 1.2 UIコンポーネント

| ID | ファイル | 説明 | 使用画面 |
|----|---------|------|---------|
| C-01 | `src/components/Header.tsx` | ヘッダー（ロゴ、ナビリンク、ログアウト） | 認証済み全画面 |
| C-02 | `src/components/SummaryForm.tsx` | URL入力フォーム + 要約レベル選択 | トップ画面 |
| C-03 | `src/components/SummaryResult.tsx` | 要約結果表示（タイトル、箇条書き、URL） | 要約結果画面 |
| C-04 | `src/components/HistoryList.tsx` | 履歴一覧リスト | 履歴一覧画面 |
| C-05 | `src/components/HistoryDetail.tsx` | 履歴詳細表示 | 履歴詳細画面 |
| C-06 | `src/components/Loading.tsx` | ローディング表示（スピナー + テキスト） | トップ画面（処理中） |
| C-07 | `src/components/ErrorMessage.tsx` | エラーメッセージ表示 | 全画面 |
| C-08 | `src/components/ConfirmDialog.tsx` | 確認ダイアログ（削除、重複URL） | 設定画面、トップ画面 |
| C-09 | `src/components/EmptyState.tsx` | 空状態表示（「まだ履歴がありません」等） | 履歴一覧画面 |
| C-10 | `src/components/LevelBadge.tsx` | 要約レベルバッジ（簡単/普通/詳しく） | 履歴一覧、詳細 |

### 1.3 ユーティリティ

| ID | ファイル | 説明 |
|----|---------|------|
| U-01 | `src/lib/supabase.ts` | Supabase クライアント初期化 |
| U-02 | `src/lib/api.ts` | Python API への fetch ラッパー |
| U-03 | `src/middleware.ts` | 認証ガード（未ログインリダイレクト） |

---

## 2. バックエンド（Python / Vercel Serverless Functions）

### 2.1 APIエンドポイント

| ID | ファイル | エンドポイント | 説明 |
|----|---------|--------------|------|
| A-01 | `api/summarize.py` | POST `/api/summarize` | 記事要約メインAPI |
| A-02 | `api/check_url.py` | POST `/api/check-url` | 重複URLチェック |
| A-03 | `api/history.py` | GET `/api/history` | 履歴一覧取得 |
| A-04 | `api/health.py` | GET `/api/health` | ヘルスチェック |

### 2.2 内部モジュール

| ID | ファイル | 説明 |
|----|---------|------|
| M-01 | `api/lib/scraper.py` | スクレイピング（requests + BeautifulSoup） |
| M-02 | `api/lib/llm.py` | LLM要約（Claude / ChatGPT切り替え） |
| M-03 | `api/lib/slack.py` | Slack Incoming Webhook投稿 |
| M-04 | `api/lib/database.py` | Supabase DB操作（保存・取得・チェック） |
| M-05 | `api/lib/auth.py` | トークン検証・ユーザーID取得 |

---

## 3. ディレクトリ構成

```
├── .github/              # PR/Issueテンプレ、CI
├── api/                   # Python Serverless Functions
│   ├── summarize.py       # POST /api/summarize
│   ├── check_url.py       # POST /api/check-url
│   ├── history.py         # GET /api/history
│   ├── health.py          # GET /api/health
│   └── lib/
│       ├── scraper.py     # スクレイピング
│       ├── llm.py         # LLM要約
│       ├── slack.py       # Slack投稿
│       ├── database.py    # DB操作
│       └── auth.py        # 認証
├── docs/                  # 設計ドキュメント
├── src/                   # Next.js フロントエンド
│   ├── app/
│   │   ├── layout.tsx     # 共通レイアウト
│   │   ├── page.tsx       # トップ画面
│   │   ├── login/
│   │   ├── register/
│   │   ├── reset-password/
│   │   ├── result/
│   │   ├── history/
│   │   │   └── [id]/
│   │   └── settings/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── SummaryForm.tsx
│   │   ├── SummaryResult.tsx
│   │   ├── HistoryList.tsx
│   │   ├── HistoryDetail.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   └── LevelBadge.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   └── middleware.ts
├── supabase/
│   └── create_tables.sql
├── .env.example
├── package.json
├── requirements.txt
└── vercel.json
```

---

## 4. 依存ライブラリ

### package.json（Node.js）

| ライブラリ | 用途 |
|-----------|------|
| `next` | Webフレームワーク |
| `react` / `react-dom` | UI構築 |
| `@supabase/supabase-js` | Supabase クライアント |
| `typescript` | 型チェック |

### requirements.txt（Python）

| ライブラリ | 用途 |
|-----------|------|
| `requests` | HTTP通信（スクレイピング、Slack投稿） |
| `beautifulsoup4` | HTML解析 |
| `anthropic` | Claude API |
| `openai` | ChatGPT API |
| `supabase` | Supabase Python クライアント |

---

## 5. コンポーネント依存関係

```
ブラウザ
  │
  ├── layout.tsx ─── Header.tsx
  │
  ├── login/page.tsx
  ├── register/page.tsx
  ├── reset-password/page.tsx
  │       └── lib/supabase.ts（認証API呼び出し）
  │
  ├── page.tsx（トップ）
  │       ├── SummaryForm.tsx
  │       ├── Loading.tsx
  │       ├── ConfirmDialog.tsx（重複URL時）
  │       └── lib/api.ts → POST /api/summarize
  │                       → POST /api/check-url
  │
  ├── result/page.tsx
  │       ├── SummaryResult.tsx
  │       └── LevelBadge.tsx
  │
  ├── history/page.tsx
  │       ├── HistoryList.tsx
  │       ├── EmptyState.tsx
  │       ├── LevelBadge.tsx
  │       └── lib/api.ts → GET /api/history
  │
  ├── history/[id]/page.tsx
  │       ├── HistoryDetail.tsx
  │       ├── LevelBadge.tsx
  │       └── lib/api.ts → GET /api/history/[id]
  │
  └── settings/page.tsx
          ├── ConfirmDialog.tsx
          └── lib/supabase.ts（アカウント削除）

Python API
  │
  ├── summarize.py
  │       ├── lib/auth.py
  │       ├── lib/scraper.py
  │       ├── lib/llm.py
  │       ├── lib/database.py
  │       └── lib/slack.py
  │
  ├── check_url.py
  │       ├── lib/auth.py
  │       └── lib/database.py
  │
  ├── history.py
  │       ├── lib/auth.py
  │       └── lib/database.py
  │
  └── health.py（依存なし）
```
