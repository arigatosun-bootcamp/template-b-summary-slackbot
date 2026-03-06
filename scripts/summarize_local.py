"""
ローカル開発用: stdinからJSONを受け取り、要約結果をstdoutにJSON出力する
Next.js API RouteからPythonを呼び出すためのブリッジスクリプト
"""

import json
import sys
import os

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.lib.scraper import fetch_article
from api.lib.llm import summarize
from api.lib.slack import post_to_slack
from api.lib.database import save_summary


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        url = input_data.get("url", "").strip()
        level = input_data.get("level", "普通").strip()
        user_id = input_data.get("user_id", "")
        auth_token = input_data.get("auth_token", "")

        if not url:
            print(json.dumps({"error": "URLを入力してください"}, ensure_ascii=False), file=sys.stderr)
            sys.exit(1)

        # スクレイピング
        article = fetch_article(url)

        # LLM要約
        summary_text = summarize(
            content=article["content"],
            title=article["title"],
            level=level,
        )

        # Slack投稿（Webhook URLが設定されている場合のみ）
        slack_error = None
        if os.environ.get("SLACK_WEBHOOK_URL"):
            try:
                post_to_slack(
                    title=article["title"],
                    summary=summary_text,
                    url=url,
                    level=level,
                )
            except Exception as e:
                slack_error = str(e)

        # DB保存（user_idとauth_tokenがある場合のみ）
        saved_id = None
        if user_id and auth_token:
            try:
                result = save_summary(
                    user_id=user_id,
                    url=url,
                    title=article["title"],
                    summary=summary_text,
                    level=level,
                    llm_provider=os.environ.get("LLM_PROVIDER", "openai"),
                    auth_token=auth_token,
                )
                saved_id = result.get("id")
            except Exception:
                pass

        # 成功レスポンス
        response = {
            "title": article["title"],
            "summary": summary_text,
            "url": url,
            "level": level,
        }
        if saved_id:
            response["id"] = saved_id
        if slack_error:
            response["slack_error"] = slack_error

        print(json.dumps(response, ensure_ascii=False))

    except ValueError as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"エラーが発生しました: {str(e)}"}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
