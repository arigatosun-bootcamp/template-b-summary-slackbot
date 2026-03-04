# API設計書 — Summary Slackbot

## 概要

Slack Bot型アプリのため、従来のREST APIではなく **Slackイベント駆動型** の設計となる。
Vercel Python Serverless Functions でSlackからのイベントを受信し、処理を行う。

---

## エンドポイント一覧

| エンドポイント | メソッド | 用途 |
|--------------|---------|------|
| `/api/slack/events` | POST | Slackイベント受信（メイン） |
| `/api/health` | GET | ヘルスチェック |

---

## API-01: Slackイベント受信

### `POST /api/slack/events`

Slackからのすべてのイベントを受け取るエンドポイント。
メッセージの内容に応じて処理を振り分ける。

### リクエスト（Slackが自動送信）

```json
{
  "type": "event_callback",
  "event": {
    "type": "app_mention",
    "user": "U01ABC123",
    "text": "<@BOT_ID> https://example.com/article 簡単",
    "channel": "C01ABC123",
    "ts": "1709420400.000000",
    "team": "T01ABC123"
  }
}
```

### 処理フロー

```
リクエスト受信
    │
    ├── type: "url_verification" → チャレンジ応答（初回設定時のみ）
    │
    └── type: "event_callback"
          │
          ├── Bot自身の投稿 → 無視（200返却）
          │
          └── ユーザーの投稿
                │
                ├── URLあり → 要約処理へ
                │     ├── 重複チェック → 重複あり → 確認メッセージ送信
                │     └── 重複なし → スクレイピング → LLM要約 → スレッド返信 → DB保存
                │
                ├── 「履歴」を含む → 履歴表示処理へ
                │     └── DB検索 → 最新5件をスレッド返信
                │
                ├── 数字のみ（履歴選択） → 履歴詳細表示処理へ
                │     └── DB検索 → 該当要約をスレッド返信
                │
                ├── 「はい」/「いいえ」（重複確認応答） → 再要約 or 過去の要約表示
                │
                └── その他 → 「URLを追加してください」と返信
```

### レスポンス

Slackイベントには即座に `200 OK` を返す必要がある（3秒以内）。
要約処理はバックグラウンドで非同期に行い、結果はSlack APIで直接送信する。

```json
{
  "statusCode": 200
}
```

### 認証・セキュリティ

| 項目 | 方法 |
|------|------|
| リクエスト検証 | `SLACK_SIGNING_SECRET` でリクエスト署名を検証する |
| Bot認証 | `SLACK_BOT_TOKEN` でSlack APIを呼び出す |
| リプレイ攻撃対策 | リクエストのタイムスタンプが5分以内かチェックする |

---

## API-02: ヘルスチェック

### `GET /api/health`

サーバーが正常に動作しているか確認するためのエンドポイント。

### レスポンス

```json
{
  "status": "ok",
  "timestamp": "2026-03-04T10:00:00Z"
}
```

---

## 内部処理モジュール

外部エンドポイントではないが、内部で使用する処理モジュールの設計。

### M-01: スクレイピングモジュール

| 項目 | 内容 |
|------|------|
| ファイル | `api/scrape.py` |
| 入力 | URL（text） |
| 出力 | `{ "title": "記事タイトル", "content": "記事本文" }` |
| 使用ライブラリ | requests + BeautifulSoup |
| タイムアウト | 10秒 |
| エラー | URL不正 → URLError / 404 → NotFoundError / タイムアウト → TimeoutError |

### M-02: LLM要約モジュール

| 項目 | 内容 |
|------|------|
| ファイル | `api/summarize.py` |
| 入力 | `{ "content": "記事本文", "level": "簡単/普通/詳しく" }` |
| 出力 | `{ "title": "記事タイトル", "summary": "要約結果" }` |
| 使用ライブラリ | anthropic / openai（環境変数で切り替え） |
| タイムアウト | 30秒 |
| エラー | APIキー不正 → AuthError / レート制限 → RateLimitError |

