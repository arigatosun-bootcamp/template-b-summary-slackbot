"""
サイト全体をクロールして主要ページの内容を取得するモジュール
"""

import re
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup


# 会社情報に関連しそうなキーワード（URLやリンクテキストに含まれるもの）
PRIORITY_KEYWORDS = [
    "about", "company", "corporate", "profile",
    "service", "business", "product",
    "mission", "vision", "value",
    "team", "member", "staff",
    "history", "story",
    "会社概要", "会社情報", "企業情報", "企業概要",
    "事業内容", "事業紹介", "サービス",
    "代表挨拶", "代表メッセージ",
    "沿革", "ミッション", "ビジョン",
    "私たちについて", "チーム",
]

# 除外するパス（関係ないページ）
EXCLUDE_PATTERNS = [
    r"/blog/", r"/news/", r"/press/", r"/recruit/", r"/career/",
    r"/contact", r"/inquiry", r"/privacy", r"/terms", r"/sitemap",
    r"/tag/", r"/category/", r"/archive/", r"/feed/",
    r"\.(pdf|jpg|png|gif|zip|css|js)$",
    r"/wp-content/", r"/wp-admin/",
]


def crawl_site(url: str, max_pages: int = 6) -> dict:
    """
    サイトのトップページからリンクを辿り、主要ページの内容を取得する

    Args:
        url: サイトのトップURL
        max_pages: 最大取得ページ数（トップ含む）

    Returns:
        dict: {
            "site_name": str,
            "pages": [{"url": str, "title": str, "content": str}, ...]
        }
    """
    if not url or not url.strip():
        raise ValueError("URLが空です")

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; SummaryBot/1.0)"
    }

    # トップページを取得
    try:
        response = requests.get(url.strip(), headers=headers, timeout=15)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise ValueError(f"サイトに接続できませんでした: {str(e)}")

    soup = BeautifulSoup(response.text, "html.parser")

    site_name = ""
    if soup.title and soup.title.string:
        site_name = soup.title.string.strip()

    base_domain = urlparse(url).netloc

    # トップページの内容を取得
    top_content = _extract_text(soup)
    pages = [{
        "url": url,
        "title": site_name,
        "content": top_content,
    }]

    # リンクを収集してスコアリング
    links = _collect_links(soup, url, base_domain)
    scored_links = _score_links(links)

    # 上位のリンクを取得
    for link_url, _score in scored_links[:max_pages - 1]:
        try:
            resp = requests.get(link_url, headers=headers, timeout=10)
            resp.raise_for_status()
            page_soup = BeautifulSoup(resp.text, "html.parser")

            title = ""
            if page_soup.title and page_soup.title.string:
                title = page_soup.title.string.strip()

            content = _extract_text(page_soup)
            if content and len(content) > 50:
                pages.append({
                    "url": link_url,
                    "title": title,
                    "content": content[:3000],  # 各ページ3000文字まで
                })
        except Exception:
            continue  # 取得失敗はスキップ

    # 優先リンクが見つからなかった場合、浅い階層のリンクを取得
    if len(pages) == 1 and scored_links == []:
        fallback_links = [(l["url"], 1) for l in links if l["path"].count("/") <= 2][:max_pages - 1]
        for link_url, _score in fallback_links:
            try:
                resp = requests.get(link_url, headers=headers, timeout=10)
                resp.raise_for_status()
                page_soup = BeautifulSoup(resp.text, "html.parser")
                fb_title = ""
                if page_soup.title and page_soup.title.string:
                    fb_title = page_soup.title.string.strip()
                fb_content = _extract_text(page_soup)
                if fb_content and len(fb_content) > 50:
                    pages.append({
                        "url": link_url,
                        "title": fb_title,
                        "content": fb_content[:3000],
                    })
            except Exception:
                continue

    if not top_content and len(pages) <= 1:
        raise ValueError("サイトから情報を取得できませんでした。JavaScript表示のサイトには対応していません")

    return {
        "site_name": site_name,
        "pages": pages,
    }


def _extract_text(soup: BeautifulSoup) -> str:
    """ページからテキストを抽出"""
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    article = soup.find("article")
    main = soup.find("main")
    target = article or main or soup.find("body") or soup

    content = target.get_text(separator="\n", strip=True)
    lines = [line for line in content.split("\n") if line.strip()]
    return "\n".join(lines)


def _collect_links(soup: BeautifulSoup, base_url: str, base_domain: str) -> list:
    """ページ内のリンクを収集（同一ドメインのみ）"""
    links = []
    seen = set()

    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        full_url = urljoin(base_url, href)

        # 同一ドメインのみ
        parsed = urlparse(full_url)
        if parsed.netloc != base_domain:
            continue

        # フラグメントとクエリを除去して正規化
        clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if clean_url.endswith("/"):
            clean_url = clean_url[:-1]

        if clean_url in seen or clean_url == base_url.rstrip("/"):
            continue

        # 除外パターンチェック
        if any(re.search(pat, clean_url, re.IGNORECASE) for pat in EXCLUDE_PATTERNS):
            continue

        seen.add(clean_url)
        link_text = a_tag.get_text(strip=True)
        links.append({
            "url": clean_url,
            "text": link_text,
            "path": parsed.path,
        })

    return links


def _score_links(links: list) -> list:
    """リンクを重要度でスコアリング"""
    scored = []
    for link in links:
        score = 0
        text_lower = link["text"].lower()
        path_lower = link["path"].lower()

        for keyword in PRIORITY_KEYWORDS:
            if keyword.lower() in text_lower:
                score += 10
            if keyword.lower() in path_lower:
                score += 5

        # 浅い階層を優先
        depth = link["path"].count("/")
        if depth <= 2:
            score += 3
        elif depth <= 3:
            score += 1

        if score > 0:
            scored.append((link["url"], score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored
