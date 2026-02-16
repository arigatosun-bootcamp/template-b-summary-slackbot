#!/bin/bash
# セッション開始時に自動でプロジェクト状態を表示するフック

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

echo "=========================================="
echo "  Summary Slackbot - セッション開始"
echo "=========================================="

echo ""
echo "--- 現在のブランチ ---"
git branch --show-current 2>/dev/null || echo "(git未初期化)"

echo ""
echo "--- 未コミットの変更 ---"
CHANGES=$(git status --short 2>/dev/null)
if [ -z "$CHANGES" ]; then
  echo "(なし)"
else
  echo "$CHANGES"
fi

echo ""
echo "--- オープン中のIssue（上位5件）---"
gh issue list --state open --limit 5 2>/dev/null || echo "(gh CLI未設定 - gh auth login を実行してください)"

echo ""
echo "--- オープン中のPR ---"
gh pr list --state open --limit 5 2>/dev/null || echo "(gh CLI未設定)"

echo ""
echo "=========================================="
echo "  コマンド: /start-task /submit-pr /daily-check /workflow-status"
echo "=========================================="
