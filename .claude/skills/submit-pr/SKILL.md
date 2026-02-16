---
name: submit-pr
description: 現在のブランチからテンプレート付きPRを作成する
---

# PR作成ワークフロー

以下の手順を順番に実行してください。

## 1. 事前チェック

```bash
git branch --show-current
```

- **mainブランチなら中止**: 「mainブランチではPRを作成できません。先に `/start-task [Issue番号]` でブランチを切ってください」と案内
- 未コミットの変更を確認:
```bash
git status --short
```
- 未コミットがあれば警告して、コミットするか確認

## 2. lint / テスト実行

```bash
npm run lint
```

```bash
npm test
```

- **どちらか失敗したら中止**: エラー内容を表示して修正を促す
- 両方パスしたら次へ進む

## 3. リモートにpush

```bash
git push -u origin $(git branch --show-current)
```

## 4. Issue番号を抽出

ブランチ名（例: `feat/issue-5-add-slack-webhook`）から `issue-{番号}` のパターンでIssue番号を抽出してください。

## 5. Issue内容を取得

```bash
gh issue view {Issue番号}
```

## 6. PR本文を生成

`.github/pull_request_template.md` のフォーマットに従い、以下を埋めてください：

- **目的**: Issueの目的をそのまま引用
- **変更点**: `git diff main...HEAD --stat` の結果から主要な変更を箇条書き
- **動作確認**: Issueの確認手順を引用し、実際にどう確認できるか記載
- **リスク / 影響範囲**: 変更が影響しうる範囲を記載
- **関連Issue**: `Closes #{Issue番号}`

## 7. Draft PRを作成

```bash
gh pr create --draft --title "{PRタイトル}" --body "{上で生成したPR本文}"
```

PRタイトルはIssueタイトルをそのまま使うか、変更内容を端的に表現してください。

## 8. 結果を表示

作成したPRのURLを表示し、「レビュー依頼の準備ができたらDraftを外してください」と案内してください。
