---
name: writing-project-rules
description: Claude Code のプロジェクトメモリ（CLAUDE.md / .claude/CLAUDE.md）と .claude/rules/**/*.md のルールを設計・生成・整理する。巨大な CLAUDE.md の分割、paths フロントマター（glob）を使ったファイル別ルール作成、既存ルールの棚卸しを行う場合に使用する。
---

# Writing Project Rules

この Skill は、Claude Code の「メモリ（CLAUDE.md 系）」と「ルール（.claude/rules/）」を **新規作成・整理・分割・更新**するための作業手順を提供する。

## この Skill の守備範囲

**基本方針**
- 原則として編集対象は **メモリ/ルール関連ファイルのみ**：
  - `./CLAUDE.md` または `./.claude/CLAUDE.md`
  - `./.claude/rules/**/*.md`
  - `./CLAUDE.local.md`（必要なら）
  - 既存の関連ドキュメント（例: `README.md`）は参照はするが勝手に大改修しない
- アプリコードの修正は、ユーザーが明示的に依頼した場合のみ行う

**最重要の注意**
- ルール/メモリは自動ロードされる前提のため、機密情報（APIキー、トークン、URLの秘密パラメータ、個人情報等）は絶対に書かない。
- 具体的な秘密値は「どこに置くべきか」「形式」だけを書く（例: `.env に入れる / 1Password を使う` 等）。

## 作業フロー（必ずこの順で）

### 0) 目的確認（最小限）
- 目的が「新規作成」か「既存整理/分割」かを判断
- 既存のメモリ置き場がある場合は **場所を変えない**（移動は原則しない）
- これから作る出力の“粒度”を決める：
  - CLAUDE.md は短め（概略と頻出コマンド）
  - 詳細は `.claude/rules/` へ分割

### 1) 現状インベントリ（読む）
次を確認し、存在するものは全て要点をメモする：
- `./CLAUDE.md` と `./.claude/CLAUDE.md`
- `./.claude/rules/` 配下（サブディレクトリ含む）
- `./CLAUDE.local.md`
- `README.md`, `CONTRIBUTING.md`, `docs/`（あれば）
- ビルド/テスト/実行コマンドが分かるファイル：
  - `package.json`, `Makefile`, `pyproject.toml`, `requirements.txt`, `go.mod`, など

### 2) “ルール設計案”を提示（書く前に必ず出す）
ユーザーに次を提示する（この段階ではまだファイルに書かない）：
- 新規作成/更新するファイル一覧（パス付き）
- 各ファイルに何を書くか（1〜3行で要約）
- `paths`（条件付き適用）が必要なファイルの候補と、候補glob

例：
- `.claude/CLAUDE.md`：プロジェクト概要 + よく使うコマンド
- `.claude/rules/testing.md`：テスト方針/コマンド/命名規約
- `.claude/rules/frontend/react.md`：React だけの規約（paths 付き）
- `.claude/rules/backend/api.md`：API 層だけの規約（paths 付き）

### 3) 内容ドラフト（テンプレート活用）
以下のテンプレートを必要に応じて参照してドラフトする：
- CLAUDE.md テンプレート：`templates/claude-md.template.md`
- ルールファイルテンプレート：`templates/rule.template.md`
- スターター例：`templates/templates-starter-rules/*.md`

### 4) 反映（Write/Edit）
- **必ず**「作る/更新するファイル一覧」を再掲し、意図が合っているか確認してから書く
- 既存ファイルがある場合は「追記」よりも「整理（見出し/箇条書き化）」を優先
- 1ファイル=1トピック（肥大化させない）

### 5) 仕上げチェック
- ルールが重複/矛盾していないか（特に general と language-specific）
- `paths` の glob が過剰に広すぎないか
- 機密情報が入っていないか
- `.claude/rules/` のファイル名が内容を表しているか

## ルールの分割指針（強い推奨）

- `CLAUDE.md`：プロジェクトの「地図」
  - 何のリポジトリか / 主要ディレクトリ / 重要ドキュメント / よく使うコマンド
- `.claude/rules/`：実務の「守るべき規約」
  - コードスタイル、テスト、セキュリティ、API設計、フロント/バック固有規約、など

詳細：
- どちらに書くべきか → `references/rules-vs-memory.md`
- `paths` の書き方 → `references/paths-frontmatter-cheatsheet.md`

## Examples（この Skill が起動しやすい依頼例）

- 「このリポジトリに Claude Code 用の `.claude/rules/` を整備して。まずは現状を見て構成案を出して」
- 「巨大な `CLAUDE.md` を、`.claude/rules/` にトピック別に分割して」
- 「`src/api/**` だけに適用されるルールを `paths` 付きで作って」
- 「このプロジェクトのテスト/ビルドコマンドを README や package.json から拾って memory にまとめて」
