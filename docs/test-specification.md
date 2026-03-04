# テスト仕様書 — Summary Slackbot

## 概要

L3テスト計画をベースに、各モジュールの詳細なテストケースを定義する。

---

## 1. メッセージ解析テスト（message_parser）

| ID | 種別 | テスト内容 | 入力 | 期待結果 |
|----|------|-----------|------|---------|
| MP-01 | 正常 | URLのみのメッセージを解析 | `@bot https://example.com` | command=summary, url=https://example.com, level=普通 |
| MP-02 | 正常 | URL+「簡単」を解析 | `@bot https://example.com 簡単` | command=summary, url=https://example.com, level=簡単 |
| MP-03 | 正常 | URL+「詳しく」を解析 | `@bot https://example.com 詳しく` | command=summary, url=https://example.com, level=詳しく |
| MP-04 | 正常 | URL+「普通」を解析 | `@bot https://example.com 普通` | command=summary, url=https://example.com, level=普通 |
| MP-05 | 正常 | 「履歴」メッセージを解析 | `@bot 履歴` | command=history |
| MP-06 | 正常 | 数字メッセージを解析 | `@bot 3` | command=confirm, raw_text=3 |
| MP-07 | 正常 | 「はい」を解析 | `@bot はい` | command=confirm, raw_text=はい |
| MP-08 | 正常 | 「いいえ」を解析 | `@bot いいえ` | command=confirm, raw_text=いいえ |
| MP-09 | 異常 | URLなしテキストを解析 | `@bot こんにちは` | command=unknown, url=None |
| MP-10 | 異常 | 空メッセージを解析 | `@bot` | command=unknown, url=None |
| MP-11 | 境界 | 不正なURL形式 | `@bot not-a-url` | command=unknown, url=None |
| MP-12 | 境界 | 複数URLを含むメッセージ | `@bot https://a.com https://b.com` | 最初のURLのみ抽出 |
| MP-13 | 正常 | 要約レベルが不明な単語 | `@bot https://example.com ちょっと` | command=summary, level=普通（デフォルト） |

---

## 2. スクレイピングテスト（scrape）

| ID | 種別 | テスト内容 | 入力 | 期待結果 |
|----|------|-----------|------|---------|
| SC-01 | 正常 | 通常のHTMLページを取得 | 有効なURL | title, contentが取得される |
| SC-02 | 正常 | 日本語ページを取得 | 日本語記事URL | 文字化けなくtitle, contentが取得される |
| SC-03 | 異常 | 存在しないURL | `https://example.com/404` | NotFoundError |
| SC-04 | 異常 | 無効なURL形式 | `not-a-url` | InvalidURLError |
| SC-05 | 異常 | タイムアウト | レスポンスの遅いURL | TimeoutError（10秒） |
| SC-06 | 異常 | アクセス拒否サイト | 403を返すURL | ScrapingError |
| SC-07 | 境界 | 本文が極端に短いページ | 内容1行のページ | contentが取得される（空にならない） |
| SC-08 | 境界 | 本文が極端に長いページ | 1万文字以上のページ | 適切に切り詰められる |
| SC-09 | 正常 | HTTPSページを取得 | HTTPS URL | 正常に取得される |
| SC-10 | 異常 | HTTPのみのページ | HTTP URL | HTTPSにリダイレクト or エラー |

---

## 3. LLM要約テスト（summarize）

| ID | 種別 | テスト内容 | 入力 | 期待結果 |
|----|------|-----------|------|---------|
| LM-01 | 正常 | 普通レベルで要約 | 記事本文, level=普通 | 5〜8行の箇条書き要約 |
| LM-02 | 正常 | 簡単レベルで要約 | 記事本文, level=簡単 | 3行程度の箇条書き要約 |
| LM-03 | 正常 | 詳しくレベルで要約 | 記事本文, level=詳しく | 15行程度の詳細な要約 |
| LM-04 | 正常 | Claude APIで要約 | LLM_PROVIDER=anthropic | Claude APIが呼ばれる |
| LM-05 | 正常 | OpenAI APIで要約 | LLM_PROVIDER=openai | OpenAI APIが呼ばれる |
| LM-06 | 異常 | APIキーが無効 | 無効なAPIキー | LLMAuthError |
| LM-07 | 異常 | レート制限到達 | 大量のリクエスト | LLMRateLimitError |
| LM-08 | 異常 | APIタイムアウト | レスポンスが遅い | LLMTimeoutError（30秒） |
| LM-09 | 正常 | 要約結果が日本語 | 英語記事 | 日本語で要約される |
| LM-10 | 境界 | 極端に短い記事 | 1文のみの記事 | エラーにならず要約される |
| LM-11 | 境界 | 極端に長い記事 | 1万文字以上の記事 | 適切にトークン制限内で要約される |
| LM-12 | 正常 | プロンプトが正しく構築される | level=簡単 | 「3行程度」の指示がプロンプトに含まれる |

---

## 4. Slack送信テスト（slack_client）

