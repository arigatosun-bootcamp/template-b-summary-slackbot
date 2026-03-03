---
name: codex-chat
description: Codex CLI (OpenAI) と非対話式で会話し、コードレビューや意見を求める。「Codexに聞いて」「Codexの意見」「Codexでレビュー」などのリクエスト時に使用。
---

# Codex Chat - OpenAI Codex CLI との対話

## Quick start

```bash
codex exec "質問やプロンプト"           # 非対話式で実行
codex review                            # プロジェクト全体のコードレビュー
codex exec "ファイル名 をレビューして"   # 特定ファイルのレビュー
```

## コマンド

### 基本実行
```bash
codex exec "プロンプト" 2>&1             # 非対話式でプロンプトを実行（推奨）
```

### コードレビュー
```bash
codex review                             # プロジェクト全体をレビュー
codex exec "path/to/file.ts をレビューして改善点を教えて"
```

## オプション一覧

### 主要オプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `--search` | Web検索を有効化（API仕様確認等に有用） | `codex exec --search "..."` |
| `-m, --model <MODEL>` | モデル指定 | `-m gpt-5.2-codex` |
| `-i, --image <FILE>` | 画像添付（複数可） | `-i screenshot.png` |
| `-C, --cd <DIR>` | 作業ディレクトリ指定 | `-C /path/to/project` |

### 出力制御オプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `-o, --output-last-message <FILE>` | 最終メッセージをファイル出力 | `-o result.txt` |
| `--json` | JSONL形式で出力 | `codex exec --json "..."` |
| `--output-schema <FILE>` | JSON Schemaで構造化出力 | `--output-schema schema.json` |
| `--color <always\|never\|auto>` | 色設定 | `--color never` |

### 実行制御オプション

| オプション | 説明 |
|-----------|------|
| `-s, --sandbox <MODE>` | サンドボックスモード（read-only, workspace-write, danger-full-access） |
| `--full-auto` | 自動実行モード（-a on-request + --sandbox workspace-write） |
| `--skip-git-repo-check` | Gitリポジトリ外での実行を許可 |

## 使用パターン

### 1. Web検索付きレビュー（API仕様確認等）

```bash
codex exec --search "docs/plans/openai-impl.md をレビューして。APIパラメータが正しいかWeb検索で確認して" 2>&1
```

### 2. 構造化出力でレビュー

`review-schema.json`:
```json
{
  "type": "object",
  "properties": {
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "enum": ["high", "medium", "low"] },
          "description": { "type": "string" },
          "suggestion": { "type": "string" }
        }
      }
    }
  }
}
```

```bash
codex exec --output-schema review-schema.json "src/api.ts をレビュー" 2>&1
```

### 3. コードレビュー依頼

```bash
cd /path/to/project && codex exec "src/utils/api.ts のコードをレビューして、改善点があれば教えてください" 2>&1
```

### 4. 設計・実装の意見

```bash
codex exec "このアーキテクチャ設計について意見をください: REST API vs GraphQL" 2>&1
```

### 5. バグ修正アドバイス

```bash
codex exec "このエラーの原因と解決方法を教えてください: TypeError: Cannot read property 'x' of undefined" 2>&1
```

### 6. 作業ディレクトリ指定

```bash
codex exec -C /path/to/project "package.json の依存関係を確認して" 2>&1
```

## 注意事項

- **エラー出力**: `2>&1` でstderrも含める（必須）
- **日本語対応**: 日本語プロンプトに対応
- **出力制限なし**: 完全な回答を得るため、出力制限は行わない
- **Web検索**: API仕様や最新情報の確認には `--search` を使用

## 実行例

ユーザー: 「Codexにこのファイルをレビューしてもらって」

```bash
cd /path/to/project && codex exec "対象ファイル をレビューして改善点を教えて" 2>&1
```

ユーザー: 「Codexの意見を聞きたい（Web検索も含めて）」

```bash
codex exec --search "質問内容" 2>&1
```

ユーザー: 「Codexでプロジェクト全体をレビュー」

```bash
cd /path/to/project && codex review 2>&1
```
