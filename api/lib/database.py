"""
Supabaseデータベースに要約を保存・取得するモジュール
"""

import os
import requests
import json


def _get_headers(auth_token: str = "") -> dict:
    """Supabase REST APIのヘッダーを生成"""
    anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    headers = {
        "apikey": anon_key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    else:
        headers["Authorization"] = f"Bearer {anon_key}"
    return headers


def _get_base_url() -> str:
    """Supabase REST APIのベースURLを取得"""
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    if not supabase_url:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URLが設定されていません")
    return f"{supabase_url}/rest/v1"


def save_summary(
    user_id: str,
    url: str,
    title: str,
    summary: str,
    level: str,
    llm_provider: str,
    auth_token: str = "",
) -> dict:
    """
    要約結果をDBに保存する

    Args:
        user_id: ユーザーID
        url: 元記事のURL
        title: 記事タイトル
        summary: 要約テキスト
        level: 要約レベル
        llm_provider: 使用したLLMプロバイダ
        auth_token: ユーザーの認証トークン（RLS用）

    Returns:
        dict: 保存されたレコード
    """
    base_url = _get_base_url()
    headers = _get_headers(auth_token)

    data = {
        "user_id": user_id,
        "url": url,
        "title": title,
        "summary": summary,
        "summary_level": level,
        "llm_provider": llm_provider,
    }

    response = requests.post(
        f"{base_url}/summaries",
        headers=headers,
        data=json.dumps(data),
        timeout=10,
    )

    if response.status_code not in (200, 201):
        raise ValueError(f"DB保存に失敗しました: {response.text}")

    result = response.json()
    return result[0] if isinstance(result, list) else result


def get_summaries(user_id: str, auth_token: str = "", limit: int = 50) -> list:
    """
    ユーザーの要約履歴を取得する

    Args:
        user_id: ユーザーID
        auth_token: ユーザーの認証トークン（RLS用）
        limit: 取得件数上限

    Returns:
        list: 要約レコードのリスト（新しい順）
    """
    base_url = _get_base_url()
    headers = _get_headers(auth_token)

    response = requests.get(
        f"{base_url}/summaries",
        headers=headers,
        params={
            "user_id": f"eq.{user_id}",
            "order": "created_at.desc",
            "limit": limit,
        },
        timeout=10,
    )

    if response.status_code != 200:
        raise ValueError(f"履歴取得に失敗しました: {response.text}")

    return response.json()
