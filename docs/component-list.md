# コンポーネント一覧 — Summary Slackbot

## 概要

Slack Bot型アプリのため、フロントエンドコンポーネントではなく **Pythonモジュール** の構成を定義する。

---

## ファイル構成

```
api/
├── slack/
│   └── events.py        # Slackイベント受信（メインエンドポイント）
├── health.py             # ヘルスチェック
├── scrape.py             # スクレイピングモジュール
├── summarize.py          # LLM要約モジュール
├── slack_client.py       # Slack送信モジュール
├── database.py           # DB操作モジュール
├── message_parser.py     # メッセージ解析モジュール
└── config.py             # 環境変数・設定管理
```

---

## コンポーネント詳細

### C-01: イベントハンドラ — `api/slack/events.py`

| 項目 | 内容 |
|------|------|
| 責務 | Slackからのイベントを受信し、処理を振り分ける |
| エンドポイント | `POST /api/slack/events` |
| 依存先 | message_parser, scrape, summarize, slack_client, database |

| 処理 | 説明 |
|------|------|
| URL検証応答 | Slack初回設定時のチャレンジ応答 |
| Bot自身のフィルタ | Bot自身の投稿を無視する |
| メッセージ振り分け | URLあり→要約 / 「履歴」→履歴表示 / その他→案内メッセージ |

---

### C-02: メッセージ解析 — `api/message_parser.py`

| 項目 | 内容 |
|------|------|
| 責務 | メッセージからURL・要約レベル・コマンドを解析する |
| 依存先 | なし |

| 関数 | 入力 | 出力 | 説明 |
|------|------|------|------|
| `parse_message(text)` | メッセージ本文 | `ParsedMessage` | メッセージを解析して構造化する |
| `extract_url(text)` | メッセージ本文 | `str / None` | URLを抽出する |
| `detect_level(text)` | メッセージ本文 | `簡単 / 普通 / 詳しく` | 要約レベルを判定する |
| `detect_command(text)` | メッセージ本文 | `summary / history / confirm / unknown` | コマンド種別を判定する |

**ParsedMessage の構造:**
```python
{
    "command": "summary",         # summary / history / confirm / unknown
    "url": "https://example.com", # URLまたはNone
    "level": "普通",              # 簡単 / 普通 / 詳しく
    "raw_text": "元のメッセージ"
}
```

---

### C-03: スクレイピング — `api/scrape.py`

| 項目 | 内容 |
|------|------|
| 責務 | URLからページ内容を取得・抽出する |
| 依存先 | requests, beautifulsoup4 |

| 関数 | 入力 | 出力 | 説明 |
|------|------|------|------|
| `scrape_url(url)` | URL文字列 | `ScrapedContent` | ページのタイトルと本文を取得する |
| `extract_text(html)` | HTML文字列 | 本文テキスト | HTMLから本文テキストを抽出する |
| `validate_url(url)` | URL文字列 | `bool` | URLが有効か検証する |

**ScrapedContent の構造:**
```python
{
    "title": "記事タイトル",
    "content": "記事の本文テキスト...",
    "url": "https://example.com/article"
}
```

**エラー:**
| エラー | 条件 |
|--------|------|
| `InvalidURLError` | URLの形式が不正 |
| `NotFoundError` | ページが404 |
| `ScrapingError` | コンテンツを取得できない |
| `TimeoutError` | 10秒以内にレスポンスなし |

---

### C-04: LLM要約 — `api/summarize.py`

| 項目 | 内容 |
|------|------|
| 責務 | 記事の内容をLLMで要約する |
| 依存先 | anthropic, openai, config |

| 関数 | 入力 | 出力 | 説明 |
|------|------|------|------|
| `summarize(content, level)` | 記事本文, 要約レベル | 要約テキスト | LLMで要約を生成する |
| `build_prompt(content, level)` | 記事本文, 要約レベル | プロンプト文字列 | LLMへのプロンプトを構築する |
| `call_anthropic(prompt)` | プロンプト | LLMレスポンス | Claude APIを呼び出す |
| `call_openai(prompt)` | プロンプト | LLMレスポンス | OpenAI APIを呼び出す |

**エラー:**
| エラー | 条件 |
|--------|------|
| `LLMAuthError` | APIキーが無効 |
| `LLMRateLimitError` | レート制限に到達 |
| `LLMTimeoutError` | 30秒以内にレスポンスなし |

