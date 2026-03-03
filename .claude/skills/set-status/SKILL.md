---
name: set-status
description: ステータスラインのテキストを変更する。「/set-status ステータス名」で呼び出す。statusline-setupエージェントは使用禁止。
---

# Set Status - ステータスライン表示の変更

## 呼び出し方法

```
/set-status ステータステキスト
```

**例:**
- `/set-status バグ修正中`
- `/set-status API実装中`
- `/set-status` （引数なしでクリア）

## 禁止事項（重要）

以下の操作は**絶対に行わないこと**:

1. ❌ `statusline-setup`エージェントを使用しない
2. ❌ `statusline.ps1`を編集しない
3. ❌ `settings.json`を編集しない
4. ❌ ハードコードでステータスを追加しない
5. ❌ 直接ファイルに書き込まない（文字化けの原因）

## 許可された操作

✅ `set-status.ps1`スクリプトの実行のみ

## 実行手順

1. 引数からステータステキストを取得
2. 以下のコマンドを実行:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\kkttu\.claude\scripts\set-status.ps1" -Status "ステータステキスト"
```

3. 完了を報告

**引数が空または「クリア」の場合:**
```bash
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\kkttu\.claude\scripts\set-status.ps1" -Status ""
```

## 仕組み

- ステータスは `~/.claude/status/{ディレクトリ名}.txt` に保存される
- 各プロジェクト（ディレクトリ）ごとに独立したステータスを持つ
- `statusline.ps1`がこのファイルを読み取って表示する
