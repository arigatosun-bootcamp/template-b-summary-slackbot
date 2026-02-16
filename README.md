# template-b-summary-slackbot

Bootcamp Part B: Summary Slackbot テンプレートリポジトリ

## セットアップ

```bash
# リポジトリをクローン
git clone <your-repo-url>
cd template-b-summary-slackbot

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
