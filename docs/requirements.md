# 要件定義書 — Summary Slackbot

## 1. プロジェクト概要

### 1.1 プロジェクト名
Summary Slackbot

### 1.2 概要
SlackチャンネルでBotにメンション付きでURLを投稿すると、AIが記事の内容を要約しスレッドで返信するSlack Bot。
要約のレベル（簡単・普通・詳しく）をテキストで指定でき、URLのみの場合は「普通」で要約される。

### 1.3 背景・目的
- **誰が困っている？**: 長い文章を読むのが苦手なビジネスパーソン
- **何に困っている？**: 気になる記事を見つけても、長すぎて読むまでに至れない
- **どう解決する？**: SlackにURLを貼るだけでAIがわかりやすく要約してくれるBotを作る

### 1.4 ターゲットユーザー
- 個人利用（自分用の情報収集ツール）
- Slackワークスペースを日常的に使用している人

---

## 2. 機能要件

### 2.1 記事要約機能（メイン機能）
- `@bot URL` でメンションするとBotが記事を要約し、スレッドで返信する
- 要約レベルを3段階で指定できる
  - `@bot URL 簡単` → 短い要約
  - `@bot URL` → 普通の要約（デフォルト）
  - `@bot URL 詳しく` → 詳細な要約
- 対応するURL: ニュース記事・ブログ記事（HTML）
- 要約の出力言語: 日本語のみ

### 2.2 履歴機能
- 過去の要約履歴をデータベース（Supabase）に保存する
- Botに「履歴」と伝えると、過去の要約タイトルを新しい順に一覧表示する
- 一覧から読みたいタイトルを伝えると、過去の要約を再表示する

### 2.3 Bot動作仕様
- チャンネル・DMの両方で動作する
- Botへのメンション付きメッセージにのみ反応する
- Bot自身の投稿には反応しない（無限ループ防止）
- URLが含まれないメッセージには「URLを追加してください」と返信する
- 存在しないページのURLには「このページは存在しません」と返信する

### 2.4 LLM連携
- Claude（Anthropic API）とChatGPT（OpenAI API）の両方に対応する
- 環境変数 `LLM_PROVIDER` で切り替える（`anthropic` または `openai`）

---

## 3. 非機能要件

### 3.1 パフォーマンス
- 要約の応答時間: 30秒以内
- 30秒以上かかる場合は「生成に時間がかかっています」とメッセージで通知する

### 3.2 エラーハンドリング
- AIのAPIエラー時: エラー内容をメッセージで通知する
- スクレイピング失敗時: 「このURLの内容を取得できませんでした」と通知する
- 要約レベルの指定ミス時: デフォルト（普通）で要約し、指定方法を案内する

### 3.3 セキュリティ
- APIキー（Anthropic / OpenAI）は環境変数で管理し、ハードコードしない
- Slack Bot Token・Signing Secretは環境変数で管理する

---

## 4. 技術構成

### 4.1 アーキテクチャ

```
[Slack] ←→ [Vercel Python Serverless Functions]
                    ├── Slackイベント受信・返信
                    ├── スクレイピング (requests + BeautifulSoup)
                    ├── LLM要約 (anthropic / openai SDK)
                    └── 履歴保存 (Supabase)
```

### 4.2 使用技術

| レイヤー | 技術 | 用途 |
|---------|------|------|
| Slack連携 | **Slack Bolt for Python** | Botイベント処理・メッセージ送信 |
| スクレイピング | **requests** + **BeautifulSoup** | URLからページ内容を抽出 |
| LLM | **anthropic** / **openai** (Python SDK) | 要約生成 |
| データベース | **Supabase** | 要約履歴の保存 |
| デプロイ | **Vercel** (Python Serverless Functions) | Bot APIサーバー |

### 4.3 環境変数

| 変数名 | 説明 |
|--------|------|
| `SLACK_BOT_TOKEN` | Slack Bot User OAuth Token |
| `SLACK_SIGNING_SECRET` | Slack Signing Secret |
| `ANTHROPIC_API_KEY` | Anthropic APIキー |
| `OPENAI_API_KEY` | OpenAI APIキー |
| `LLM_PROVIDER` | 使用するLLM（`anthropic` または `openai`） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |

---

## 5. スコープ

### 5.1 今回やること
- Slack Botの構築（メンションでURL要約）
- 要約レベルの3段階指定
- 要約履歴の保存・表示
- Claude / ChatGPT の切り替え対応

### 5.2 今回やらないこと
- Web画面（フロントエンド）の構築
- ユーザー認証（ログイン・登録）
- PDF・動画など HTML以外のコンテンツの要約
- 複数URLの同時要約
- 過去の要約からのおすすめ機能
