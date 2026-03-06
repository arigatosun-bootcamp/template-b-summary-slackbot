"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { summarizeArticle } from "@/lib/api";
import Loading from "./Loading";

export default function SummaryForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState<"簡単" | "普通" | "詳しく">("普通");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("URLを入力してください");
      return;
    }

    // 簡易URL検証
    try {
      new URL(url.trim());
    } catch {
      setError("正しいURL形式で入力してください（例: https://example.com）");
      return;
    }

    setLoading(true);

    try {
      const result = await summarizeArticle({ url: url.trim(), level });

      // 結果をsessionStorageに保存してresultページへ遷移
      sessionStorage.setItem("summaryResult", JSON.stringify(result));
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "要約に失敗しました");
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loading />}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* URL入力 */}
        <div style={styles.field}>
          <label htmlFor="url" style={styles.label}>
            記事のURL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            style={styles.input}
            disabled={loading}
          />
        </div>

        {/* 要約レベル選択 */}
        <div style={styles.field}>
          <label style={styles.label}>要約レベル</label>
          <div style={styles.levelGroup}>
            {(["簡単", "普通", "詳しく"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                style={{
                  ...styles.levelButton,
                  ...(level === l ? styles.levelButtonActive : {}),
                }}
                disabled={loading}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && <p style={styles.error}>{error}</p>}

        {/* 送信ボタン */}
        <button
          type="submit"
          style={{
            ...styles.submitButton,
            ...(loading ? styles.submitButtonDisabled : {}),
          }}
          disabled={loading}
        >
          {loading ? "要約中..." : "要約する"}
        </button>
      </form>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#333",
  },
  input: {
    padding: "12px 16px",
    fontSize: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  levelGroup: {
    display: "flex",
    gap: "8px",
  },
  levelButton: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#555",
  },
  levelButtonActive: {
    border: "2px solid #4f46e5",
    background: "#eef2ff",
    color: "#4f46e5",
    fontWeight: 600,
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    margin: 0,
    padding: "8px 12px",
    background: "#fef2f2",
    borderRadius: "6px",
  },
  submitButton: {
    padding: "14px",
    fontSize: "16px",
    fontWeight: 600,
    color: "white",
    background: "#4f46e5",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  submitButtonDisabled: {
    background: "#9ca3af",
    cursor: "not-allowed",
  },
};