### LLMプロンプト設計

```
あなたは記事要約の専門家です。
以下の記事を{要約レベル}で要約してください。

要約レベル:
- 簡単: 3行程度で要点だけを箇条書き
- 普通: 5〜8行で主要なポイントを箇条書き
- 詳しく: 15行程度で背景や詳細も含めて丁寧に説明

出力フォーマット:
- 日本語で出力
- 箇条書き形式

---
記事内容:
{content}
```

### M-03: Slack送信モジュール

| 項目 | 内容 |
|------|------|
| ファイル | `api/slack.py` |
| 機能 | スレッド返信・メッセージ更新・処理中メッセージ送信 |
| 使用API | `chat.postMessage` / `chat.update` |
| 認証 | `SLACK_BOT_TOKEN` |

### 主要メソッド

| メソッド | 用途 |
|---------|------|
| `send_loading(channel, thread_ts)` | 「要約を生成中です...」を送信 |
| `send_summary(channel, thread_ts, summary)` | 要約結果をスレッドに送信 |
| `send_error(channel, thread_ts, message)` | エラーメッセージをスレッドに送信 |
| `send_history(channel, thread_ts, histories)` | 履歴一覧をスレッドに送信 |
| `send_duplicate_confirm(channel, thread_ts, date)` | 重複URL確認メッセージを送信 |

### M-04: DB操作モジュール

| 項目 | 内容 |
|------|------|
| ファイル | `api/database.py` |
| 使用ライブラリ | supabase-py |
| 認証 | `SUPABASE_URL` + `SUPABASE_ANON_KEY` |

### 主要メソッド

| メソッド | 用途 |
|---------|------|
| `save_summary(data)` | 要約結果を保存する |
| `get_history(user_id, limit=5)` | ユーザーの要約履歴を取得する |
| `get_summary_by_id(id)` | 指定IDの要約を取得する |
| `find_by_url(workspace_id, url)` | URLで重複チェックする |
| `get_or_create_workspace(team_id, team_name, bot_token)` | ワークスペースを取得 or 作成 |
| `get_or_create_channel(workspace_id, channel_id, channel_name)` | チャンネルを取得 or 作成 |

---

## ファイル構成

```
api/
├── slack/
│   └── events.py      # POST /api/slack/events（メインエンドポイント）
├── health.py           # GET /api/health
├── scrape.py           # スクレイピングモジュール
├── summarize.py        # LLM要約モジュール
├── slack.py            # Slack送信モジュール
└── database.py         # DB操作モジュール
```

---

## シーケンス図（要約処理）

```
ユーザー        Slack        Vercel API       スクレイピング     LLM          Supabase
  │               │              │                │              │              │
  │ @bot URL      │              │                │              │              │
  │──────────────>│              │                │              │              │
  │               │ event POST   │                │              │              │
  │               │─────────────>│                │              │              │
  │               │   200 OK     │                │              │              │
  │               │<─────────────│                │              │              │
  │               │              │                │              │              │
  │               │  「生成中」   │                │              │              │
  │  スレッド返信  │<─────────────│                │              │              │
  │<──────────────│              │                │              │              │
  │               │              │ URL取得         │              │              │
  │               │              │───────────────>│              │              │
  │               │              │ HTML返却        │              │              │
  │               │              │<───────────────│              │              │
  │               │              │                │              │              │
  │               │              │ 要約依頼        │              │              │
  │               │              │───────────────────────────>│              │
  │               │              │ 要約結果        │              │              │
  │               │              │<───────────────────────────│              │
  │               │              │                │              │              │
  │               │              │ 履歴保存        │              │              │
  │               │              │──────────────────────────────────────────>│
  │               │              │ 保存完了        │              │              │
  │               │              │<──────────────────────────────────────────│
  │               │              │                │              │              │
  │               │  要約結果     │                │              │              │
  │  スレッド返信  │<─────────────│                │              │              │
  │<──────────────│              │                │              │              │
```
