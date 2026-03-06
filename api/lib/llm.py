"""
LLM（OpenAI / Anthropic）を使ってテキストを要約するモジュール
"""

import os


# 要約レベルごとのプロンプト指示
LEVEL_INSTRUCTIONS = {
    "簡単": "3〜5文の短い要約を作成してください。専門用語は避け、誰でも分かる平易な日本語で書いてください。",
    "普通": "5〜10文程度の要約を作成してください。記事の主要なポイントを漏れなくカバーしてください。",
    "詳しく": "10〜15文程度の詳細な要約を作成してください。記事の論点、根拠、結論を構造的にまとめてください。",
}


def summarize(content: str, title: str = "", level: str = "普通", provider: str = "") -> str:
    """
    テキストをLLMで要約する

    Args:
        content: 要約対象の本文テキスト
        title: 記事タイトル（あれば）
        level: 要約レベル（簡単/普通/詳しく）
        provider: LLMプロバイダ（openai/anthropic）。空なら環境変数から取得

    Returns:
        str: 要約テキスト

    Raises:
        ValueError: API設定エラーやLLMエラーの場合
    """
    if not provider:
        provider = os.environ.get("LLM_PROVIDER", "openai")

    level_instruction = LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["普通"])

    system_prompt = (
        "あなたは記事要約の専門家です。与えられた記事の内容を日本語で要約してください。\n"
        f"{level_instruction}\n"
        "要約のみを出力し、前置きや説明は不要です。"
    )

    user_message = ""
    if title:
        user_message += f"記事タイトル: {title}\n\n"
    user_message += f"記事本文:\n{content}"

    if provider == "openai":
        return _summarize_openai(system_prompt, user_message)
    elif provider == "anthropic":
        return _summarize_anthropic(system_prompt, user_message)
    else:
        raise ValueError(f"未対応のLLMプロバイダです: {provider}")


def _summarize_openai(system_prompt: str, user_message: str) -> str:
    """OpenAI APIで要約"""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEYが設定されていません")

    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        result = response.choices[0].message.content
        if not result:
            raise ValueError("LLMから空の応答が返されました")
        return result.strip()
    except Exception as e:
        if "api_key" in str(e).lower() or "authentication" in str(e).lower():
            raise ValueError("OpenAI APIキーが無効です。設定を確認してください")
        raise ValueError(f"OpenAI APIエラー: {str(e)}")


def _summarize_anthropic(system_prompt: str, user_message: str) -> str:
    """Anthropic APIで要約"""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEYが設定されていません")

    import anthropic

    client = anthropic.Anthropic(api_key=api_key)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message},
            ],
        )
        result = response.content[0].text
        if not result:
            raise ValueError("LLMから空の応答が返されました")
        return result.strip()
    except Exception as e:
        if "api_key" in str(e).lower() or "authentication" in str(e).lower():
            raise ValueError("Anthropic APIキーが無効です。設定を確認してください")
        raise ValueError(f"Anthropic APIエラー: {str(e)}")
