# `paths` フロントマター（条件付きルール）チートシート

`.claude/rules/*.md` は基本的に自動ロードされるが、
`paths` を付けると「特定のファイル群を触るときだけ」適用できる。

## 基本構文

```md
---
paths: <glob pattern>
---

# ルールタイトル
- ルール内容...
```

## Glob パターン例

| パターン | マッチ対象 |
|---------|-----------|
| `**/*.ts` | 全ディレクトリのTypeScriptファイル |
| `**/*.{ts,tsx}` | TS と TSX 両方 |
| `src/**/*` | src/ 配下の全ファイル |
| `*.md` | プロジェクトルートのMarkdownファイル |
| `src/components/*.tsx` | 特定ディレクトリのReactコンポーネント |
| `tests/**/*.test.ts` | テストファイル |
| `{src,lib}/**/*.ts` | 複数ディレクトリ |

## 複数パターン指定

カンマ区切りで複数パターンを指定可能：

```md
---
paths: src/components/**/*.tsx, src/pages/**/*.tsx
---
```

## 使用例

### API 層にだけ適用
```md
---
paths: src/api/**/*.ts
---

# API Development Rules
- MUST validate inputs (zod etc.)
- MUST return standard error shape
- SHOULD add OpenAPI comments
```

### フロントエンドコンポーネントにだけ適用
```md
---
paths: src/components/**/*.{tsx,jsx}
---

# React Component Rules
- MUST use functional components
- MUST include PropTypes or TypeScript interfaces
- SHOULD keep components under 200 lines
```

### テストファイルにだけ適用
```md
---
paths: **/*.test.{ts,tsx}, **/*.spec.{ts,tsx}
---

# Testing Rules
- MUST follow AAA pattern (Arrange, Act, Assert)
- MUST mock external dependencies
- SHOULD aim for 80% coverage
```

### 設定ファイルにだけ適用
```md
---
paths: *.config.{js,ts,mjs}, .*.{js,json}
---

# Configuration File Rules
- MUST document non-obvious settings
- SHOULD use environment variables for secrets
```

### 特定ディレクトリ（複数）に適用
```md
---
paths: src/models/**/*.ts, src/services/**/*.ts
---

# Business Logic Rules
- MUST include JSDoc comments
- MUST handle errors explicitly
- SHOULD use dependency injection
```

## description との併用

`paths` と `description` を両方使用可能：

```md
---
description: Next.js App Router ページ専用のルール
paths: app/**/*.tsx, app/**/page.tsx
---

# Next.js App Router Rules
- MUST use server components by default
- MUST add 'use client' only when necessary
- SHOULD use loading.tsx for suspense
```

## 注意点

- `paths` がないルールは常に適用される
- `paths` があるルールは、マッチするファイルを操作する時のみ適用
- 複数ルールファイルが同じパスにマッチする場合、すべて適用される
- glob パターンはプロジェクトルートからの相対パス
