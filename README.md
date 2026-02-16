# Summary Slackbot

## ブートキャンプ概要

このブートキャンプでは、**AIを活用したWebアプリ開発**を実践的に学びます。

- **対象**: エンジニア・非エンジニア問わず、AI時代の開発スキルを身につけたい方
- **学ぶこと**:
  - AIを使ったWebアプリ開発の基礎
  - 実務で使える開発フロー（Issue → ブランチ → PR → レビュー）
  - Claude等のLLMを活用した開発手法
- **最終日**: 作ったアプリをみんなの前でデモ発表

## Part B: Summary Slackbot とは？

**URLを貼るだけで、AIが内容を要約してSlackに投稿してくれる**Webアプリを作ります。

記事やドキュメントのURLを入力すると、LLM（Claude / ChatGPT）が内容を読み取って要約を生成。
その要約を指定したSlackチャンネルに自動投稿する、**日常業務で即使える実用的なアプリ**を目指します。

### 主な機能イメージ
- URLを入力 → AIがページ内容を要約
- 要約結果をSlackチャンネルに自動投稿
- 要約の履歴確認

### 使用技術
- **Next.js** (TypeScript) — フロントエンド＆API
- **Supabase** — データベース・認証
- **LLM (Claude / ChatGPT)** — 要約生成
- **Slack Incoming Webhook** — Slack投稿

---

## セットアップ

```bash
# リポジトリをクローン
git clone <your-repo-url>
cd <your-repo-name>

# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して必要な値を設定

# 開発サーバーを起動
npm run dev
```

http://localhost:3000 をブラウザで開いて確認

## スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run lint` | ESLint実行 |
| `npm test` | テスト実行 |

## ディレクトリ構成

```
├─ .github/           # PR/Issueテンプレ、CI
├─ docs/logic-gate/   # L1〜L3 Logic Gateテンプレ
├─ src/               # アプリケーションコード
├─ .env.example       # 環境変数テンプレ
└─ package.json
```
