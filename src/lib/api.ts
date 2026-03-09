/**
 * Python APIとの通信を行うクライアント
 */

export interface SummarizeRequest {
  url: string;
  level: "簡単" | "普通" | "詳しく";
  type?: "page" | "site";
  user_id?: string;
  webhook_urls?: string[];
}

export interface SummarizeResponse {
  title: string;
  summary: string;
  url: string;
  level: string;
  type?: string;
  page_count?: number;
  id?: string;
  slack_error?: string;
}

export interface SummaryRecord {
  id: string;
  url: string;
  title: string;
  summary: string;
  summary_level: string;
  llm_provider: string;
  created_at: string;
}

export interface ApiError {
  error: string;
}

/**
 * 記事要約APIを呼び出す
 */
export async function summarizeArticle(
  request: SummarizeRequest,
  authToken?: string
): Promise<SummarizeResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch("/api/summarize", {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).error || "要約に失敗しました");
  }

  return data as SummarizeResponse;
}

/**
 * 要約履歴を取得する
 */
export async function getHistory(
  userId: string,
  authToken: string
): Promise<SummaryRecord[]> {
  const response = await fetch(
    `/api/history?user_id=${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).error || "履歴の取得に失敗しました");
  }

  return data as SummaryRecord[];
}

export interface DuplicateCheckResponse {
  exists: boolean;
  summary: SummaryRecord | null;
}

/**
 * URL重複チェック
 */
export async function checkDuplicate(
  userId: string,
  url: string,
  authToken: string
): Promise<DuplicateCheckResponse> {
  const response = await fetch(
    `/api/check_duplicate?user_id=${encodeURIComponent(userId)}&url=${encodeURIComponent(url)}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return { exists: false, summary: null };
  }

  return data as DuplicateCheckResponse;
}
