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
from http.server import BaseHTTPRequestHandler
from api.lib.scraper import fetch_article
from api.lib.llm import summarize


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

            if not url:
                self._send_error(400, "URLを入力してください")
                return

            if level not in ("簡単", "普通", "詳しく"):
                self._send_error(400, "要約レベルは「簡単」「普通」「詳しく」のいずれかを指定してください")
                return

            # スクレイピング
            article = fetch_article(url)

            # LLM要約
            summary = summarize(
                content=article["content"],
                title=article["title"],
                level=level,
            )

            # 成功レスポンス
            self._send_json(200, {
                "title": article["title"],
                "summary": summary,
                "url": url,
                "level": level,
            })

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
