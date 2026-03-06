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


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        url = input_data.get("url", "").strip()
        level = input_data.get("level", "普通").strip()

        if not url:
            print(json.dumps({"error": "URLを入力してください"}, ensure_ascii=False), file=sys.stderr)
            sys.exit(1)

        # スクレイピング
        article = fetch_article(url)

        # LLM要約
        summary = summarize(
            content=article["content"],
            title=article["title"],
            level=level,
        )

        # 成功レスポンス
        result = {
            "title": article["title"],
            "summary": summary,
            "url": url,
            "level": level,
        }
        print(json.dumps(result, ensure_ascii=False))

    except ValueError as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"エラーが発生しました: {str(e)}"}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