| ID | 種別 | テスト内容 | 入力 | 期待結果 |
|----|------|-----------|------|---------|
| SL-01 | 正常 | 処理中メッセージを送信 | channel, thread_ts | 「要約を生成中です...」がスレッドに投稿される |
| SL-02 | 正常 | 要約結果を送信 | channel, thread_ts, title, summary, url | フォーマット通りにスレッドに投稿される |
| SL-03 | 正常 | エラーメッセージを送信 | channel, thread_ts, error_message | エラーメッセージがスレッドに投稿される |
| SL-04 | 正常 | 履歴一覧を送信 | channel, thread_ts, histories(5件) | 番号付きリストがスレッドに投稿される |
| SL-05 | 正常 | 重複確認を送信 | channel, thread_ts, date | 「再要約しますか？」がスレッドに投稿される |
| SL-06 | 正常 | 使い方案内を送信 | channel, thread_ts | 使い方メッセージがスレッドに投稿される |
| SL-07 | 異常 | 無効なBot Token | 無効なトークン | Slack APIエラー |
| SL-08 | 正常 | DMで送信 | DM channel | DMに正常に投稿される |

---

## 5. DB操作テスト（database）

| ID | 種別 | テスト内容 | 入力 | 期待結果 |
|----|------|-----------|------|---------|
| DB-01 | 正常 | 要約を保存 | 要約データ | summariesテーブルに保存される |
| DB-02 | 正常 | 履歴を取得（5件） | user_id, limit=5 | 最新5件が降順で返る |
| DB-03 | 正常 | 履歴を取得（3件のみ存在） | user_id, limit=5 | 3件が返る（エラーにならない） |
| DB-04 | 境界 | 履歴が0件 | user_id（履歴なし） | 空配列が返る（エラーにならない） |
| DB-05 | 正常 | IDで要約を取得 | summary_id | 該当する要約データが返る |
| DB-06 | 異常 | 存在しないIDで取得 | 無効なID | Noneが返る |
| DB-07 | 正常 | URL重複チェック（重複あり） | 既存URL | 該当する要約データが返る |
| DB-08 | 正常 | URL重複チェック（重複なし） | 新規URL | Noneが返る |
| DB-09 | 正常 | ワークスペースを新規作成 | 新規team_id | workspacesに保存される |
| DB-10 | 正常 | 既存ワークスペースを取得 | 既存team_id | 既存データが返る（重複作成されない） |
| DB-11 | 正常 | チャンネルを新規作成 | 新規channel_id | channelsに保存される |
| DB-12 | 正常 | 既存チャンネルを取得 | 既存channel_id | 既存データが返る |
| DB-13 | 異常 | DB接続エラー | 無効なSupabase URL | 接続エラー |

---

## 6. イベントハンドラ統合テスト（events）

| ID | 種別 | テスト内容 | 入力 | 期待結果 |
|----|------|-----------|------|---------|
| EV-01 | 正常 | URL検証応答 | type=url_verification | チャレンジ値を返す |
| EV-02 | 正常 | 通常の要約リクエスト | `@bot URL` | 200 OK → 要約がスレッドに返信される |
| EV-03 | 正常 | 要約レベル指定リクエスト | `@bot URL 簡単` | 200 OK → 簡単な要約が返信される |
| EV-04 | 正常 | 履歴表示リクエスト | `@bot 履歴` | 200 OK → 履歴一覧が返信される |
| EV-05 | 正常 | 履歴詳細リクエスト | `@bot 2` | 200 OK → 該当の要約が返信される |
| EV-06 | 正常 | 重複URL確認→はい | `@bot はい` | 再要約が実行される |
| EV-07 | 正常 | 重複URL確認→いいえ | `@bot いいえ` | 過去の要約が再表示される |
| EV-08 | 異常 | URLなしメッセージ | `@bot こんにちは` | 「URLを追加してください」と返信 |
| EV-09 | 異常 | Bot自身の投稿 | bot_idが自分 | 無視される（200 OK、返信なし） |
| EV-10 | 異常 | メンションなし | URLのみ（メンションなし） | 無視される |
| EV-11 | 異常 | 存在しないURL | `@bot https://example.com/404` | 「このページは存在しません」と返信 |
| EV-12 | 異常 | LLMエラー | APIが停止中 | 「要約の生成に失敗しました」と返信 |
| EV-13 | 境界 | 応答が30秒以上 | 長い記事 | 「生成に時間がかかっています」と通知 |
| EV-14 | 正常 | DMでの要約リクエスト | DM内でURL送信 | 要約がDMに返信される |
| EV-15 | 正常 | 署名検証 | 正しいSigning Secret | リクエストが処理される |
| EV-16 | 異常 | 署名検証失敗 | 不正なSigning Secret | 401 Unauthorized |

---

## 7. ヘルスチェックテスト（health）

| ID | 種別 | テスト内容 | 入力 | 期待結果 |
|----|------|-----------|------|---------|
| HC-01 | 正常 | ヘルスチェック | GET /api/health | `{ "status": "ok" }` が返る |

---

## テストケース集計

| カテゴリ | 正常 | 異常 | 境界 | 合計 |
|---------|------|------|------|------|
| メッセージ解析 | 8 | 2 | 3 | 13 |
| スクレイピング | 3 | 4 | 3 | 10 |
| LLM要約 | 6 | 3 | 3 | 12 |
| Slack送信 | 6 | 1 | 1 | 8 |
| DB操作 | 8 | 2 | 1 | 13 (※SL-08を修正) |
| イベントハンドラ | 8 | 5 | 1 | 16 (※EV-14, 15を修正) |
| ヘルスチェック | 1 | 0 | 0 | 1 |
| **合計** | **40** | **17** | **12** | **73** |
