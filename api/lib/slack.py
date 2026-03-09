"""
Slack Incoming Webhookを使ってメッセージを投稿するモジュール
"""

import json
import os
import requests


def post_to_slack(title: str, summary: str, url: str, level: str, webhook_urls: list = None) -> list:
    """
    要約結果をSlackに投稿する（複数Webhook対応）

    Args:
        title: 記事タイトル
        summary: 要約テキスト
        url: 元記事のURL
        level: 要約レベル
        webhook_urls: 投稿先Webhook URLのリスト。Noneなら環境変数を使用

    Returns:
        list: 各投稿先の結果 [{"url": str, "success": bool, "error": str|None}]
    """
    if not webhook_urls:
        default_url = os.environ.get("SLACK_WEBHOOK_URL", "")
        if not default_url:
            raise ValueError("SLACK_WEBHOOK_URLが設定されていません")
        webhook_urls = [default_url]

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

    results = []
    for wh_url in webhook_urls:
        try:
            response = requests.post(
                wh_url,
                data=json.dumps(message),
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            if response.status_code != 200:
                results.append({"url": wh_url[:30], "success": False, "error": f"HTTP {response.status_code}"})
            else:
                results.append({"url": wh_url[:30], "success": True, "error": None})
        except requests.exceptions.RequestException as e:
            results.append({"url": wh_url[:30], "success": False, "error": str(e)})

    if not any(r["success"] for r in results):
        raise ValueError("全てのSlack投稿先への投稿に失敗しました")

    return results
