# CLAUDE.md と .claude/rules/ の使い分け

## ざっくり結論
- `CLAUDE.md`（または `.claude/CLAUDE.md`）は **プロジェクトの地図**（概要・導線・頻出コマンド）
- `.claude/rules/**/*.md` は **守るべき具体ルール**（トピック別に小さく）

## どんな内容をどこに書く？
### CLAUDE.md に向いている
- リポジトリの目的 / アーキ概要 / 主要ディレクトリ説明
- "まず最初に読むべき" docs のリンク
- よく使うコマンド（install/build/test/lint/format/run）
- PR の基本導線（どのCIを見るか など）

### .claude/rules/ に向いている
- コーディング規約（MUST/SHOULD）
- テストの粒度、命名、配置規約
- API設計、例外設計、ログ、セキュリティ要件
- フロント/バック/インフラなど領域別ルール
- 特定パス/言語にしか当てはまらないルール（paths を使う）

## ファイル設計のコツ
- 1ファイル=1トピック（例: testing.md, security.md）
- ファイル名は内容が分かるように
- ルールは箇条書き + MUST/SHOULD を使う
- 巨大な規約全文を貼らない（リンク/参照先に逃がす）

## ルールの格納場所

### プロジェクトルール
```
your-project/
├── .claude/
│   ├── CLAUDE.md           # プロジェクト概要
│   └── rules/
│       ├── code-style.md   # コードスタイル
│       ├── testing.md      # テスト規約
│       ├── security.md     # セキュリティ要件
│       └── frontend/       # サブディレクトリで整理可能
│           ├── react.md
│           └── styles.md
```

### ユーザーレベルルール
全プロジェクト共通のルールは `~/.claude/rules/` に配置可能：
```
~/.claude/
├── CLAUDE.md         # 個人の共通設定
└── rules/
    ├── preferences.md    # 個人のコーディング好み
    └── workflows.md      # 好みのワークフロー
```

## メモリ階層（優先順位）

高い順に適用される：

| 優先度 | 種類 | 場所 |
|-------|------|------|
| 1 (最高) | Enterprise policy | 組織全体（IT部門が配布） |
| 2 | Project memory | `./CLAUDE.md` or `./.claude/CLAUDE.md` |
| 3 | Project rules | `./.claude/rules/*.md`（自動ロード） |
| 4 | User memory | `~/.claude/CLAUDE.md` |
| 5 (最低) | Project memory (local) | `./CLAUDE.local.md`（個人用、コミットしない） |

## ルール共有のテクニック

### シンボリックリンク
複数プロジェクトで共通ルールを共有する場合：
```bash
# 共通ルールを別リポジトリで管理
ln -s ~/shared-rules/security.md .claude/rules/security.md
```

### サブディレクトリ整理
領域別にルールを整理：
```
.claude/rules/
├── general/
│   ├── code-style.md
│   └── git-workflow.md
├── frontend/
│   ├── react.md
│   └── css.md
└── backend/
    ├── api-design.md
    └── database.md
```

## フロントマター

### description（説明）
ルールの概要を記述できる：
```md
---
description: フロントエンドのReactコンポーネント規約
---

# React Component Rules
...
```

### paths（条件付き適用）
特定ファイルにのみ適用：
```md
---
paths: src/components/**/*.tsx
---

# Component Rules
...
```

詳細は `paths-frontmatter-cheatsheet.md` を参照。