---

### C-05: Slack送信 — `api/slack_client.py`

| 項目 | 内容 |
|------|------|
| 責務 | Slackへのメッセージ送信を担当する |
| 依存先 | slack_sdk, config |

| 関数 | 入力 | 出力 | 説明 |
|------|------|------|------|
| `send_loading(channel, thread_ts)` | チャンネルID, スレッドTS | メッセージTS | 「生成中」メッセージを送信 |
| `send_summary(channel, thread_ts, title, summary, url)` | 各種パラメータ | メッセージTS | 要約結果をスレッドに送信 |
| `send_error(channel, thread_ts, message)` | チャンネルID, スレッドTS, エラー文 | メッセージTS | エラーメッセージを送信 |
| `send_history(channel, thread_ts, histories)` | チャンネルID, スレッドTS, 履歴リスト | メッセージTS | 履歴一覧を送信 |
| `send_duplicate_confirm(channel, thread_ts, date)` | チャンネルID, スレッドTS, 前回日付 | メッセージTS | 重複URL確認を送信 |
| `send_usage(channel, thread_ts)` | チャンネルID, スレッドTS | メッセージTS | 使い方案内を送信 |

---

### C-06: DB操作 — `api/database.py`

| 項目 | 内容 |
|------|------|
| 責務 | Supabaseとのデータやり取りを担当する |
| 依存先 | supabase-py, config |

| 関数 | 入力 | 出力 | 説明 |
|------|------|------|------|
| `save_summary(data)` | 要約データ | 保存結果 | 要約を保存する |
| `get_history(user_id, limit=5)` | ユーザーID, 件数 | 履歴リスト | 要約履歴を取得する |
| `get_summary_by_id(id)` | 要約ID | 要約データ | 指定IDの要約を取得する |
| `find_by_url(workspace_id, url)` | ワークスペースID, URL | 要約データ / None | URL重複チェック |
| `get_or_create_workspace(team_id, team_name, bot_token)` | チーム情報 | ワークスペースデータ | ワークスペースを取得 or 作成 |
| `get_or_create_channel(workspace_id, channel_id, name)` | チャンネル情報 | チャンネルデータ | チャンネルを取得 or 作成 |

---

### C-07: 設定管理 — `api/config.py`

| 項目 | 内容 |
|------|------|
| 責務 | 環境変数の読み込みと設定値の管理 |
| 依存先 | os |

| 設定値 | 環境変数 | デフォルト値 |
|--------|---------|------------|
| `SLACK_BOT_TOKEN` | `SLACK_BOT_TOKEN` | なし（必須） |
| `SLACK_SIGNING_SECRET` | `SLACK_SIGNING_SECRET` | なし（必須） |
| `ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY` | なし |
| `OPENAI_API_KEY` | `OPENAI_API_KEY` | なし |
| `LLM_PROVIDER` | `LLM_PROVIDER` | `anthropic` |
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | なし（必須） |
| `SUPABASE_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | なし（必須） |
| `SCRAPE_TIMEOUT` | `SCRAPE_TIMEOUT` | `10`（秒） |
| `LLM_TIMEOUT` | `LLM_TIMEOUT` | `30`（秒） |

---

### C-08: ヘルスチェック — `api/health.py`

| 項目 | 内容 |
|------|------|
| 責務 | サーバーの稼働確認 |
| エンドポイント | `GET /api/health` |
| 依存先 | なし |

---

## 依存関係図

```
events.py（メインエンドポイント）
    │
    ├── message_parser.py（メッセージ解析）
    │
    ├── scrape.py（スクレイピング）
    │       └── requests, beautifulsoup4
    │
    ├── summarize.py（LLM要約）
    │       ├── anthropic
    │       ├── openai
    │       └── config.py
    │
    ├── slack_client.py（Slack送信）
    │       ├── slack_sdk
    │       └── config.py
    │
    └── database.py（DB操作）
            ├── supabase-py
            └── config.py
```

---

## 使用ライブラリ（requirements.txt）

| ライブラリ | 用途 |
|-----------|------|
| `slack-bolt` | Slackイベント処理フレームワーク |
| `slack-sdk` | Slack API呼び出し |
| `requests` | HTTP通信 |
| `beautifulsoup4` | HTML解析 |
| `anthropic` | Claude API |
| `openai` | OpenAI API |
| `supabase` | Supabase操作 |
