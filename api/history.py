"""
要約履歴取得APIエンドポイント（Vercel Serverless Function）

GET /api/history?user_id=xxx
Request Headers:
  - Authorization: Bearer <token>
Response:
  - list of summary records
"""

import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from api.lib.database import get_summaries


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # クエリパラメータからuser_idを取得
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            user_id = params.get("user_id", [""])[0]

            if not user_id:
                self._send_error(400, "user_idが必要です")
                return

            # 認証トークン取得
            auth_header = self.headers.get("Authorization", "")
            auth_token = auth_header.replace("Bearer ", "") if auth_header else ""

            if not auth_token:
                self._send_error(401, "認証が必要です")
                return

            # 履歴取得
            summaries = get_summaries(
                user_id=user_id,
                auth_token=auth_token,
            )

            self._send_json(200, summaries)

        except ValueError as e:
            self._send_error(400, str(e))
        except Exception as e:
            self._send_error(500, f"サーバーエラー: {str(e)}")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def _send_json(self, status: int, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _send_error(self, status: int, message: str):
        self._send_json(status, {"error": message})

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
