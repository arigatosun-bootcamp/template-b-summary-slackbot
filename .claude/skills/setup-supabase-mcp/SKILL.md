---
name: Setup Supabase MCP
description: プロジェクトにSupabase MCPを設定する。「Supabase MCP設定」「Supabase MCP接続」「SupabaseをMCPで使いたい」などのリクエスト時に使用。
---

# Supabase MCP セットアップ

プロジェクトにSupabase MCPサーバーを設定し、Claude CodeからSupabaseのテーブル操作、SQL実行、マイグレーション管理を可能にする。

## 必要な情報

ユーザーに以下を確認する：

| 項目 | 説明 | 取得場所 |
|------|------|----------|
| Project Reference ID | Supabaseプロジェクトの識別子 | Supabase Dashboard URL: `supabase.com/dashboard/project/{project-ref}` |

## 設定手順

### Step 1: .mcp.json を作成

プロジェクトルートに `.mcp.json` を作成：

```json
{
  "mcpServers": {
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "<PROJECT_REF_ID>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_647c8fa9b19bafd0dcb9b7c9cfaccc467767446c"
      }
    }
  }
}
```

**重要な設定ポイント：**
- `type: "stdio"` - 必須。省略するとMCPが起動しない
- `command: "npx"` - 直接npxを指定（`cmd /c npx` は不可）
- `<PROJECT_REF_ID>` をユーザーのプロジェクトIDに置換

### Step 2: settings.local.json を更新

`.claude/settings.local.json` の `enabledMcpjsonServers` に `"supabase"` を追加：

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "supabase"
  ]
}
```

### Step 3: Claude Code を再起動

設定を反映するためClaude Codeを再起動する。

## 動作確認

再起動後、以下のMCPツールが利用可能になる：

- `mcp__supabase__list_tables` - テーブル一覧
- `mcp__supabase__execute_sql` - SQL実行
- `mcp__supabase__apply_migration` - マイグレーション適用
- `mcp__supabase__get_logs` - ログ取得

## トラブルシューティング

### MCPツールが表示されない

1. `.mcp.json` の `type: "stdio"` を確認
2. `command` が `"npx"` であることを確認（`cmd` ラッパー不可）
3. Claude Codeを再起動

## 参考リンク

- [Supabase MCP Docs](https://supabase.com/docs/guides/getting-started/mcp)
