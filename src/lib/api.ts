/**
 * Python APIとの通信を行うクライアント
 */

export interface SummarizeRequest {
  url: string;
  level: "簡単" | "普通" | "詳しく";
}

export interface SummarizeResponse {
  title: string;
  summary: string;
  url: string;
  level: string;
}

export interface ApiError {
  error: string;
}

/**
 * 記事要約APIを呼び出す
 */
export async function summarizeArticle(
  request: SummarizeRequest
): Promise<SummarizeResponse> {
  const response = await fetch("/api/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).error || "要約に失敗しました");
  }

  return data as SummarizeResponse;
}
