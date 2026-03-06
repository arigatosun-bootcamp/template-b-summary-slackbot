# Summary Slackbot

## ブートキャンプ概要

このブートキャンプでは、**AIを活用したWebアプリ開発**を実践的に学びます。

- **対象**: エンジニア・非エンジニア問わず、AI時代の開発スキルを身につけたい方
- **学ぶこと**:
  - AIを使ったWebアプリ開発の基礎（フロントエンド + バックエンドAPI）
  - Pythonによるスクレイピング・LLM連携
  - 実務で使える開発フロー（Issue → ブランチ → PR → レビュー）
  - Claude等のLLMを活用した開発手法
- **最終日**: 作ったアプリをみんなの前でデモ発表

## Part B: Summary Slackbot とは？

**URLを貼るだけで、AIが内容を要約してSlackに投稿してくれる**Webアプリを作ります。

記事やドキュメントのURLを入力すると、Python製のバックエンドAPIがページ内容をスクレイピングし、LLM（Claude / ChatGPT）が要約を生成。
その要約を指定したSlackチャンネルに自動投稿する、**日常業務で即使える実用的なアプリ**を目指します。

### 主な機能イメージ
- URLを入力 → AIがページ内容を要約
- 要約結果をSlackチャンネルに自動投稿
- 要約の履歴確認

### アーキテクチャ

```
[ブラウザ] → [Next.js (フロントエンド)]
                    │
                    ▼
            [Python API (Vercel Serverless Functions)]
            ├── スクレイピング (requests + BeautifulSoup)
            ├── LLM要約 (anthropic / openai SDK)
            └── Slack投稿 (requests)
                    │
                    ▼
              [Supabase (データベース)]
```

### 使用技術

| レイヤー | 技術 | 用途 |
|---------|------|------|
| フロントエンド | **Next.js** (TypeScript) | UI・ページ表示 |
| バックエンドAPI | **Python** (Vercel Serverless Functions) | スクレイピング・LLM連携・Slack投稿 |
| スクレイピング | **requests** + **BeautifulSoup** | URLからページ内容を抽出 |
| LLM | **anthropic** / **openai** (Python SDK) | 要約生成 |
| データベース | **Supabase** | 要約履歴の保存・認証 |
| Slack連携 | **Slack Incoming Webhook** | 要約のSlack投稿 |
| デプロイ | **Vercel** | フロント・Python API をまとめてデプロイ |

> **ポイント**: Vercelは `/api` ディレクトリにPythonファイルを配置すると、自動的にサーバーレス関数としてデプロイされます。Next.js（TypeScript）とPython APIを**1つのリポジトリ・1つのデプロイ先**で運用できます。

---

## セットアップ

### 前提条件

- **Node.js** v18以上
- **Python** 3.9以上
- **npm** または **yarn**

### インストール手順

```bash
# リポジトリをクローン
git clone <your-repo-url>
cd <your-repo-name>

# Node.js 依存パッケージをインストール（フロントエンド）
npm install

# Python 依存パッケージをインストール（バックエンドAPI）
pip install -r requirements.txt

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して必要な値を設定
```

### 開発サーバーの起動

```bash
# Next.js 開発サーバーを起動（Python APIも自動で動作）
npm run dev
```

http://localhost:3000 をブラウザで開いて確認

> **Note**: Vercel CLIを使うとローカルでもPython Serverless Functionsを動作確認できます。
> ```bash
> npm i -g vercel
> vercel dev
> ```

---

## ディレクトリ構成

```
├─ .github/              # PR/Issueテンプレ、CI
├─ api/                  # Python Serverless Functions（Vercel）
│   ├── summarize.py     # 要約APIエンドポイント（スクレイピング→LLM要約→Slack投稿→DB保存）
│   ├── history.py       # 要約履歴取得API
│   ├── check_duplicate.py  # URL重複チェックAPI
│   └── lib/             # 共通モジュール
│       ├── scraper.py   # スクレイピング（requests + BeautifulSoup）
│       ├── llm.py       # LLM要約（OpenAI / Anthropic）
│       ├── slack.py     # Slack Incoming Webhook投稿
│       └── database.py  # Supabase DB操作
├─ scripts/              # ローカル開発用スクリプト
│   └── summarize_local.py
├─ docs/                 # 設計書・仕様書
├─ src/                  # Next.js アプリケーションコード（TypeScript）
│   ├── app/
│   │   ├── layout.tsx       # 共通レイアウト
│   │   ├── page.tsx         # トップページ（要約フォーム）
│   │   ├── login/           # ログインページ
│   │   ├── register/        # 新規登録ページ
│   │   ├── result/          # 要約結果ページ
│   │   ├── history/         # 要約履歴ページ
│   │   ├── settings/        # 設定ページ
│   │   ├── auth/callback/   # メール認証コールバック
│   │   └── api/             # ローカル開発用APIプロキシ
│   ├── components/
│   │   ├── Header.tsx       # ヘッダー（ハンバーガーメニュー対応）
│   │   ├── SummaryForm.tsx  # 要約フォーム
│   │   └── Loading.tsx      # ローディング表示
│   └── lib/
│       ├── api.ts           # Python APIクライアント
│       ├── supabase.ts      # ブラウザ用Supabaseクライアント
│       └── supabase-server.ts  # サーバー用Supabaseクライアント
├─ .env.example          # 環境変数テンプレ
├─ package.json          # Node.js 依存管理
├─ requirements.txt      # Python 依存管理
└─ vercel.json           # Vercel設定
```

### `api/` ディレクトリについて

`api/` 配下の `.py` ファイルは、Vercelが自動的にサーバーレス関数として認識します。

- `api/summarize.py` → `POST /api/summarize`（スクレイピング→要約→Slack投稿→DB保存を1回のリクエストで実行）
- `api/history.py` → `GET /api/history`（要約履歴の取得）
- `api/check_duplicate.py` → `GET /api/check_duplicate`（URL重複チェック）

フロントエンド（Next.js）から `fetch('/api/summarize', ...)` で呼び出せます。

---

## スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | Next.js 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run lint` | ESLint実行 |
| `npm test` | テスト実行 |

---

## 環境変数

`.env.example` を `.env.local` にコピーして値を設定してください。

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL |
| `SLACK_CHANNEL` | 投稿先Slackチャンネル |
| `OPENAI_API_KEY` | OpenAI APIキー |
| `ANTHROPIC_API_KEY` | Anthropic APIキー |
| `LLM_PROVIDER` | 使用するLLM（`openai` または `anthropic`） |

---

## デプロイ（Vercel）

1. [Vercel](https://vercel.com) にGitHubリポジトリを連携
2. 環境変数をVercelダッシュボードで設定
3. プッシュすると自動デプロイ（Next.js + Python API が同時にデプロイされる）

> **制約事項**: Vercelの Python Serverless Functions では Playwright などのブラウザ自動化ライブラリは使用できません。スクレイピングには `requests` + `BeautifulSoup` を使用します。
