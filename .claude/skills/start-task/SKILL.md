---
name: start-task
description: GitHub Issueからブランチを作成して作業を開始する
argument-hint: "[Issue番号]"
---

# タスク開始: Issue #$ARGUMENTS

以下の手順を順番に実行してください。

## 1. Issue内容を取得

```bash
gh issue view $ARGUMENTS
```

Issueの「目的」「受け入れ条件」「確認手順」を確認してください。

## 2. mainを最新にする

```bash
git checkout main && git pull origin main
```

## 3. ブランチを作成

Issueのラベルに基づいてプレフィックスを決定してください：
- `feature` ラベル → `feat/`
- `bug` ラベル → `fix/`
- `chore` ラベル → `chore/`
- ラベルなし → `feat/`

ブランチ名: `{プレフィックス}/issue-$ARGUMENTS-{Issueタイトルを英語kebab-caseで要約}`

```bash
git checkout -b {ブランチ名}
```

## 4. 作業内容サマリーを表示

以下を整理して受講者に提示してください：

- **Issue番号**: #$ARGUMENTS
- **目的**: Issueの目的を要約
- **受け入れ条件**: 箇条書きで列挙
- **確認手順**: Issueに記載があれば表示
- **着手すべきファイル候補**: プロジェクト構造から推測

最後に「作業が完了したら `/submit-pr` でPRを作成してください」と案内してください。
