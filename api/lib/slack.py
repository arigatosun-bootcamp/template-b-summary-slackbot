"""
Slack Incoming Webhookを使ってメッセージを投稿するモジュール
"""

import json
import os
import requests


def post_to_slack(title: str, summary: str, url: str, level: str) -> bool:
    """
    要約結果をSlackに投稿する

    Args:
        title: 記事タイトル
        summary: 要約テキスト
        url: 元記事のURL
        level: 要約レベル

    Returns:
        bool: 投稿成功ならTrue

    Raises:
        ValueError: Webhook URLが未設定、または投稿失敗の場合
    """
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not webhook_url:
        raise ValueError("SLACK_WEBHOOK_URLが設定されていません")

    # Slackメッセージのフォーマット
    message = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"📝 {title or 'タイトルなし'}",
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": summary,
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"📊 要約レベル: *{level}* | 🔗 <{url}|元記事を読む>",
                    }
                ]
            },
            {
                "type": "divider"
            }
        ]
    }

    try:
        response = requests.post(
            webhook_url,
            data=json.dumps(message),
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        if response.status_code != 200:
            raise ValueError(f"Slack投稿に失敗しました（HTTP {response.status_code}）")
        return True
    except requests.exceptions.Timeout:
        raise ValueError("Slack投稿がタイムアウトしました")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Slack投稿エラー: {str(e)}")
