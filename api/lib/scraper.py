"""
URLからWebページのコンテンツを取得するスクレイピングモジュール
"""

import requests
from bs4 import BeautifulSoup


def fetch_article(url: str) -> dict:
    """
    指定URLからページタイトルと本文テキストを取得する

    Args:
        url: スクレイピング対象のURL

    Returns:
        dict: {"title": str, "content": str}

    Raises:
        ValueError: URLが空、またはHTTPエラーの場合
    """
    if not url or not url.strip():
        raise ValueError("URLが空です")

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; SummaryBot/1.0)"
    }

    try:
        response = requests.get(url.strip(), headers=headers, timeout=15)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise ValueError("ページの取得がタイムアウトしました（15秒）")
    except requests.exceptions.ConnectionError:
        raise ValueError("ページに接続できませんでした。URLを確認してください")
    except requests.exceptions.HTTPError as e:
        raise ValueError(f"ページの取得に失敗しました（HTTP {e.response.status_code}）")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"ページの取得に失敗しました: {str(e)}")

    soup = BeautifulSoup(response.text, "html.parser")

    # タイトル取得
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    # 不要な要素を除去
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    # 本文テキスト取得
    # articleタグがあればそれを優先、なければbody全体
    article = soup.find("article")
    if article:
        content = article.get_text(separator="\n", strip=True)
    else:
        body = soup.find("body")
        if body:
            content = body.get_text(separator="\n", strip=True)
        else:
            content = soup.get_text(separator="\n", strip=True)

    # 空行の連続を整理
    lines = [line for line in content.split("\n") if line.strip()]
    content = "\n".join(lines)

    if not content:
        raise ValueError("ページから本文を取得できませんでした")

    # 長すぎる場合は先頭を切り出し（トークン節約）
    max_chars = 8000
    if len(content) > max_chars:
        content = content[:max_chars] + "\n...(以下省略)"

    return {
        "title": title,
        "content": content,
    }
