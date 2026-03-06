"""
記事要約APIエンドポイント（Vercel Serverless Function）

POST /api/summarize
Request Body:
  - url: string (必須) 要約対象のURL
  - level: string (任意) 要約レベル（簡単/普通/詳しく）デフォルト: 普通
Response:
  - title: string 記事タイトル
  - summary: string 要約テキスト
  - url: string 元のURL
  - level: string 要約レベル
"""

import json
import os
from http.server import BaseHTTPRequestHandler
from api.lib.scraper import fetch_article
from api.lib.llm import summarize, summarize_site
from api.lib.crawler import crawl_site
from api.lib.slack import post_to_slack
from api.lib.database import save_summary


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # リクエストボディの読み取り
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                self._send_error(400, "リクエストボディが空です")
                return

            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self._send_error(400, "JSONの形式が正しくありません")
                return

            # パラメータ取得
            url = data.get("url", "").strip()
            level = data.get("level", "普通").strip()
            summary_type = data.get("type", "page").strip()

            if not url:
                self._send_error(400, "URLを入力してください")
                return

            if level not in ("簡単", "普通", "詳しく"):
                self._send_error(400, "要約レベルは「簡単」「普通」「詳しく」のいずれかを指定してください")
                return

            if summary_type == "site":
                # サイト全体要約モード
                site_data = crawl_site(url)
                title = site_data["site_name"]
                summary = summarize_site(
                    pages=site_data["pages"],
                    site_name=site_data["site_name"],
                    level=level,
                )
                page_count = len(site_data["pages"])
            else:
                # ページ要約モード（従来）
                article = fetch_article(url)
                title = article["title"]
                summary = summarize(
                    content=article["content"],
                    title=article["title"],
                    level=level,
                )
                page_count = 1

            # Slack投稿
            slack_error = None
            webhook_urls = data.get("webhook_urls", [])
            # フロントから指定がなければ環境変数を使用
            if not webhook_urls and os.environ.get("SLACK_WEBHOOK_URL"):
                webhook_urls = [os.environ.get("SLACK_WEBHOOK_URL")]

            if webhook_urls:
                try:
                    post_to_slack(
                        title=title,
                        summary=summary,
                        url=url,
                        level=level,
                        webhook_urls=webhook_urls,
                    )
                except Exception as e:
                    slack_error = str(e)

            # DB保存（認証トークンがある場合のみ）
            saved_id = None
            auth_header = self.headers.get("Authorization", "")
            user_id = data.get("user_id", "")
            auth_token = auth_header.replace("Bearer ", "") if auth_header else ""

            if user_id and auth_token:
                try:
                    result = save_summary(
                        user_id=user_id,
                        url=url,
                        title=title,
                        summary=summary,
                        level=level,
                        llm_provider=os.environ.get("LLM_PROVIDER", "openai"),
                        auth_token=auth_token,
                    )
                    saved_id = result.get("id")
                except Exception:
                    pass

            # 成功レスポンス
            response_data = {
                "title": title,
                "summary": summary,
                "url": url,
                "level": level,
                "type": summary_type,
                "page_count": page_count,
            }
            if saved_id:
                response_data["id"] = saved_id
            if slack_error:
                response_data["slack_error"] = slack_error

            self._send_json(200, response_data)

        except ValueError as e:
            self._send_error(400, str(e))
        except Exception as e:
            self._send_error(500, f"サーバーエラーが発生しました: {str(e)}")

    def do_OPTIONS(self):
        """CORSプリフライトリクエスト対応"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _send_error(self, status: int, message: str):
        self._send_json(status, {"error": message})

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
