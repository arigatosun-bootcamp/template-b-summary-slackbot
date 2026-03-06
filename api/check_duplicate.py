"""
URL重複チェックAPIエンドポイント（Vercel Serverless Function）

GET /api/check_duplicate?user_id=xxx&url=xxx
Response:
  - exists: boolean
  - summary: object | null (既存の要約)
"""

import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from api.lib.database import check_duplicate


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            user_id = params.get("user_id", [""])[0]
            url = params.get("url", [""])[0]

            if not user_id or not url:
                self._send_error(400, "user_idとurlが必要です")
                return

            auth_header = self.headers.get("Authorization", "")
            auth_token = auth_header.replace("Bearer ", "") if auth_header else ""

            if not auth_token:
                self._send_error(401, "認証が必要です")
                return

            result = check_duplicate(
                user_id=user_id,
                url=url,
                auth_token=auth_token,
            )

            self._send_json(200, result)

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
